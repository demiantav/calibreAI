import { fetchYouTubeChannelStats } from "../../content-pipeline/tools/youtube.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";
import { mcpManager } from "../../../infrastructure/mcp/mcp-manager.js";
import { generatePitchUseCase } from "../../brand-deals/use-cases/generate-pitch.js";
import { calculateSponsorshipUseCase } from "../../brand-deals/use-cases/calculate-sponsorship.js";
import { gmail } from "../../../infrastructure/gmail/gmail-client.js";
import { ensureGmailAuth } from "../../../shared/gmail-auth.js";
import { config } from "../../../shared/config.js";

function normalizeEmail(email: string): string {
  return email.replace(/.*<([^>]+)>.*/, '$1').replace(/["']/g, '').trim().toLowerCase();
}

function decodeRFC2047(input: string): string {
  return input.replace(/=\?([^?]+)\?[Bb]\?([^?]*)\?=/g, (_m: string, charset: string, encoded: string) => {
    try {
      const bytes = Buffer.from(encoded, 'base64');
      return new TextDecoder(charset).decode(bytes);
    } catch {
      return encoded;
    }
  });
}

async function fetchEmailByGmailId(gmailId: string): Promise<{ from: string; subject: string; snippet: string }> {
  await ensureGmailAuth();
  const detail = await gmail.users.messages.get({ userId: 'me', id: gmailId });
  const headers = detail.data.payload?.headers || [];
  const rawSubject = headers.find((h: any) => h.name === 'Subject')?.value || '';
  const from = headers.find((h: any) => h.name === 'From')?.value || '';

  // Safety: no generar pitch contra el propio usuario
  if (from.includes(config.AUTHENTICATED_USER_EMAIL)) {
    throw new Error(`El email ${gmailId} es del propio usuario (${config.AUTHENTICATED_USER_EMAIL}), saltando.`);
  }

  return {
    from,
    subject: decodeRFC2047(rawSubject),
    snippet: detail.data.snippet || '',
  };
}

/**
 * Mapeo de nombres de funciones a implementaciones reales.
 */
export const functionsImplementations = {
  getYouTubeMetrics: async ({ channelId }: { channelId: string }) => {
    console.log(`[Tool Executor] Ejecutando getYouTubeMetrics para ${channelId}...`);
    return await fetchYouTubeChannelStats(channelId);
  },
  
  getPreviousInsights: async ({ creatorName }: { creatorName: string }) => {
    console.log(`[Tool Executor] Recuperando memoria para ${creatorName}...`);
    const { data, error } = await supabase
      .from('agent_logs')
      .select('content, insights, created_at')
      .eq('creator_name', creatorName)
      .order('created_at', { ascending: false })
      .limit(3); // Traemos los últimos 3 recuerdos

    if (error) {
      console.error("[Tool Executor] Error recuperando memoria:", error);
      return [];
    }
    return data;
  },
  
  updateLiveMediaKit: async (data: any) => {
    console.log(`[Tool Executor] Persistiendo Media Kit en Supabase para ${data.creatorName}...`);
    
    const { error } = await supabase
      .from('agent_logs')
      .insert([
        { 
          creator_name: data.creatorName, 
          type: 'media_kit_update',
          content: data.metrics,
          insights: data.insights
        }
      ]);

    if (error) {
      console.error("[Tool Executor] Error al guardar en Supabase:", error);
      return { status: "error", message: error.message };
    }

    return { status: "success", message: "Media Kit persistido en Supabase" };
  },

  // Herramientas de Gmail (usando Gmail API directa para evitar stdout contaminado del MCP)
  listEmails: async (args: { maxResults?: number }) => {
    console.warn('[Tool Executor] Usando Gmail API directa...');
    await ensureGmailAuth();

    try {
      const response = await gmail.users.messages.list({ userId: 'me', maxResults: args.maxResults || 5 });
      const messages = response.data.messages || [];

      // Obtener IDs de emails ya procesados (dedup)
      const { data: processed } = await supabase
        .from('processed_emails')
        .select('gmail_id');
      const processedSet = new Set(processed?.map(r => r.gmail_id) || []);

      const details = await Promise.all(
        messages.map(async (msg: any) => {
          const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
          const headers = detail.data.payload?.headers || [];
          const rawSubject = headers.find((h: any) => h.name === 'Subject')?.value || '';
          return {
            id: msg.id,
            snippet: detail.data.snippet,
            subject: decodeRFC2047(rawSubject),
            from: headers.find((h: any) => h.name === 'From')?.value,
          };
        })
      );

      // Filtrar emails ya procesados y del propio usuario
      const filtered = details.filter((msg: any) =>
        !processedSet.has(msg.id) && !msg.from?.includes(config.AUTHENTICATED_USER_EMAIL)
      );
      if (filtered.length < details.length) {
        console.log(`[Tool Executor] Filtrados ${details.length - filtered.length} emails ya procesados`);
      }

      return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
    } catch (gmailError: any) {
      if (gmailError.message?.includes('not been used') || gmailError.message?.includes('disabled')) {
        console.error('[Tool Executor] Gmail API no habilitada. Activá la API en: https://console.cloud.google.com/apis/library/gmail.googleapis.com');
      }
      throw gmailError;
    }
  },

  sendEmail: async (args: { to: string; subject: string; body: string }) => {
    const isHealthy = await mcpManager.healthCheck();
    if (!isHealthy) {
      throw new Error("MCP Server is unhealthy. Cannot send email.");
    }
    return await mcpManager.callTool('send_email', args);
  },

  // Sponsorship Forecasting
  calculateSponsorshipValue: async (args: { creatorName: string; subscribers: number; totalViews: number; lastVideoViews: number; lastVideoLikes?: number; lastVideoComments?: number; engagementRate?: number; niche: string }) => {
    console.log(`[Tool Executor] Calculando sponsorship value para ${args.creatorName}...`);
    const forecast = await calculateSponsorshipUseCase({
      creatorName: args.creatorName,
      subscribers: args.subscribers,
      totalViews: args.totalViews,
      lastVideoViews: args.lastVideoViews,
      lastVideoLikes: args.lastVideoLikes,
      lastVideoComments: args.lastVideoComments,
      engagementRate: args.engagementRate,
      niche: args.niche,
    });
    console.log(`[Tool Executor] Forecast: mención $${forecast.mention.min}-$${forecast.mention.max}`);
    return forecast;
  },

  // Auto-Pitch Engine
  generateAndDraftPitch: async (args: { creatorName: string; pitchStyle?: string; gmailId: string }) => {
    console.log(`[Tool Executor] Generando pitch para gmailId ${args.gmailId}...`);

    // --- DEDUP 1: Por gmailId en processed_emails ---
    const { data: already } = await supabase
      .from('processed_emails')
      .select('gmail_id')
      .eq('gmail_id', args.gmailId)
      .maybeSingle();
    if (already) {
      console.log(`[Tool Executor] ⏭️ Email ya procesado, saltando: ${args.gmailId}`);
      return { status: "skipped", brandName: args.gmailId, message: "Email ya procesado anteriormente." };
    }

    // --- DEDUP 2: Por gmailId en agent_logs (respaldo) ---
    const { data: existingPitch } = await supabase
      .from('agent_logs')
      .select('id')
      .eq('type', 'pitch_draft')
      .filter('content->>gmailId', 'eq', args.gmailId)
      .limit(1)
      .maybeSingle();
    if (existingPitch) {
      console.log(`[Tool Executor] ⏭️ Pitch ya existe en agent_logs para gmailId ${args.gmailId}, saltando...`);
      return { status: "skipped", brandName: args.gmailId, message: "Pitch ya existe para este gmailId." };
    }

    // --- Obtener datos reales del email desde Gmail API ---
    let emailData: { from: string; subject: string; snippet: string };
    try {
      emailData = await fetchEmailByGmailId(args.gmailId);
    } catch (err: any) {
      console.error(`[Tool Executor] Error obteniendo email ${args.gmailId}:`, err);
      throw new Error(`No se pudo obtener el email ${args.gmailId} de Gmail: ${err.message}`);
    }

    // Extraer brandName y brandEmail del From
    const rawFrom = emailData.from;
    const brandEmail = normalizeEmail(rawFrom);
    const brandName = rawFrom.replace(/^"?(.*?)"?\s*<.*$/, '$1').trim() || emailData.subject.split(/[-–—]/)[0]?.trim() || 'Marca detectada';
    const brandContext = `${emailData.subject}: ${emailData.snippet}`;

    console.log(`[Tool Executor] Email real: "${emailData.subject}" de ${rawFrom}`);

    const result = await generatePitchUseCase({
      creatorName: args.creatorName,
      brandName,
      brandEmail,
      brandContext,
      pitchStyle: args.pitchStyle,
      gmailId: args.gmailId,
      originalEmailFrom: rawFrom,
      originalEmailSubject: emailData.subject,
      originalEmailSnippet: emailData.snippet,
    });
    console.log(`[Tool Executor] Pitch generado: "${result.pitchSubject}"`);

    // Marcar email como procesado (upsert)
    try {
      await supabase.from('processed_emails').upsert({
        gmail_id: args.gmailId,
        brand_email: brandEmail,
        processed_at: new Date().toISOString(),
      }, { onConflict: 'gmail_id' });
    } catch (err) {
      console.error('[Tool Executor] Error marcando email como procesado:', err);
    }

    return {
      status: "draft_created",
      brandName: result.draft.brandName,
      pitchSubject: result.pitchSubject,
      pitchContent: result.pitchContent,
      message: `Borrador de pitch para ${result.draft.brandName} generado y guardado. Revisa los logs para ver el contenido completo.`,
    };
  }
};

/**
 * Ejecuta una llamada a función solicitada por Gemini.
 */
export const executeToolCall = async (call: { name: string; args: any }) => {
  const fn = (functionsImplementations as any)[call.name];
  if (!fn) throw new Error(`Función ${call.name} no implementada`);
  return await fn(call.args);
};

import { fetchYouTubeChannelStats } from "../../content-pipeline/tools/youtube.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";
import { mcpManager } from "../../../infrastructure/mcp/mcp-manager.js";
import { generatePitchUseCase } from "../../brand-deals/use-cases/generate-pitch.js";
import { calculateSponsorshipUseCase } from "../../brand-deals/use-cases/calculate-sponsorship.js";
import { gmail } from "../../../infrastructure/gmail/gmail-client.js";
import { ensureGmailAuth } from "../../../shared/gmail-auth.js";
import { config } from "../../../shared/config.js";
import { fetchVideoComments, analyzeComments } from "../../audience-intelligence/comment-analyzer.js";

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

async function fetchEmailByGmailId(gmailId: string, userId?: string): Promise<{ from: string; subject: string; snippet: string }> {
  await ensureGmailAuth(userId);
  const detail = await gmail.users.messages.get({ userId: 'me', id: gmailId });
  const headers = detail.data.payload?.headers || [];
  const rawSubject = headers.find((h: any) => h.name === 'Subject')?.value || '';
  const from = headers.find((h: any) => h.name === 'From')?.value || '';

  // Safety: no generar pitch contra el propio usuario
  if (userId) {
    const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
    if (user?.email && from.includes(user.email)) {
      throw new Error(`El email ${gmailId} es del propio usuario (${user.email}), saltando.`);
    }
  } else if (from.includes(config.AUTHENTICATED_USER_EMAIL)) {
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
  
  getPreviousInsights: async ({ creatorName, _userId }: { creatorName: string; _userId?: string }) => {
    console.log(`[Tool Executor] Recuperando memoria para ${creatorName}...`);
    let query = supabase
      .from('agent_logs')
      .select('content, insights, created_at')
      .eq('creator_name', creatorName)
      .order('created_at', { ascending: false })
      .limit(3);

    if (_userId) {
      query = query.eq('user_id', _userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Tool Executor] Error recuperando memoria:", error);
      return [];
    }
    return data;
  },
  
  updateLiveMediaKit: async (data: any) => {
    console.log(`[Tool Executor] Persistiendo Media Kit en Supabase para ${data.creatorName}...`);

    const insertData: any = {
      creator_name: data.creatorName,
      type: 'media_kit_update',
      content: data.metrics,
      insights: data.insights,
    };
    if (data._userId) insertData.user_id = data._userId;

    const { error } = await supabase.from('agent_logs').insert([insertData]);

    if (error) {
      console.error("[Tool Executor] Error al guardar en Supabase:", error);
      return { status: "error", message: error.message };
    }

    return { status: "success", message: "Media Kit persistido en Supabase" };
  },

  // Herramientas de Gmail (usando Gmail API directa para evitar stdout contaminado del MCP)
  listEmails: async (args: { maxResults?: number; _userId?: string }) => {
    console.warn('[Tool Executor] Usando Gmail API directa...');
    await ensureGmailAuth(args._userId);

    try {
      // Buscar TODOS los emails de los ultimos 30 dias (todas las carpetas incluido spam)
      // La deduplicacion con processed_emails evita re-procesar los mismos emails
      const query = 'newer_than:30d';
      console.log(`[Tool Executor] Gmail query: "${query}" (all folders) for userId=${args._userId || 'none'}`);

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 100, // Aumentado para capturar mas emails
        q: query,
      });
      const messages = response.data.messages || [];
      console.log(`[Tool Executor] Gmail encontró ${messages.length} emails (all folders)`);

      // Obtener IDs de emails ya procesados (dedup) — filtrar por user_id si existe
      let processedQuery = supabase.from('processed_emails').select('gmail_id');
      if (args._userId) {
        processedQuery = processedQuery.eq('user_id', args._userId);
      }
      const { data: processed } = await processedQuery;
      const processedSet = new Set(processed?.map(r => r.gmail_id) || []);
      console.log(`[Tool Executor] Emails ya procesados en DB: ${processedSet.size}`);

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
      console.log(`[Tool Executor] Detalles obtenidos: ${details.length}`);
      details.slice(0, 5).forEach((d: any) => {
        console.log(`  - "${d.subject?.slice(0, 50)}" | from: ${d.from?.slice(0, 40)}`);
      });

      // Obtener email del usuario para filtrar self-emails
      let userEmail: string | null = null;
      if (args._userId) {
        const { data: user } = await supabase.from('users').select('email').eq('id', args._userId).single();
        userEmail = user?.email || null;
      }
      console.log(`[Tool Executor] User email (para filtro self): ${userEmail || 'unknown'}`);

      // Filtrar emails ya procesados y del propio usuario
      let skippedProcessed = 0;
      let skippedSelf = 0;
      let skippedLegacy = 0;
      const filtered = details.filter((msg: any) => {
        if (processedSet.has(msg.id)) { skippedProcessed++; return false; }
        if (userEmail && msg.from?.includes(userEmail)) { skippedSelf++; return false; }
        if (msg.from?.includes(config.AUTHENTICATED_USER_EMAIL)) { skippedLegacy++; return false; }
        return true;
      });
      console.log(`[Tool Executor] RESULTADO: ${filtered.length} emails nuevos | Filtrados: ${skippedProcessed} procesados + ${skippedSelf} self + ${skippedLegacy} legacy`);

      return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
    } catch (gmailError: any) {
      if (gmailError.message?.includes('not been used') || gmailError.message?.includes('disabled')) {
        console.error('[Tool Executor] Gmail API no habilitada. Activá la API en: https://console.cloud.google.com/apis/library/gmail.googleapis.com');
      }
      throw gmailError;
    }
  },

  sendEmail: async (args: { to: string; subject: string; body: string; html?: string }) => {
    const isHealthy = await mcpManager.healthCheck();
    if (!isHealthy) {
      throw new Error("MCP Server is unhealthy. Cannot send email.");
    }
    return await mcpManager.callTool('send_email', args);
  },

  // Sponsorship Forecasting
  calculateSponsorshipValue: async (args: { creatorName: string; subscribers: number; totalViews: number; lastVideoViews: number; lastVideoLikes?: number; lastVideoComments?: number; engagementRate?: number; niche: string; _userId?: string }) => {
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
      userId: args._userId,
    });
    console.log(`[Tool Executor] Forecast: mención $${forecast.mention.min}-$${forecast.mention.max}`);
    return forecast;
  },

  // Auto-Pitch Engine
  generateAndDraftPitch: async (args: { creatorName: string; pitchStyle?: string; gmailId: string; _userId?: string }) => {
    console.log(`[Tool Executor] Generando pitch para gmailId ${args.gmailId}...`);

    // --- DEDUP 1: Por gmailId en processed_emails ---
    let dedupQuery1 = supabase.from('processed_emails').select('gmail_id').eq('gmail_id', args.gmailId);
    if (args._userId) dedupQuery1 = dedupQuery1.eq('user_id', args._userId);
    const { data: already } = await dedupQuery1.maybeSingle();
    if (already) {
      console.log(`[Tool Executor] ⏭️ Email ya procesado, saltando: ${args.gmailId}`);
      return { status: "skipped", brandName: args.gmailId, message: "Email ya procesado anteriormente." };
    }

    // --- DEDUP 2: Por gmailId en agent_logs (respaldo) ---
    let dedupQuery2 = supabase
      .from('agent_logs')
      .select('id')
      .eq('type', 'pitch_draft')
      .filter('content->>gmailId', 'eq', args.gmailId);
    if (args._userId) dedupQuery2 = dedupQuery2.eq('user_id', args._userId);
    const { data: existingPitch } = await dedupQuery2.limit(1).maybeSingle();
    if (existingPitch) {
      console.log(`[Tool Executor] ⏭️ Pitch ya existe en agent_logs para gmailId ${args.gmailId}, saltando...`);
      return { status: "skipped", brandName: args.gmailId, message: "Pitch ya existe para este gmailId." };
    }

    // --- Obtener datos reales del email desde Gmail API ---
    let emailData: { from: string; subject: string; snippet: string };
    try {
      emailData = await fetchEmailByGmailId(args.gmailId, args._userId);
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

    // Marcar email como procesado (upsert) — con user_id
    try {
      const upsertData: any = {
        gmail_id: args.gmailId,
        brand_email: brandEmail,
        snippet: emailData.snippet || '',
        processed_at: new Date().toISOString(),
      };
      if (args._userId) upsertData.user_id = args._userId;
      await supabase.from('processed_emails').upsert(upsertData, { onConflict: 'gmail_id' });
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
  },

  // Audience Intelligence
  getAudienceInsights: async (args: { videoId: string; videoTitle: string; _userId?: string }) => {
    console.log(`[Tool Executor] Analizando comentarios para video ${args.videoId}...`);
    const comments = await fetchVideoComments(args.videoId, 100);
    const analysis = analyzeComments(args.videoId, args.videoTitle, comments);
    console.log(`[Tool Executor] Comentarios analizados: ${analysis.totalComments} total, ${analysis.topThemes.length} temas, ${analysis.topQuestions.length} preguntas`);

    // Persist analysis
    const insertData: any = {
      creator_name: config.CREATOR_NAME,
      type: 'audience_insights',
      content: analysis,
      insights: `Análisis de audiencia para "${args.videoTitle}": ${analysis.totalComments} comentarios, sentimiento ${JSON.stringify(analysis.sentiment)}, ${analysis.topThemes.length} temas, ${analysis.topQuestions.length} preguntas`,
    };
    if (args._userId) insertData.user_id = args._userId;

    try {
      await supabase.from('agent_logs').insert([insertData]);
    } catch (err: any) {
      console.warn('[Tool Executor] No se pudo guardar audience_insights:', err);
    }

    return analysis;
  }
};

/**
 * Ejecuta una llamada a función solicitada por Gemini.
 * Acepta userId opcional para aislamiento multi-tenant.
 */
export const executeToolCall = async (call: { name: string; args: any }, userId?: string) => {
  const fn = (functionsImplementations as any)[call.name];
  if (!fn) throw new Error(`Función ${call.name} no implementada`);
  const enrichedArgs = userId ? { ...call.args, _userId: userId } : call.args;
  return await fn(enrichedArgs);
};

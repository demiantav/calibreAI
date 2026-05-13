import { fetchYouTubeChannelStats } from "../../content-pipeline/tools/youtube.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";
import { mcpManager } from "../../../infrastructure/mcp/mcp-manager.js";
import { generatePitchUseCase } from "../../brand-deals/use-cases/generate-pitch.js";
import { calculateSponsorshipUseCase } from "../../brand-deals/use-cases/calculate-sponsorship.js";
import { gmail, oAuth2Client } from "../../../infrastructure/gmail/gmail-client.js";

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
    const { data } = await supabase
      .from('user_auth')
      .select('*')
      .eq('user_email', 'tavolarodemian06@gmail.com')
      .single();
    if (!data) throw new Error('No autenticado. Ejecuta /auth/login');
    oAuth2Client.setCredentials({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    try {
      const response = await gmail.users.messages.list({ userId: 'me', maxResults: args.maxResults || 5 });
      const messages = response.data.messages || [];
      const details = await Promise.all(
        messages.map(async (msg: any) => {
          const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
          return {
            id: msg.id,
            snippet: detail.data.snippet,
            subject: detail.data.payload?.headers?.find((h: any) => h.name === 'Subject')?.value,
          };
        })
      );
      return { content: [{ type: "text", text: JSON.stringify(details, null, 2) }] };
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
  calculateSponsorshipValue: async (args: { creatorName: string; subscribers: number; totalViews: number; lastVideoViews: number; niche: string }) => {
    console.log(`[Tool Executor] Calculando sponsorship value para ${args.creatorName}...`);
    const forecast = await calculateSponsorshipUseCase({
      creatorName: args.creatorName,
      subscribers: args.subscribers,
      totalViews: args.totalViews,
      lastVideoViews: args.lastVideoViews,
      niche: args.niche,
    });
    console.log(`[Tool Executor] Forecast: mención $${forecast.mention.min}-$${forecast.mention.max}`);
    return forecast;
  },

  // Auto-Pitch Engine
  generateAndDraftPitch: async (args: { creatorName: string; brandName: string; brandEmail: string; brandContext: string; pitchStyle?: string }) => {
    console.log(`[Tool Executor] Generando pitch para ${args.brandName}...`);
    const result = await generatePitchUseCase({
      creatorName: args.creatorName,
      brandName: args.brandName,
      brandEmail: args.brandEmail,
      brandContext: args.brandContext,
      pitchStyle: args.pitchStyle,
    });
    console.log(`[Tool Executor] Pitch generado: "${result.pitchSubject}"`);
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

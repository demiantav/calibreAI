import { fetchYouTubeChannelStats } from "../../content-pipeline/tools/youtube.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";
import { mcpManager } from "../../../infrastructure/mcp/mcp-manager.js";

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

  // Herramientas MCP de Gmail
  listEmails: async (args: { maxResults?: number }) => {
    const isHealthy = await mcpManager.healthCheck();
    if (!isHealthy) {
      throw new Error("MCP Server is unhealthy. Cannot list emails.");
    }
    return await mcpManager.callTool('list_emails', args);
  },

  sendEmail: async (args: { to: string; subject: string; body: string }) => {
    const isHealthy = await mcpManager.healthCheck();
    if (!isHealthy) {
      throw new Error("MCP Server is unhealthy. Cannot send email.");
    }
    return await mcpManager.callTool('send_email', args);
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

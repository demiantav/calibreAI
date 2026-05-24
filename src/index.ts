import { app } from './app.js';
import { config } from './shared/config.js';
import { runPulseCheck } from './domains/agent-core/heartbeat/pulse.js';
import { mcpManager } from './infrastructure/mcp/mcp-manager.js';

const port = config.PORT;

const server = app.listen(port, () => {
  console.log(`[Calibre] Agent server running at http://localhost:${port}`);
  console.log(`[Calibre] -> Login en: http://localhost:${port}/auth/login`);
  console.log(`[Calibre] -> Ejecuta el agente en: http://localhost:${port}/pulse`);
  console.log(`[Calibre] -> Mira los resultados en: http://localhost:${port}/logs`);

  setTimeout(async () => {
    console.log('[Calibre] Auto-pulse: iniciando ciclo del agente...');
    try {
      const { supabase } = await import('./infrastructure/supabase/supabase-client.js');
      const { data: legacyUser } = await supabase
        .from('users')
        .select('id, youtube_channel_id')
        .limit(1)
        .single();
      if (legacyUser?.youtube_channel_id) {
        runPulseCheck(legacyUser.id, legacyUser.youtube_channel_id);
      } else {
        console.log('[Calibre] Auto-pulse: no hay usuario con canal configurado, saltando.');
      }
    } catch (err) {
      console.error('[Calibre] Auto-pulse error:', err);
    }
  }, 5000);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────

function shutdown(signal: string) {
  console.log(`[Calibre] ${signal} received. Starting graceful shutdown...`);

  // 1. Stop accepting new connections
  server.close(() => {
    console.log('[Calibre] HTTP server closed.');
  });

  // 2. Shutdown MCP child process
  mcpManager.shutdown()
    .then(() => console.log('[Calibre] MCP manager shut down.'))
    .catch((err) => console.error('[Calibre] MCP shutdown error:', err))
    .finally(() => {
      // 3. Exit cleanly after a short delay to flush logs
      setTimeout(() => {
        console.log('[Calibre] Shutdown complete.');
        process.exit(0);
      }, 500);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

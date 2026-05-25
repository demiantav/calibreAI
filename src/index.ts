import { app } from './app.js';
import { config } from './shared/config.js';
import { runPulseCheck } from './domains/agent-core/heartbeat/pulse.js';
import { mcpManager } from './infrastructure/mcp/mcp-manager.js';
import { runDailyDigest } from './domains/digest/digest-service.js';
import cron from 'node-cron';

const port = config.PORT;

const server = app.listen(port, () => {
  console.log(`[Calibre] Agent server running at http://localhost:${port}`);
  console.log(`[Calibre] -> Login en: http://localhost:${port}/auth/login`);
  console.log(`[Calibre] -> Ejecuta el agente en: http://localhost:${port}/pulse`);
  console.log(`[Calibre] -> Mira los resultados en: http://localhost:${port}/logs`);

  setTimeout(async () => {
    console.log('[Calibre] Auto-pulse: iniciando ciclos para usuarios con auto-pitch activado...');
    try {
      const { supabase } = await import('./infrastructure/supabase/supabase-client.js');
      const { data: activeUsers } = await supabase
        .from('users')
        .select('id, youtube_channel_id')
        .eq('auto_pitch_enabled', true)
        .not('youtube_channel_id', 'is', null);

      if (!activeUsers || activeUsers.length === 0) {
        console.log('[Calibre] Auto-pulse: no hay usuarios con auto-pitch activado y canal configurado, saltando.');
        return;
      }

      console.log(`[Calibre] Auto-pulse: ${activeUsers.length} usuario(s) encontrados.`);
      for (const user of activeUsers) {
        console.log(`[Calibre] Auto-pulse: disparando ciclo para usuario ${user.id}, canal ${user.youtube_channel_id}...`);
        runPulseCheck(user.id, user.youtube_channel_id, { autoPitchEnabled: true }).catch((err) => {
          console.error(`[Calibre] Auto-pulse error para usuario ${user.id}:`, err);
        });
        // Stagger pulses to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error('[Calibre] Auto-pulse error:', err);
    }
  }, 5000);

  // ── Daily Digest Scheduler ─────────────────────────────────────────────────
  // Runs every day at 8:00 AM (Europe/Rome)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Calibre] Daily digest: iniciando envío de resúmenes...');
    await runDailyDigest();
    console.log('[Calibre] Daily digest: completado.');
  }, {
    timezone: 'Europe/Rome',
  });

  console.log('[Calibre] Daily digest scheduler activado (8:00 AM America/Argentina)');
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

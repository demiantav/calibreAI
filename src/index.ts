import { app } from './app.js';
import { config } from './shared/config.js';
import { runPulseCheck } from './domains/agent-core/heartbeat/pulse.js';

const port = config.PORT;

app.listen(port, () => {
  console.log(`[Calibre] Agent server running at http://localhost:${port}`);
  console.log(`[Calibre] -> Login en: http://localhost:${port}/auth/login`);
  console.log(`[Calibre] -> Ejecuta el agente en: http://localhost:${port}/pulse`);
  console.log(`[Calibre] -> Mira los resultados en: http://localhost:${port}/logs`);

  setTimeout(() => {
    console.log('[Calibre] Auto-pulse: iniciando ciclo del agente...');
    runPulseCheck();
  }, 5000);
});

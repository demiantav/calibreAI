import express from 'express';
import cors from 'cors';
import { config } from './shared/config.js';
import { runPulseCheck } from './domains/agent-core/heartbeat/pulse.js';
import { supabase } from './infrastructure/supabase/supabase-client.js';

const app = express();
const port = config.PORT;

app.use(cors());
app.use(express.json());

// Endpoint para disparar el agente manualmente
app.get('/pulse', async (req, res) => {
  console.log("[API] Disparando ciclo del agente...");
  // Ejecutamos en segundo plano para no bloquear la respuesta
  runPulseCheck();
  res.json({ message: "Ciclo del agente iniciado. Revisa la consola o los logs en Supabase." });
});

// Endpoint para ver los últimos logs del agente
app.get('/logs', async (req, res) => {
  const { data, error } = await supabase
    .from('agent_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) return res.status(500).json(error);
  res.json(data);
});

app.get('/health', (req, res) => {
  res.json({ status: 'Calibre Agent is online', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`[Calibre] Agent server running at http://localhost:${port}`);
  console.log(`[Calibre] -> Ejecuta el agente en: http://localhost:${port}/pulse`);
  console.log(`[Calibre] -> Mira los resultados en: http://localhost:${port}/logs`);
});

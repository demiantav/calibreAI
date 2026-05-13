import express from 'express';
import cors from 'cors';
import { config } from './shared/config.js';
import { runPulseCheck } from './domains/agent-core/heartbeat/pulse.js';
import { supabase } from './infrastructure/supabase/supabase-client.js';
import { getAuthUrl, oAuth2Client } from './infrastructure/gmail/gmail-client.js';

const app = express();
const port = config.PORT;

app.use(cors());
app.use(express.json());

// Auth Endpoints
app.get('/auth/login', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Código de autorización faltante');
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    
    // Calculamos la fecha de expiración
    const expiryDate = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);
    
    // Persistimos en Supabase
    // Usamos 'upsert' para actualizar si ya existe para este usuario (asumimos un email, o lo extraemos del perfil)
    // Por ahora, como es prueba local, guardamos con un id fijo o email mock
    const { error } = await supabase
      .from('user_auth')
      .upsert({ 
        user_email: 'tavolarodemian06@gmail.com', // Ajusta según tu email de prueba
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiryDate.toISOString()
      }, { onConflict: 'user_email' });

    if (error) throw error;
    
    res.json({ message: 'Autenticación exitosa y token guardado en Supabase' });
  } catch (error) {
    console.error("Error en auth/callback:", error);
    res.status(500).json({ error: 'Error al procesar tokens', details: error });
  }
});

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
  console.log(`[Calibre] -> Login en: http://localhost:${port}/auth/login`);
  console.log(`[Calibre] -> Ejecuta el agente en: http://localhost:${port}/pulse`);
  console.log(`[Calibre] -> Mira los resultados en: http://localhost:${port}/logs`);
});

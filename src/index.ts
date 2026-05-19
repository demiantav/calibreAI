import express from 'express';
import cors from 'cors';
import { config } from './shared/config.js';
import { runPulseCheck } from './domains/agent-core/heartbeat/pulse.js';
import { supabase } from './infrastructure/supabase/supabase-client.js';
import { getAuthUrl, oAuth2Client } from './infrastructure/gmail/gmail-client.js';
import { mcpManager } from './infrastructure/mcp/mcp-manager.js';

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
  const typeFilter = req.query.type as string | undefined;
  let query = supabase
    .from('agent_logs')
    .select('*');

  if (typeFilter) {
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json(error);
  res.json(data);
});

// Endpoint para enviar un pitch draft
app.post('/api/pitches/:id/send', async (req, res) => {
  const { id } = req.params;
  const { subject, content } = req.body;

  if (!subject || !content) {
    return res.status(400).json({ error: 'subject y content son requeridos' });
  }

  try {
    const { data: log, error: fetchError } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !log) {
      return res.status(404).json({ error: 'Pitch no encontrado' });
    }

    if (log.type !== 'pitch_draft') {
      return res.status(400).json({ error: 'El registro no es un pitch' });
    }

    const pitch = log.content;

    // Idempotency: si ya fue enviado, no reenviar
    if (pitch.status === 'sent') {
      return res.status(400).json({ error: 'Este pitch ya fue enviado anteriormente' });
    }

    if (pitch.status !== 'draft_ready') {
      return res.status(400).json({ error: `El pitch no está en estado draft_ready (status: ${pitch.status})` });
    }

    // Validar brandEmail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const targetEmail = pitch.brandEmail || '';
    if (!emailRegex.test(targetEmail)) {
      return res.status(400).json({ error: `Email de destino inválido: "${targetEmail}"` });
    }

    const isHealthy = await mcpManager.healthCheck();
    if (!isHealthy) {
      return res.status(503).json({ error: 'Servidor MCP no disponible' });
    }

    // Marcar como enviado PRIMERO en DB (para prevenir duplicados)
    pitch.status = 'sent';
    pitch.sentAt = new Date().toISOString();

    const { error: preUpdateError } = await supabase
      .from('agent_logs')
      .update({
        content: pitch,
        insights: `Pitch marcado como enviado a ${pitch.brandName} — Asunto: "${subject}"`,
      })
      .eq('id', id);

    if (preUpdateError) {
      console.error('[API] Error marcando pitch como enviado antes de enviar email:', preUpdateError);
      return res.status(500).json({ error: 'Error al actualizar el pitch antes del envío' });
    }

    // Ahora enviar el email
    const sendResult = await mcpManager.callTool('send_email', {
      to: targetEmail,
      subject,
      body: content,
    });

    res.json({ success: true, id, sent: true, result: sendResult });
  } catch (error: any) {
    console.error('[API] Error enviando pitch:', error);
    res.status(500).json({ error: 'Error al enviar el pitch', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Calibre Agent is online', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`[Calibre] Agent server running at http://localhost:${port}`);
  console.log(`[Calibre] -> Login en: http://localhost:${port}/auth/login`);
  console.log(`[Calibre] -> Ejecuta el agente en: http://localhost:${port}/pulse`);
  console.log(`[Calibre] -> Mira los resultados en: http://localhost:${port}/logs`);

  // Auto-pulse 5s después de iniciar (espera a que MCP se inicialice)
  setTimeout(() => {
    console.log('[Calibre] Auto-pulse: iniciando ciclo del agente...');
    runPulseCheck();
  }, 5000);
});

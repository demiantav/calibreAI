import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { supabase } from './infrastructure/supabase/supabase-client.js';
import { config } from './shared/config.js';
import { getAuthUrl, oAuth2Client } from './infrastructure/gmail/gmail-client.js';
import { mcpManager } from './infrastructure/mcp/mcp-manager.js';
import { runPulseCheck } from './domains/agent-core/heartbeat/pulse.js';
import { authMiddleware } from './shared/auth-middleware.js';
import { createOAuthState, verifyOAuthState } from './shared/oauth-state.js';

export const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Rate limiting (skipped in test mode so integration tests aren't blocked)
if (config.NODE_ENV !== 'test') {
  const { default: rateLimit } = await import('express-rate-limit')

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
  })
  app.use(globalLimiter)

  const strictLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes a este endpoint. Intenta de nuevo en un minuto.' },
  })
  app.use('/pulse', strictLimiter)
  app.use('/api/pitches/:id/send', strictLimiter)
}

app.use('/pulse', authMiddleware)
app.use('/logs', authMiddleware)
app.use('/api', authMiddleware)

// Auth Endpoints
app.get('/auth/login', (req, res) => {
  const state = createOAuthState();
  const url = getAuthUrl(state);
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!state || typeof state !== 'string' || !verifyOAuthState(state)) {
    return res.status(400).json({ error: 'Estado de autenticación inválido o expirado' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Código de autorización faltante');
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    const expiryDate = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    const { error } = await supabase
      .from('user_auth')
      .upsert({
        user_email: config.AUTHENTICATED_USER_EMAIL,
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
  res.json({ message: "Ciclo del agente iniciado. Revisa la consola o los logs en Supabase." });
  runPulseCheck().catch((err) => {
    console.error("[API] Error no capturado en ciclo del agente:", err);
  });
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

    if (pitch.status === 'sent') {
      return res.status(400).json({ error: 'Este pitch ya fue enviado anteriormente' });
    }

    if (pitch.status !== 'draft_ready') {
      return res.status(400).json({ error: `El pitch no está en estado draft_ready (status: ${pitch.status})` });
    }

    const targetEmail = (pitch.brandEmail || '').trim();
    // Basic email structure check, length limit, and reject HTML/special chars
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(targetEmail) || targetEmail.length > 254) {
      return res.status(400).json({ error: `Email de destino inválido: "${targetEmail}"` });
    }

    const isHealthy = await mcpManager.healthCheck();
    if (!isHealthy) {
      return res.status(503).json({ error: 'Servidor MCP no disponible' });
    }

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

app.get('/health', async (req, res) => {
  const checks: Record<string, { status: 'ok' | 'error'; details?: string }> = {};
  let overall = 'healthy';

  // 1. Supabase check
  try {
    const { error } = await supabase.from('agent_logs').select('id').limit(1);
    checks.supabase = { status: error ? 'error' : 'ok', details: error?.message };
    if (error) overall = 'degraded';
  } catch (e: any) {
    checks.supabase = { status: 'error', details: e.message };
    overall = 'degraded';
  }

  // 2. Gmail MCP check
  try {
    const isHealthy = await mcpManager.healthCheck();
    checks.gmail_mcp = { status: isHealthy ? 'ok' : 'error', details: isHealthy ? undefined : 'MCP unhealthy' };
    if (!isHealthy) overall = 'degraded';
  } catch (e: any) {
    checks.gmail_mcp = { status: 'error', details: e.message };
    overall = 'degraded';
  }

  // 3. YouTube API key check (lightweight: just validate key format, not actual quota)
  try {
    const youtubeResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${config.YOUTUBE_API_KEY}`
    );
    checks.youtube_api = { status: youtubeResponse.ok ? 'ok' : 'error', details: youtubeResponse.ok ? undefined : `HTTP ${youtubeResponse.status}` };
    if (!youtubeResponse.ok) overall = 'degraded';
  } catch (e: any) {
    checks.youtube_api = { status: 'error', details: e.message };
    overall = 'degraded';
  }

  const statusCode = overall === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    status: overall === 'healthy' ? 'Calibre Agent is online' : 'Calibre Agent is degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Global error handler (4 params = Express error middleware)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API] Error no capturado:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

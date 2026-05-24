import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { supabase } from './infrastructure/supabase/supabase-client.js';
import { config } from './shared/config.js';
import { oAuth2Client } from './infrastructure/gmail/gmail-client.js';
import { mcpManager } from './infrastructure/mcp/mcp-manager.js';
import { runPulseCheck } from './domains/agent-core/heartbeat/pulse.js';
import { jwtAuthMiddleware } from './middleware/jwt-auth.middleware.js';
import authRoutes from './routes/auth.routes.js';

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

// Mount auth routes (public)
app.use('/auth', authRoutes);

// Legacy OAuth callback — now uses oauth_sessions for multi-tenant
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!state || typeof state !== 'string') {
    return res.status(400).json({ error: 'Estado de autenticación faltante' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Código de autorización faltante');
  }

  try {
    // Look up the oauth session to find which user initiated this
    const { data: oauthSession, error: sessionError } = await supabase
      .from('oauth_sessions')
      .select('user_id')
      .eq('state', state)
      .single();

    if (sessionError || !oauthSession) {
      return res.status(400).json({ error: 'Sesión de autenticación inválida o expirada' });
    }

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    const expiryDate = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    // Save tokens to the users table for the specific user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_expires_at: expiryDate.toISOString(),
        onboarding_step: 3,
      })
      .eq('id', oauthSession.user_id);

    if (updateError) throw updateError;

    // Clean up the oauth session
    await supabase.from('oauth_sessions').delete().eq('state', state);

    // Redirect to onboarding step 3 on the frontend URL
    res.redirect(`${config.FRONTEND_URL}/onboarding?step=3`);
  } catch (error) {
    console.error("Error en auth/callback:", error);
    res.status(500).json({ error: 'Error al procesar tokens', details: error });
  }
});

// Protected endpoints
app.use('/pulse', jwtAuthMiddleware)
app.use('/logs', jwtAuthMiddleware)
app.use('/api', jwtAuthMiddleware)

// Endpoint para disparar el agente manualmente
app.get('/pulse', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  // Get user's channel ID
  const { data: user } = await supabase
    .from('users')
    .select('youtube_channel_id, youtube_channel_name')
    .eq('id', userId)
    .single();

  if (!user?.youtube_channel_id) {
    return res.status(400).json({ error: 'Canal de YouTube no configurado. Completa el onboarding primero.' });
  }

  console.log(`[API] Disparando ciclo del agente para usuario ${userId}, canal ${user.youtube_channel_id}...`);
  res.json({ message: "Ciclo del agente iniciado. Revisa la consola o los logs en Supabase." });

  runPulseCheck(userId, user.youtube_channel_id).catch((err) => {
    console.error("[API] Error no capturado en ciclo del agente:", err);
  });
});

// Endpoint para ver los últimos logs del agente
app.get('/logs', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  const typeFilter = req.query.type as string | undefined;
  let query = supabase
    .from('agent_logs')
    .select('*')
    .eq('user_id', userId);

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
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

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
      .eq('user_id', userId)
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
      .eq('id', id)
      .eq('user_id', userId);

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

// Catch-all: serve frontend SPA for non-API routes (production)
if (config.NODE_ENV !== 'test') {
  const frontendDist = path.resolve(process.cwd(), 'apps/web/dist');
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/auth/') || req.path.startsWith('/api/') || req.path === '/health' || req.path === '/pulse' || req.path === '/logs') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global error handler (4 params = Express error middleware)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API] Error no capturado:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

import { Router, type Request, type Response } from 'express';
import { authService } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { supabase } from '../infrastructure/supabase/supabase-client.js';
import { ValidationError, UnauthorizedError } from '../shared/errors.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const youtubeUrlSchema = z.object({
  channelUrl: z.string().url(),
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const result = await authService.register(email, password);
    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof ValidationError || error.statusCode === 409) {
      res.status(error.statusCode || 400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Error al registrar usuario', details: error.message });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Error al iniciar sesión', details: error.message });
  }
});

// GET /auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const payload = authService.verifyToken(token);
    const user = await authService.getMe(payload.userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Token inválido' });
  }
});

// POST /auth/youtube
router.post('/youtube', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const payload = authService.verifyToken(token);
    const { channelUrl } = youtubeUrlSchema.parse(req.body);

    // Extract channel identifier from URL
    const extracted = extractChannelId(channelUrl);
    if (!extracted) {
      res.status(400).json({ error: 'URL de YouTube inválida. Formatos soportados: youtube.com/@handle, /channel/UC...' });
      return;
    }

    // Validate with YouTube API
    const { config } = await import('../shared/config.js');
    let apiUrl: string;
    if (extracted.type === 'handle') {
      // Use forHandle parameter (without the @ prefix)
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(extracted.value)}&key=${config.YOUTUBE_API_KEY}`;
    } else {
      // Use id parameter for channel IDs
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${extracted.value}&key=${config.YOUTUBE_API_KEY}`;
    }

    const youtubeResponse = await fetch(apiUrl);
    const youtubeData = await youtubeResponse.json();

    if (!youtubeData.items || youtubeData.items.length === 0) {
      res.status(404).json({ error: 'Canal de YouTube no encontrado' });
      return;
    }

    const channel = youtubeData.items[0];
    const channelName = channel.snippet.title;
    const realChannelId = channel.id; // The actual UC... ID from YouTube API

    // Save to user
    await userRepository.update(payload.userId, {
      youtube_channel_id: realChannelId,
      youtube_channel_url: channelUrl,
      youtube_channel_name: channelName,
      onboarding_step: 2,
    });

    res.json({ channelId: realChannelId, channelName, subscriberCount: channel.statistics?.subscriberCount || null });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: error.issues });
      return;
    }
    res.status(500).json({ error: 'Error al validar canal de YouTube', details: error.message });
  }
});

// GET /auth/gmail/start
router.get('/gmail/start', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const payload = authService.verifyToken(token);
    
    // Generate OAuth state and link to user
    const state = crypto.randomUUID();
    await supabase.from('oauth_sessions').insert([{ state, user_id: payload.userId }]);
    
    // Get Google OAuth URL
    const { getAuthUrl } = await import('../infrastructure/gmail/gmail-client.js');
    const url = getAuthUrl(state);
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al iniciar OAuth de Gmail', details: error.message });
  }
});

// Helper: extract channel identifier from various YouTube URL formats
// Returns { type, value } where value is the identifier to pass to the API
function extractChannelId(url: string): { type: 'handle' | 'channelId'; value: string } | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    // youtube.com/@handle → use forHandle parameter (without @)
    const handleMatch = path.match(/^\/(@[\w-]+)$/);
    if (handleMatch) {
      return { type: 'handle', value: handleMatch[1].slice(1) }; // Remove @ prefix
    }

    // youtube.com/channel/UC... → use id parameter
    const channelMatch = path.match(/^\/channel\/([\w-]+)$/);
    if (channelMatch) {
      return { type: 'channelId', value: channelMatch[1] };
    }

    return null;
  } catch {
    return null;
  }
}

export default router;

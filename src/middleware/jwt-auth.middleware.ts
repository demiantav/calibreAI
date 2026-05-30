import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { UnauthorizedError } from '../shared/errors.js';
import { config } from '../shared/config.js';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

export function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Bypass in test mode or when no JWT_SECRET is configured (backward compat)
  if (config.NODE_ENV === 'test') {
    req.user = { userId: 'test-user', email: 'test@example.com' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado. Proporciona un token JWT válido en el header Authorization.' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Token inválido' });
  }
}

import type { Request, Response, NextFunction } from 'express';
import { config } from './config.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (config.NODE_ENV === 'test') return next();
  if (!config.AUTH_API_KEY) return next();
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== config.AUTH_API_KEY) {
    return res.status(401).json({ error: 'No autorizado. Proporciona una API key válida en el header x-api-key.' });
  }
  next();
}

import type { Request, Response, NextFunction } from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';

// Re-export for backward compatibility during transition
export { jwtAuthMiddleware as authMiddleware };

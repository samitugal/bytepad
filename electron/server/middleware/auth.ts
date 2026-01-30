import { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../utils/apiKey';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  apiKeyValid?: boolean;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Skip auth for health check
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn(`Unauthorized request to ${req.path} - No auth header`);
    return res.status(401).json({
      success: false,
      error: 'Authorization header required'
    });
  }

  // Support both "Bearer <token>" and raw token
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!validateApiKey(token)) {
    logger.warn(`Unauthorized request to ${req.path} - Invalid API key`);
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  req.apiKeyValid = true;
  next();
}

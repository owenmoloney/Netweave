import type { Request, Response, NextFunction } from 'express';
import { sanitizeValue } from '../utils/sanitize.js';

export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}

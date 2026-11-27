import { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Debés iniciar sesión.' });
    return;
  }
  next();
}

export function issueCsrf(req: Request, res: Response): void {
  req.session.csrfToken ??= randomBytes(32).toString('hex');
  res.json({ token: req.session.csrfToken });
}

export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  const supplied = req.get('x-csrf-token');
  if (!req.session.csrfToken || !supplied || supplied !== req.session.csrfToken) {
    res.status(403).json({ error: 'Token CSRF inválido o ausente.' });
    return;
  }
  next();
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    csrfToken?: string;
  }
}

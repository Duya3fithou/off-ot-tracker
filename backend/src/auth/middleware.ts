import { NextFunction, Request, Response } from 'express';
import { SessionClaims, verifySessionToken } from './tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: SessionClaims;
    }
  }
}

/** Requires a valid app session (Bearer token). Populates req.auth. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.auth = verifySessionToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

/** Requires the authenticated user to be an admin. Use after requireAuth. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

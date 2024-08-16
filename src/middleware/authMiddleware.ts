// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as any).role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden' });
}

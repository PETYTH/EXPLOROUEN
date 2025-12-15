import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Middleware d'authentification désactivé - utilise Clerk
  next();
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next();
};

export const authorize = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
});

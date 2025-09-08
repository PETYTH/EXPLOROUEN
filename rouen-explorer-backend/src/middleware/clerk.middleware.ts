import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
    user?: any;
  };
}

// Middleware pour vérifier l'authentification Clerk
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Vérifier le token JWT avec Clerk
      const payload = await clerkClient.verifyToken(token);
      
      if (!payload || !payload.sub) {
        res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
        return;
      }

      // Récupérer les informations utilisateur
      const user = await clerkClient.users.getUser(payload.sub);
      
      // Ajouter les informations d'auth à la requête
      req.auth = {
        userId: payload.sub,
        sessionId: payload.sid,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddress: user.emailAddresses[0]?.emailAddress,
          imageUrl: user.imageUrl
        }
      };

      next();
    } catch (clerkError) {
      console.error('Erreur Clerk:', clerkError);
      res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
      return;
    }
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
    return;
  }
};

// Middleware optionnel pour les routes publiques
export const optionalAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas d'auth, mais on continue
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const session = await clerkClient.sessions.verifySession(token, token);
      
      if (session && session.userId) {
        const user = await clerkClient.users.getUser(session.userId);
        
        req.auth = {
          userId: session.userId,
          sessionId: session.id,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddresses[0]?.emailAddress,
            imageUrl: user.imageUrl
          }
        };
      }
    } catch (clerkError) {
      // Token invalide, mais on continue sans auth
      console.log('Token invalide, continuation sans auth');
    }

    next();
  } catch (error) {
    console.error('Erreur middleware auth optionnel:', error);
    next(); // Continue même en cas d'erreur
  }
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
// import { getCache } from '../utils/redis'; // Désactivé pour le développement local

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: string;
    };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification requis'
            });
        }

        const token = authHeader.substring(7);

        // Vérifier que le secret JWT est configuré
        if (!config.jwtSecret) {
            console.error('JWT_SECRET non configuré');
            return res.status(500).json({
                success: false,
                message: 'Configuration serveur manquante'
            });
        }

        // Vérifier le token JWT
        const decoded = jwt.verify(token, config.jwtSecret) as any;

        // Vérifier que la session existe en cache (désactivé pour le développement local)
        // const session = await getCache(`session:${decoded.userId}`);
        // if (!session) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Session expirée'
        //     });
        // }

        // Ajouter les informations utilisateur à la requête
        (req as AuthenticatedRequest).user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token invalide'
        });
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthenticatedRequest).user;

        if (!roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
        }

        return next();
    };
};

// Rate limiting pour l'authentification
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives max
    message: {
        success: false,
        message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting général
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes max
    message: {
        success: false,
        message: 'Trop de requêtes. Réessayez dans 15 minutes.'
    }
});

import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Configuration CORS sécurisée
export const corsConfig = cors({
    origin: config.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// Configuration Helmet pour les headers de sécurité
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
});

// Middleware de sanitisation des données
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    // Supprimer les scripts potentiellement dangereux
    const sanitize = (obj: any): any => {
        if (typeof obj === 'string') {
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);

    next();
};

// Middleware de gestion des erreurs
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation',
            errors: err.details
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Non autorisé'
        });
    }

    if (err.code === 'P2002') { // Erreur Prisma de contrainte unique
        return res.status(409).json({
            success: false,
            message: 'Cette ressource existe déjà'
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
    });
};
import { Request, Response } from 'express';
// import { AuthService } from '../services/auth.service'; // Désactivé car utilise Clerk
// import Joi from 'joi'; // Temporairement commenté car non utilisé

// Schémas temporairement commentés car non utilisés
/*
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({ 'any.only': 'Les mots de passe ne correspondent pas' }),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required()
  })
  // si tu veux REJETER les champs non prévus :
  .options({ allowUnknown: false });
  
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});
*/

export class AuthController {
    static async register(_req: Request, res: Response) {
        // Authentification gérée par Clerk - endpoint désactivé
        return res.status(501).json({ 
            success: false, 
            message: 'Authentification gérée par Clerk. Utilisez les endpoints Clerk.' 
        });
    }
      

    static async login(_req: Request, res: Response) {
        // Authentification gérée par Clerk - endpoint désactivé
        return res.status(501).json({ 
            success: false, 
            message: 'Authentification gérée par Clerk. Utilisez les endpoints Clerk.' 
        });
    }

    static async refreshToken(_req: Request, res: Response) {
        // Authentification gérée par Clerk - endpoint désactivé
        return res.status(501).json({ 
            success: false, 
            message: 'Authentification gérée par Clerk. Utilisez les endpoints Clerk.' 
        });
    }

    static async logout(_req: Request, res: Response) {
        // Authentification gérée par Clerk - endpoint désactivé
        return res.status(501).json({ 
            success: false, 
            message: 'Authentification gérée par Clerk. Utilisez les endpoints Clerk.' 
        });
    }

    static async forgotPassword(_req: Request, res: Response) {
        // Authentification gérée par Clerk - endpoint désactivé
        return res.status(501).json({ 
            success: false, 
            message: 'Authentification gérée par Clerk. Utilisez les endpoints Clerk.' 
        });
    }

    static async verifyResetCode(_req: Request, res: Response) {
        // Authentification gérée par Clerk - endpoint désactivé
        return res.status(501).json({ 
            success: false, 
            message: 'Authentification gérée par Clerk. Utilisez les endpoints Clerk.' 
        });
    }

    static async resetPassword(_req: Request, res: Response) {
        // Authentification gérée par Clerk - endpoint désactivé
        return res.status(501).json({ 
            success: false, 
            message: 'Authentification gérée par Clerk. Utilisez les endpoints Clerk.' 
        });
    }
}
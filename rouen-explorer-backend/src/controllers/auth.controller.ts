import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import Joi from 'joi';

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

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
          const { error, value } = registerSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true, // enlève tout ce qui n'est pas dans le schéma
          });
          if (error) {
            return res.status(400).json({ success:false, message:'Données invalides', errors: error.details });
          }
      
          const { confirmPassword, ...payload } = value; // ⬅️ on enlève confirmPassword
          const result = await AuthService.register(payload);
          
          // Envoyer l'email de bienvenue
          try {
            const { EmailService } = await import('../services/email.service');
            const userForEmail = { ...result.user, password: '' }; // Exclure le mot de passe pour l'email
            await EmailService.sendWelcomeEmail(userForEmail as any);
          } catch (emailError) {
            console.warn('⚠️ Erreur envoi email de bienvenue:', emailError);
          }
      
          return res.status(201).json({ success:true, message:'Compte créé avec succès', data: result });
        } catch (e:any) {
          return res.status(400).json({ success:false, message:e.message });
        }
      }
      

    static async login(req: Request, res: Response) {
        try {
            const { error, value } = loginSchema.validate(req.body);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: error.details
                });
            }

            const result = await AuthService.login(value);

            return res.json({
                success: true,
                message: 'Connexion réussie',
                data: result
            });
        } catch (error: any) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    static async refreshToken(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de rafraîchissement requis'
                });
            }

            const result = await AuthService.refreshToken(refreshToken);

            return res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            await AuthService.logout(userId);

            return res.json({
                success: true,
                message: 'Déconnexion réussie'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email requis'
                });
            }

            await AuthService.forgotPassword(email);

            return res.json({
                success: true,
                message: 'Si cet email existe, un code de réinitialisation a été envoyé'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async verifyResetCode(req: Request, res: Response) {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'Email et code requis'
                });
            }

            const isValid = await AuthService.verifyResetCode(email, code);

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Code invalide ou expiré'
                });
            }

            return res.json({
                success: true,
                message: 'Code vérifié avec succès'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const { email, code, newPassword } = req.body;

            if (!email || !code || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, code et nouveau mot de passe requis'
                });
            }

            await AuthService.resetPassword(email, code, newPassword);

            return res.json({
                success: true,
                message: 'Mot de passe réinitialisé avec succès'
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}
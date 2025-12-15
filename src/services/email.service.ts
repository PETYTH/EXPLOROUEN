import nodemailer from 'nodemailer';
import { config } from '../config';
import { Activity } from '@prisma/client';

// Interface pour les données utilisateur Clerk
interface ClerkUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

// Vérification de la configuration email
if (config.nodeEnv !== 'production' && (!config.emailService.mailtrapUser || !config.emailService.mailtrapPass)) {
    console.warn('⚠️ Configuration Mailtrap manquante. Les emails ne seront pas envoyés en mode développement.');
}

// Configuration du transporteur en fonction de l'environnement
const transporter = config.nodeEnv === 'production'
    ? nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
            user: 'resend',
            pass: config.emailService.apiKey
        }
    })
    : nodemailer.createTransport({
        host: config.emailService.mailtrapHost,
        port: 2525,
        auth: {
            user: config.emailService.mailtrapUser,
            pass: config.emailService.mailtrapPass
        },
        tls: {
            rejectUnauthorized: false
        }
    });

// Configuration email initialisée

interface EmailTemplate {
    to: string;
    subject: string;
    text: string;
    html: string;
}

export class EmailService {
    private static async sendEmail(template: EmailTemplate) {
        console.log('📤 Tentative d\'envoi d\'email à:', template.to);
        console.log('🔧 Configuration SMTP utilisée:', {
            host: config.nodeEnv === 'production' ? 'smtp.resend.com' : 'sandbox.smtp.mailtrap.io',
            port: 2525,
            secure: config.nodeEnv === 'production',
            user: config.nodeEnv === 'production' ? 'resend' : config.emailService.mailtrapUser
        });

        const mailOptions = {
            from: `ExploRouen <${config.emailService.from}>`,
            to: template.to,
            subject: template.subject,
            text: template.text,
            html: template.html,
            headers: {
                'X-Mailer': 'Norman Explorer Mailer'
            }
        };

        try {
            console.log('🔄 Envoi en cours...');
            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email envoyé avec succès à ${template.to}`);
            return info;
        } catch (error: any) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
            throw new Error('Erreur lors de l\'envoi de l\'email');
        }
    }

    static async sendWelcomeEmail(user: ClerkUser) {
        const template = {
            to: user.email,
            subject: 'Bienvenue sur Norman Explorer ! 🏰',
            text: `Bonjour ${user.firstName}, bienvenue sur Norman Explorer ! Votre compte a été créé avec succès.`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur Norman Explorer</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏰 Norman Explorer</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 18px;">Explorez la Normandie autrement</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #3b82f6; margin-bottom: 20px;">Bienvenue ${user.firstName} ! 👋</h2>
            
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant découvrir tous les trésors de la Normandie :</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="color: #374151; margin-bottom: 15px;">Ce que vous pouvez faire :</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">🏛️ Découvrir les lieux historiques de Normandie</li>
                <li style="margin-bottom: 8px;">🏃‍♂️ Participer à des activités sportives</li>
                <li style="margin-bottom: 8px;">🗺️ Rejoindre des chasses au trésor</li>
                <li style="margin-bottom: 8px;">💬 Échanger avec la communauté</li>
                <li style="margin-bottom: 8px;">📱 Utiliser l'app en mode hors ligne</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.corsOrigin}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Commencer l'exploration
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              Bonne exploration !<br>
              L'équipe Norman Explorer
            </p>
          </div>
        </body>
        </html>
      `
        };

        await this.sendEmail(template);
    }

    static async sendPasswordResetEmail(user: ClerkUser, resetCode: string) {
        const template = {
            to: user.email,
            subject: 'Code de réinitialisation de votre mot de passe - ExploRouen',
            text: `Votre code de réinitialisation est : ${resetCode}. Ce code expire dans 15 minutes.`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Réinitialisation mot de passe</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #3b82f6; padding: 30px 20px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Réinitialisation de mot de passe</h1>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p>Bonjour ${user.firstName},</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe sur ExploRouen.</p>
            
            <div style="text-align: center; margin: 30px 0; background: #f0f9ff; padding: 30px; border-radius: 12px; border: 2px solid #3b82f6;">
              <p style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: bold;">Votre code de réinitialisation :</p>
              <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${resetCode}
              </div>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ Ce code expire dans 15 minutes pour votre sécurité.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe reste inchangé.
            </p>
          </div>
        </body>
        </html>
      `
        };

        await this.sendEmail(template);
    }

    static async sendActivityReminderEmail(user: ClerkUser, activity: Activity) {
        const activityDate = new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(activity.startDate);

        const template = {
            to: user.email,
            subject: `Rappel : ${activity.title} demain ! 🏃‍♂️`,
            text: `Bonjour ${user.firstName}, n'oubliez pas votre activité "${activity.title}" prévue demain.`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Rappel d'activité</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Rappel d'activité</h1>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p>Bonjour ${user.firstName},</p>
            
            <p>N'oubliez pas votre activité qui a lieu demain !</p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0;">${activity.title}</h3>
              <p style="margin: 5px 0; color: #374151;"><strong>📅 Date :</strong> ${activityDate}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>📍 Lieu :</strong> ${activity.meetingPoint}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>⏱️ Durée :</strong> ${activity.duration} minutes</p>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                💡 N'oubliez pas votre équipement et arrivez 10 minutes avant l'heure !
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.corsOrigin}/activities/${activity.id}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Voir les détails
              </a>
            </div>
            
            <p style="color: #374151;">À bientôt pour cette belle aventure normande ! 🏰</p>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              L'équipe Norman Explorer
            </p>
          </div>
        </body>
        </html>
      `
        };

        await this.sendEmail(template);
    }

    static async sendActivityConfirmationEmail(user: ClerkUser, activity: Activity) {
        const template = {
            to: user.email,
            subject: `Inscription confirmée : ${activity.title} ✅`,
            text: `Votre inscription à "${activity.title}" a été confirmée !`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Inscription confirmée</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Inscription confirmée !</h1>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p>Bonjour ${user.firstName},</p>
            
            <p>Félicitations ! Votre inscription à l'activité suivante a été confirmée :</p>
            
            <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 12px; margin: 25px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">${activity.title}</h3>
              <p style="margin: 8px 0; color: #374151;"><strong>📅 Date :</strong> ${new Intl.DateTimeFormat('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(activity.startDate)}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>📍 Lieu de rendez-vous :</strong> ${activity.meetingPoint}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>⏱️ Durée :</strong> ${activity.duration} minutes</p>
              <p style="margin: 8px 0; color: #374151;"><strong>🏃‍♂️ Type :</strong> ${activity.type}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>📊 Difficulté :</strong> ${activity.difficulty}</p>
            </div>
            
            <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                📝 Vous recevrez un rappel la veille de l'activité.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.corsOrigin}/activities/${activity.id}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 10px;">
                Voir l'activité
              </a>
              <a href="${config.corsOrigin}/profile" style="display: inline-block; background: #6b7280; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Mon profil
              </a>
            </div>
            
            <p style="color: #374151;">Préparez-vous pour une belle découverte de la Normandie ! 🏰</p>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              À bientôt,<br>
              L'équipe Norman Explorer
            </p>
          </div>
        </body>
        </html>
      `
        };

        await this.sendEmail(template);
    }
}

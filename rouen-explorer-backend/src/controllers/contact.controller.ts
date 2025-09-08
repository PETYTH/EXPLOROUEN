// src/controllers/contact.controller.ts
import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';
import Joi from 'joi';

const contactSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(1).max(200).optional(),
    message: Joi.string().min(1).max(2000).required()
});

export class ContactController {
    static async create(req: Request, res: Response) {
        try {
            const { error, value } = contactSchema.validate(req.body);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: error.details
                });
            }

            // Ajouter l'ID utilisateur si disponible
            const contactData = {
                ...value,
                userId: (req as any).user?.id || undefined
            };

            const contact = await ContactService.createContact(contactData);

            return res.status(201).json({
                success: true,
                message: 'Message envoyé avec succès',
                data: {
                    id: contact._id
                }
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi du message',
                error: error.message
            });
        }
    }

    static async getAll(req: Request, res: Response) {
        try {
            const filters = {
                status: req.query.status as string,
                priority: req.query.priority as string,
                assignedTo: req.query.assignedTo as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
                search: req.query.search as string
            };

            const result = await ContactService.getContacts(filters);

            return res.json({
                success: true,
                data: result.contacts,
                pagination: result.pagination
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des contacts',
                error: error.message
            });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contact = await ContactService.getContactById(id);

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact non trouvé'
                });
            }

            return res.json({
                success: true,
                data: contact
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du contact',
                error: error.message
            });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const contact = await ContactService.updateContact(id, updates);

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact non trouvé'
                });
            }

            return res.json({
                success: true,
                message: 'Contact mis à jour',
                data: contact
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour',
                error: error.message
            });
        }
    }

    static async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, assignedTo, note } = req.body;

            const contact = await ContactService.updateContactStatus(id, status, assignedTo, note);

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact non trouvé'
                });
            }

            return res.json({
                success: true,
                message: 'Statut mis à jour',
                data: contact
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du statut',
                error: error.message
            });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await ContactService.deleteContact(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact non trouvé'
                });
            }

            return res.json({
                success: true,
                message: 'Contact supprimé'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression',
                error: error.message
            });
        }
    }

    static async getStats(_req: Request, res: Response) {
        try {
            const stats = await ContactService.getContactStats();

            return res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }
}

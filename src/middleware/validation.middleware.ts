import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        req.body = value;
        return next();
    };
};

// Validation spécifique pour le formulaire de contact
export const validateContact = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{8,15}$/).optional(),
        subject: Joi.string().min(5).max(200).required(),
        message: Joi.string().min(10).max(2000).required(),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
        tags: Joi.array().items(Joi.string()).optional()
    });

    return validate(schema)(req, res, next);
};
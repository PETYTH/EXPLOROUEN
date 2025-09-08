import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/database';
// import { config } from '../config'; // Temporairement commenté car non utilisé

export class ImageService {
    static async saveImageToDatabase(filePath: string, originalName: string, mimeType: string, size: number, entityType: 'activity' | 'place' | 'user', entityId?: string) {
        // Lire le fichier et le convertir en base64
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Créer l'enregistrement en base
        const imageRecord = await prisma.image.create({
            data: {
                filename: path.basename(filePath),
                originalName: originalName,
                mimeType: mimeType,
                size: size,
                data: base64Image,
                entityType: entityType,
                entityId: entityId || null,
                createdAt: new Date()
            }
        });

        // Supprimer le fichier temporaire
        fs.unlinkSync(filePath);

        return imageRecord;
    }

    static async getImageById(imageId: string) {
        const image = await prisma.image.findUnique({
            where: { id: imageId }
        });

        if (!image) {
            throw new Error('Image non trouvée');
        }

        return {
            ...image,
            dataUrl: `data:${image.mimeType};base64,${image.data}`
        };
    }

    static async getImagesByEntity(entityType: 'activity' | 'place' | 'user', entityId: string) {
        const images = await prisma.image.findMany({
            where: {
                entityType: entityType,
                entityId: entityId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return images.map(image => ({
            ...image,
            dataUrl: `data:${image.mimeType};base64,${image.data}`
        }));
    }

    static async deleteImage(imageId: string) {
        const image = await prisma.image.findUnique({
            where: { id: imageId }
        });

        if (!image) {
            throw new Error('Image non trouvée');
        }

        await prisma.image.delete({
            where: { id: imageId }
        });

        return true;
    }

    static async updateEntityImages(_entityType: 'activity' | 'place' | 'user', entityId: string, imageIds: string[]) {
        // Mettre à jour les images existantes pour les lier à l'entité
        await prisma.image.updateMany({
            where: {
                id: { in: imageIds }
            },
            data: {
                entityId: entityId
            }
        });

        return true;
    }
}

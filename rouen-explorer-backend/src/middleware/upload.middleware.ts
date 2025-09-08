import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// Créer le dossier uploads s'il n'existe pas
const uploadDir = config.uploadPath || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        // Générer un nom unique avec timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filtre pour les types de fichiers acceptés
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Types d'images acceptés
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'));
    }
};

// Configuration multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.maxFileSize || 5 * 1024 * 1024, // 5MB par défaut
    },
    fileFilter: fileFilter
});

export default upload;

// Middleware pour upload multiple d'images
export const uploadImages = upload.array('images', 5); // Max 5 images

// Middleware pour upload d'une seule image
export const uploadSingleImage = upload.single('image');

// Middleware pour upload d'avatar
export const uploadAvatar = upload.single('avatar');

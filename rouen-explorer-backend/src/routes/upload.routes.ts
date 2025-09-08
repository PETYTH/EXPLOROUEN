import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/clerk.middleware';

const router = Router();

// Configuration du stockage des images
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/images');
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        // Générer un nom unique avec timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `image-${uniqueSuffix}${extension}`);
    }
});

// Configuration multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (_req, file, cb) => {
        // Vérifier le type de fichier
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Route pour uploader une image
router.post('/image', requireAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image fournie'
            });
        }

        // URL publique de l'image
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;

        return res.json({
            success: true,
            message: 'Image uploadée avec succès',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                url: imageUrl
            }
        });

    } catch (error: any) {
        console.error('Erreur upload image:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'upload'
        });
    }
});

// Route pour servir les images
router.get('/image/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const imagePath = path.join(__dirname, '../../uploads/images', filename);

        // Vérifier si le fichier existe
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        // Servir l'image
        return res.sendFile(imagePath);

    } catch (error: any) {
        console.error('Erreur récupération image:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'image'
        });
    }
});

export default router;

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authLimiter } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/verify-reset-code', authLimiter, AuthController.verifyResetCode);
router.post('/reset-password', authLimiter, AuthController.resetPassword);

export default router;
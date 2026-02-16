import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authController.googleAuth);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

export default router;

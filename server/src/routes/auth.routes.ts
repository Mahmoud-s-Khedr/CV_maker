import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

export default router;

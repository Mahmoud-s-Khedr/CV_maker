import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Init payment requires login
router.post('/initiate', authenticate, paymentController.initiatePayment);

// Webhook comes from Paymob (no auth middleware, but check HMAC/Source)
router.post('/webhook', paymentController.handleWebhook);

export default router;

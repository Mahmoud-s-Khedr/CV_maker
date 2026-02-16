import { Router } from 'express';
import express from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Webhook must use raw body for Stripe signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Create checkout session requires login
router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);

export default router;

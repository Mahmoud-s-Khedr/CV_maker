import { Request, Response } from 'express';
import Stripe from 'stripe';
import * as stripeService from '../services/stripe.service';
import { prisma } from '../lib/prisma';
import config from '../config/config';
import { logError, logInfo } from '../utils/logger';

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const userId = user.userId;

        // Fetch email from DB to pass to Stripe
        const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (!dbUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const clientUrl = config.stripe.clientUrl;
        const successUrl = `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${clientUrl}/payment`;

        const session = await stripeService.createCheckoutSession(
            userId,
            dbUser.email,
            successUrl,
            cancelUrl
        );

        res.json({ url: session.url });
    } catch (error) {
        logError(error as Error, { type: 'createCheckoutSession' });
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = config.stripe.webhookSecret;

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }

    let event: Stripe.Event;
    try {
        event = stripeService.constructWebhookEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            if (session.payment_status === 'paid') {
                const userId = session.metadata?.userId;
                if (!userId) {
                    console.error('No userId in Stripe session metadata');
                    res.json({ received: true });
                    return;
                }

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isPremium: true,
                        stripeCustomerId: session.customer as string | null ?? undefined,
                    },
                });
                logInfo(`User ${userId} upgraded to premium via Stripe`);
            }
        }

        res.json({ received: true });
    } catch (error) {
        logError(error as Error, { type: 'webhook' });
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

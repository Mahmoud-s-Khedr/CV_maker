import { Request, Response } from 'express';
import Stripe from 'stripe';
import * as stripeService from '../services/stripe.service';
import { prisma } from '../lib/prisma';
import config from '../config/config';
import { logError, logInfo } from '../utils/logger';
import { sendError } from '../utils/http';

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const userId = user.userId;

        // Fetch email from DB to pass to Stripe
        const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (!dbUser) {
            sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
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
        sendError(res, 500, 'CHECKOUT_SESSION_CREATE_FAILED', 'Failed to create checkout session');
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = config.stripe.webhookSecret;

    if (!webhookSecret) {
        logError(new Error('STRIPE_WEBHOOK_SECRET not configured'), { type: 'webhook-config' });
        sendError(res, 500, 'SERVER_CONFIGURATION_ERROR', 'Server configuration error');
        return;
    }

    let event: Stripe.Event;
    try {
        event = stripeService.constructWebhookEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err) {
        logError(err as Error, { type: 'webhook-signature-verification' });
        sendError(res, 400, 'INVALID_WEBHOOK_SIGNATURE', 'Invalid webhook signature');
        return;
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            if (session.payment_status === 'paid') {
                const userId = session.metadata?.userId;
                if (!userId) {
                    logError(new Error('No userId in Stripe session metadata'), {
                        type: 'webhook-metadata',
                        severity: 'critical',
                        metric: 'stripe_webhook_missing_userid',
                        increment: 1,
                        eventId: event.id,
                    });
                    sendError(res, 400, 'WEBHOOK_MISSING_USER_ID', 'Missing userId in Stripe session metadata');
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
        sendError(res, 500, 'WEBHOOK_PROCESSING_FAILED', 'Webhook processing failed');
    }
};

export const verifySession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body as { sessionId?: string };
        const user = (req as any).user;
        const userId = user?.userId as string | undefined;

        if (!userId) {
            sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required');
            return;
        }

        if (!sessionId) {
            sendError(res, 400, 'SESSION_ID_REQUIRED', 'sessionId is required');
            return;
        }

        const session = await stripeService.retrieveCheckoutSession(sessionId);
        const paid = session.payment_status === 'paid';
        const metadataUserId = session.metadata?.userId;

        if (!paid || metadataUserId !== userId) {
            res.status(200).json({ verified: false, isPremium: false });
            return;
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                isPremium: true,
                stripeCustomerId: session.customer as string | null ?? undefined,
            },
        });

        res.json({ verified: true, isPremium: true });
    } catch (error) {
        logError(error as Error, { type: 'verify-session' });
        sendError(res, 500, 'PAYMENT_VERIFICATION_FAILED', 'Failed to verify payment session');
    }
};

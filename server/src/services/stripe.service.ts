import Stripe from 'stripe';
import config from '../config/config';

let stripeClient: Stripe | null = null;

const getStripeClient = (): Stripe => {
    const secret = config.stripe.secretKey?.trim();
    if (!secret) {
        throw new Error('Stripe is not configured: STRIPE_SECRET_KEY is missing');
    }

    if (!stripeClient) {
        stripeClient = new Stripe(secret);
    }

    return stripeClient;
};

export const createCheckoutSession = async (
    userId: string,
    userEmail: string,
    successUrl: string,
    cancelUrl: string
): Promise<Stripe.Checkout.Session> => {
    return getStripeClient().checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'HandisCV Premium' },
                    unit_amount: 999, // $9.99
                },
                quantity: 1,
            },
        ],
        metadata: { userId },
        success_url: successUrl,
        cancel_url: cancelUrl,
    });
};

export const constructWebhookEvent = (
    payload: Buffer,
    sig: string,
    secret: string
): Stripe.Event => {
    return getStripeClient().webhooks.constructEvent(payload, sig, secret);
};

export const retrieveCheckoutSession = async (sessionId: string): Promise<Stripe.Checkout.Session> => {
    return getStripeClient().checkout.sessions.retrieve(sessionId);
};

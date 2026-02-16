import Stripe from 'stripe';
import config from '../config/config';

const stripe = new Stripe(config.stripe.secretKey!);

export const createCheckoutSession = async (
    userId: string,
    userEmail: string,
    successUrl: string,
    cancelUrl: string
): Promise<Stripe.Checkout.Session> => {
    return stripe.checkout.sessions.create({
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
    return stripe.webhooks.constructEvent(payload, sig, secret);
};

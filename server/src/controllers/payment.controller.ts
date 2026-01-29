import { Request, Response } from 'express';
import * as paymobService from '../services/paymob.service';
import { prisma } from '../lib/prisma';
import config from '../config/config';
import { logError, logInfo } from '../utils/logger';

export const initiatePayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { firstName, lastName, email, phone } = req.body;

        // premium price: 100 EGP
        const priceCents = 10000;

        // 1. Auth
        const token = await paymobService.getAuthToken();

        // 2. Register Order
        const merchantOrderId = `ORD-${Date.now()}-${userId}`;
        const paymobOrderId = await paymobService.registerOrder(token, priceCents, merchantOrderId);

        // Save order ID to user for later verification
        await prisma.user.update({
            where: { id: userId },
            data: { paymobOrderId: paymobOrderId.toString() }
        });

        // 3. Get Payment Key
        const billingData = {
            "apartment": "NA",
            "email": email,
            "floor": "NA",
            "first_name": firstName,
            "street": "NA",
            "building": "NA",
            "phone_number": phone || "+201000000000",
            "shipping_method": "NA",
            "postal_code": "NA",
            "city": "NA",
            "country": "EG",
            "last_name": lastName,
            "state": "NA"
        };

        const paymentKey = await paymobService.getPaymentKey(token, paymobOrderId, priceCents, billingData);

        res.json({ paymentKey, frameId: config.paymob.frameId });

    } catch (error) {
        logError(error as Error, { type: 'initiatePayment' });
        res.status(500).json({ error: 'Payment initiation failed' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const { obj, type } = req.body;
        const hmac = req.query.hmac as string;

        if (type !== 'TRANSACTION') {
            res.json({ received: true });
            return;
        }

        // HMAC Verification
        if (!config.paymob.hmacSecret) {
            console.error('PAYMOB_HMAC_SECRET not configured');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        // Sort keys lexicographically and concatenate values
        // Paymob HMAC calculation involves specific fields in specific order
        // For Paymob V1 HMAC:
        const {
            amount_cents,
            created_at,
            currency,
            error_occured,
            has_parent_transaction,
            id,
            integration_id,
            is_3d_secure,
            is_auth,
            is_capture,
            is_refunded,
            is_standalone_payment,
            is_voided,
            order,
            owner,
            pending,
            source_data_pan,
            source_data_sub_type,
            source_data_type,
            success,
        } = obj;

        const dataToHash = [
            amount_cents,
            created_at,
            currency,
            error_occured,
            has_parent_transaction,
            id,
            integration_id,
            is_3d_secure,
            is_auth,
            is_capture,
            is_refunded,
            is_standalone_payment,
            is_voided,
            order.id,
            owner,
            pending,
            source_data_pan,
            source_data_sub_type,
            source_data_type,
            success,
        ].join('');

        const crypto = require('crypto');
        const calculatedHmac = crypto
            .createHmac('sha512', config.paymob.hmacSecret)
            .update(dataToHash)
            .digest('hex');

        if (calculatedHmac !== hmac) {
            console.error('HMAC Verification Failed');
            res.status(403).json({ error: 'Invalid HMAC' });
            return;
        }

        if (success === true) {
            const paymobOrderId = order.id.toString();

            // Find user by order ID and upgrade
            const user = await prisma.user.findFirst({ where: { paymobOrderId } });

            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { isPremium: true }
                });
                logInfo(`User ${user.id} upgraded to premium via Paymob`);
            }
        }

        res.json({ received: true });

    } catch (error) {
        logError(error as Error, { type: 'webhook' });
        res.status(500).json({ error: 'Webhook failed' });
    }
};

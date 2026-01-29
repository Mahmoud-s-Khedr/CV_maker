import axios from 'axios';
import config from '../config/config';

const PAYMOB_API_URL = 'https://accept.paymob.com/api';

export const getAuthToken = async (): Promise<string> => {
    const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
        api_key: config.paymob.apiKey
    });
    return response.data.token;
};

export const registerOrder = async (authToken: string, amountCents: number, merchantOrderId: string): Promise<number> => {
    const response = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: amountCents.toString(),
        currency: "EGP",
        merchant_order_id: merchantOrderId,
        items: []
    });
    return response.data.id;
};

export const getPaymentKey = async (
    authToken: string,
    orderId: number,
    amountCents: number,
    billingData: any
): Promise<string> => {
    const response = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: amountCents.toString(),
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: "EGP",
        integration_id: config.paymob.integrationId
    });
    return response.data.token;
};

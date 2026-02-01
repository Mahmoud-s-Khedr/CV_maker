import React, { useState } from 'react';
import { useAuthStore } from '../store/auth';
import * as api from '../lib/api';

export const PaymentPage: React.FC = () => {
    const { user } = useAuthStore();
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await api.initiatePayment({
                firstName: user.firstName || 'User',
                lastName: 'Customer', // Should get from profile
                email: user.email,
                phone: '+201000000000'
            });

            const { paymentKey, frameId } = response;
            const url = `https://accept.paymob.com/api/acceptance/iframes/${frameId}?payment_token=${paymentKey}`;
            setIframeUrl(url);
        } catch (error) {
            console.error(error);
            alert('Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    if (iframeUrl) {
        return (
            <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>
                    <div className="w-full bg-white shadow-lg rounded-lg overflow-hidden h-[calc(100vh-10rem)] min-h-[520px]">
                    <iframe
                        src={iframeUrl}
                        className="w-full h-full border-none"
                        title="Payment Frame"
                    />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 flex justify-center">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Upgrade to Premium</h2>
                <p className="text-gray-600">
                    Unlock unlimited AI usage, premium templates, and priority support.
                </p>
                <div className="text-5xl font-bold text-blue-600 my-8">
                    100 <span className="text-xl text-gray-500">EGP</span>
                </div>

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition transform hover:-translate-y-1 block"
                >
                    {loading ? 'Processing...' : 'Pay with Card / Wallet'}
                </button>
            </div>
        </div>
    );
};

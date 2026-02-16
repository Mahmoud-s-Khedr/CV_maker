import React, { useState } from 'react';
import { createCheckoutSession } from '../lib/api';

export const PaymentPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpgrade = async () => {
        setLoading(true);
        setError(null);
        try {
            const { url } = await createCheckoutSession();
            window.location.href = url;
        } catch (err) {
            console.error(err);
            setError('Failed to start checkout. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 flex justify-center">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Upgrade to Premium</h2>
                <p className="text-gray-600">
                    Unlock unlimited AI usage, premium templates, and priority support.
                </p>
                <div className="text-5xl font-bold text-blue-600 my-8">
                    $9.99 <span className="text-xl text-gray-500">one-time</span>
                </div>

                {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                )}

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg shadow transition transform hover:-translate-y-1 block"
                >
                    {loading ? 'Redirecting to checkout...' : 'Pay with Card'}
                </button>
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { getCurrentUser, verifyCheckoutSession } from '../lib/api';

export const PaymentSuccessPage: React.FC = () => {
    const { updateUser } = useAuthStore();
    const [searchParams] = useSearchParams();
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const verify = async () => {
            setVerifying(true);
            setError('');
            const sessionId = searchParams.get('session_id');

            try {
                if (sessionId) {
                    const result = await verifyCheckoutSession(sessionId);
                    if (result.verified && result.isPremium) {
                        updateUser({ isPremium: true });
                        return;
                    }
                }

                const user = await getCurrentUser();
                if (user?.isPremium) {
                    updateUser({ isPremium: true });
                    return;
                }

                setError('Payment recorded, but premium access is not confirmed yet. Please refresh shortly.');
            } catch (err) {
                console.error('Failed to verify payment session', err);
                setError('Could not verify payment status. Please refresh or contact support if this persists.');
            } finally {
                setVerifying(false);
            }
        };

        verify();
    }, [searchParams, updateUser]);

    return (
        <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 flex justify-center">
            <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-md text-center">
                <div className="text-6xl">🎉</div>
                <h2 className="text-3xl font-extrabold text-gray-900">You're Premium!</h2>
                <p className="text-gray-600">
                    Your payment was successful. You now have access to all premium features.
                </p>
                {verifying && (
                    <p className="text-sm text-gray-500">Verifying payment status...</p>
                )}
                {error && (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{error}</p>
                )}
                <Link
                    to="/dashboard"
                    className="inline-block mt-4 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
};

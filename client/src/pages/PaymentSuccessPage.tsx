import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export const PaymentSuccessPage: React.FC = () => {
    const { updateUser } = useAuthStore();

    // Optimistically mark the user as premium in local state.
    // The webhook will have already updated the DB; a page refresh
    // will re-fetch the current user state.
    useEffect(() => {
        updateUser({ isPremium: true });
    }, [updateUser]);

    return (
        <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 flex justify-center">
            <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-md text-center">
                <div className="text-6xl">🎉</div>
                <h2 className="text-3xl font-extrabold text-gray-900">You're Premium!</h2>
                <p className="text-gray-600">
                    Your payment was successful. You now have access to all premium features.
                </p>
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

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { forgotPassword } from '../lib/api';
import axios from 'axios';

interface FormData {
    email: string;
}

export const ForgotPasswordPage: React.FC = () => {
    const { register, handleSubmit } = useForm<FormData>();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setError('');
        setMessage('');
        try {
            const response = await forgotPassword(data.email);
            setMessage(response.message);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || 'Something went wrong. Please try again.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">Forgot your password?</h1>
                    <p className="mt-2 text-gray-500">
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {message ? (
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-gray-700">{message}</p>
                            <Link to="/login" className="block text-blue-600 hover:underline font-medium">
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    {...register('email', { required: true })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Sending…' : 'Send reset link'}
                            </button>

                            <p className="text-center text-sm text-gray-500">
                                <Link to="/login" className="text-blue-600 hover:underline">
                                    Back to sign in
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { api } from '../lib/api';

interface FormData {
    newPassword: string;
    confirmPassword: string;
}

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: FormData) => {
        if (data.newPassword !== data.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
            navigate('/login', {
                state: { message: 'Password reset successfully. Please sign in.' }
            });
        } catch (err: unknown) {
            setError(
                axios.isAxiosError(err)
                    ? err.response?.data?.error || 'Failed to reset password. The link may have expired.'
                    : 'Failed to reset password. The link may have expired.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-xl font-semibold text-gray-900">Invalid reset link</h1>
                    <p className="text-gray-500">This link is invalid or has already been used.</p>
                    <Link to="/forgot-password" className="text-blue-600 hover:underline">
                        Request a new reset link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">Set new password</h1>
                    <p className="mt-2 text-gray-500">Choose a strong password for your account.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New password
                            </label>
                            <input
                                type="password"
                                {...register('newPassword', {
                                    required: true,
                                    minLength: 8,
                                    pattern: PASSWORD_PATTERN,
                                })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="8+ chars, upper/lowercase, number"
                            />
                            {errors.newPassword?.type === 'required' && (
                                <p className="mt-1 text-xs text-red-600">Password is required</p>
                            )}
                            {errors.newPassword?.type === 'minLength' && (
                                <p className="mt-1 text-xs text-red-600">Password must be at least 8 characters</p>
                            )}
                            {errors.newPassword?.type === 'pattern' && (
                                <p className="mt-1 text-xs text-red-600">Use uppercase, lowercase, and a number</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm new password
                            </label>
                            <input
                                type="password"
                                {...register('confirmPassword', { required: true })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Repeat your password"
                            />
                            {errors.confirmPassword?.type === 'required' && (
                                <p className="mt-1 text-xs text-red-600">Please confirm your password</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Resetting…' : 'Reset password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/auth';
import * as api from '../lib/api';

export const AuthPage: React.FC<{ type: 'login' | 'register' }> = ({ type }) => {
    const isLogin = type === 'login';
    const { register, handleSubmit, getValues } = useForm();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated } = useAuthStore();
    const from = (location.state as any)?.from?.pathname || '/dashboard';

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const onSubmit = async (data: any) => {
        try {
            setError('');
            setSuccess('');
            setRequiresVerification(false);

            if (isLogin) {
                const result = await api.login(data);
                if (result.requiresTwoFactor) {
                    navigate('/2fa-verify', { state: { tempToken: result.tempToken }, replace: true });
                    return;
                }
                login(result.token, result.user);
                navigate(from, { replace: true });
            } else {
                await api.register({
                    ...data,
                    role: data.isRecruiter ? 'RECRUITER' : 'USER'
                });
                setSuccess('Registration successful! Please check your email to verify your account.');
                setRequiresVerification(true);
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            setError(errorData?.error || 'Authentication failed');

            if (errorData?.requiresVerification) {
                setRequiresVerification(true);
            }
        }
    };

    const handleResendVerification = async () => {
        const email = getValues('email');
        if (!email) {
            setError('Please enter your email address first');
            return;
        }

        setResending(true);
        try {
            await api.resendVerification(email);
            setSuccess('Verification email sent! Please check your inbox.');
            setError('');
        } catch (err) {
            setError('Failed to resend verification email');
        } finally {
            setResending(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const result = await api.googleLogin(credentialResponse.credential);
            if (result.requiresTwoFactor) {
                navigate('/2fa-verify', { state: { tempToken: result.tempToken }, replace: true });
                return;
            }
            login(result.token, result.user);
            navigate(from, { replace: true });
        } catch (err) {
            setError('Google Sign-In failed');
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#f8fafc] overflow-hidden">
            {/* Left Side: Decorative & Branding */}
            <div className="hidden lg:flex relative items-center justify-center p-12 overflow-hidden bg-slate-900">
                <div className="absolute top-0 left-0 w-full h-full opacity-30">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-lg text-center">
                    <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-6 tracking-tight">
                        Craft Your Professional Future
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed font-light">
                        Join thousands of professionals using our AI-powered resume builder to get hired by top companies worldwide.
                    </p>

                    <div className="mt-12 flex items-center justify-center space-x-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Mock Logos */}
                        <div className="h-6 w-24 bg-white/20 rounded"></div>
                        <div className="h-6 w-20 bg-white/20 rounded"></div>
                        <div className="h-6 w-28 bg-white/20 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="flex items-center justify-center p-6 sm:p-12 lg:p-24 relative">
                {/* Mobile Background Elements */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
                    <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-100 rounded-full blur-[100px]" />
                </div>

                <div className="w-full max-w-md space-y-8 relative">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {isLogin ? 'Welcome back' : 'Get started today'}
                        </h2>
                        <p className="mt-2 text-slate-500">
                            {isLogin ? (
                                <>New here?{' '}
                                    <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                                        Create an account
                                    </Link>
                                </>
                            ) : (
                                <>Already have an account?{' '}
                                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="mt-10">
                        {error && (
                            <div className="mb-6 flex items-center p-4 text-sm text-red-800 border border-red-100 rounded-xl bg-red-50/50 backdrop-blur-sm animate-shake">
                                <svg className="flex-shrink-0 inline w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <span className="font-medium">Error:</span> {error}
                                    {requiresVerification && isLogin && (
                                        <button
                                            type="button"
                                            onClick={handleResendVerification}
                                            disabled={resending}
                                            className="block mt-1 text-blue-600 hover:underline font-semibold"
                                        >
                                            {resending ? 'Sending...' : 'Resend verification email'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 flex items-center p-4 text-sm text-emerald-800 border border-emerald-100 rounded-xl bg-emerald-50/50 backdrop-blur-sm">
                                <svg className="flex-shrink-0 inline w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <span className="font-medium">Success:</span> {success}
                                    {requiresVerification && !isLogin && (
                                        <Link to="/login" className="block mt-1 text-blue-600 hover:underline font-semibold">
                                            Return to login
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="flex justify-center w-full">
                                <div className="w-full transform transition hover:scale-[1.01]">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google Sign-In failed')}
                                        theme="outline"
                                        size="large"
                                        width="100%"
                                        shape="pill"
                                    />
                                </div>
                            </div>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium uppercase tracking-widest">Or continue with email</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1 transition-colors group-focus-within:text-blue-600">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            {...register('email', { required: true })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="group">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-semibold text-slate-600 ml-1 transition-colors group-focus-within:text-blue-600">
                                                Password
                                            </label>
                                            {isLogin && (
                                                <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                                    Forgot password?
                                                </Link>
                                            )}
                                        </div>
                                        <input
                                            type="password"
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            {...register('password', { required: true })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />
                                    </div>

                                    {!isLogin && (
                                        <div className="flex items-center space-x-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="recruiter-role"
                                                {...register('isRecruiter')}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="recruiter-role" className="text-sm text-gray-600 select-none cursor-pointer">
                                                I am a Hiring Manager / Recruiter
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all duration-200 active:scale-[0.98] outline-none focus:ring-4 focus:ring-blue-100"
                                >
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <footer className="mt-8 text-center text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                        By continuing, you agree to our Terms of Service and Privacy Policy. Built for creators.
                    </footer>
                </div>
            </div>
        </div>
    );
};

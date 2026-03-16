import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import * as api from '../lib/api';

export const TwoFactorPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const tempToken = (location.state as any)?.tempToken;

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const isSubmittingRef = useRef(false);

    // Redirect if no temp token
    React.useEffect(() => {
        if (!tempToken) {
            navigate('/login', { replace: true });
        }
    }, [tempToken, navigate]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (!loading && !isSubmittingRef.current && newCode.every((d) => d !== '') && value) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newCode = pasted.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
            if (!loading && !isSubmittingRef.current) {
                handleSubmit(pasted);
            }
        }
    };

    const handleSubmit = async (codeStr?: string) => {
        const fullCode = codeStr || code.join('');
        if (fullCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        if (isSubmittingRef.current) {
            return;
        }

        isSubmittingRef.current = true;
        setLoading(true);
        setError('');
        try {
            const result = await api.validate2FA(tempToken, fullCode);
            login(result.token, result.user);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid code. Please try again.');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            isSubmittingRef.current = false;
            setLoading(false);
        }
    };

    if (!tempToken) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <div className="mx-auto w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
                    <p className="mt-2 text-sm text-gray-500">Enter the 6-digit code from your authenticator app</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <div className="flex justify-center gap-2 mb-8" onPaste={handlePaste}>
                    {code.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                            disabled={loading}
                            autoFocus={i === 0}
                        />
                    ))}
                </div>

                <button
                    onClick={() => handleSubmit()}
                    disabled={loading || code.some((d) => d === '')}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Verifying...' : 'Verify'}
                </button>

                <button
                    onClick={() => navigate('/login', { replace: true })}
                    className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                    Back to login
                </button>
            </div>
        </div>
    );
};

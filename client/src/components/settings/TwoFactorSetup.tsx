import React, { useState } from 'react';
import * as api from '../../lib/api';

export const TwoFactorSetup: React.FC<{ isEnabled: boolean; onToggle: (enabled: boolean) => void }> = ({ isEnabled, onToggle }) => {
    const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [disableCode, setDisableCode] = useState('');

    const handleSetup = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await api.setup2FA();
            setQrCodeUrl(result.qrCodeUrl);
            setSecret(result.secret);
            setStep('setup');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to set up 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySetup = async () => {
        if (code.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.verifySetup2FA(code);
            onToggle(true);
            setStep('idle');
            setCode('');
            setQrCodeUrl('');
            setSecret('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (disableCode.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.disable2FA(disableCode);
            onToggle(false);
            setDisableCode('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    if (isEnabled) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-green-600 mt-1">Enabled</p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">Active</span>
                </div>

                {error && <div className="mb-4 p-3 text-sm text-red-800 bg-red-50 rounded-lg">{error}</div>}

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter code to disable"
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                    />
                    <button
                        onClick={handleDisable}
                        disabled={loading}
                        className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition border border-red-200 disabled:opacity-50"
                    >
                        {loading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'setup') {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Up Two-Factor Authentication</h3>

                {error && <div className="mb-4 p-3 text-sm text-red-800 bg-red-50 rounded-lg">{error}</div>}

                <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-3">Scan this QR code with your authenticator app:</p>
                        {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto w-48 h-48" />}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Or enter this code manually:</p>
                        <code className="text-sm font-mono text-gray-800 break-all select-all">{secret}</code>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter the 6-digit code:</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setStep('idle'); setError(''); }}
                            className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleVerifySetup}
                            disabled={loading || code.length !== 6}
                            className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                </div>
                <button
                    onClick={handleSetup}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {loading ? 'Setting up...' : 'Enable 2FA'}
                </button>
            </div>
            {error && <div className="mt-4 p-3 text-sm text-red-800 bg-red-50 rounded-lg">{error}</div>}
        </div>
    );
};

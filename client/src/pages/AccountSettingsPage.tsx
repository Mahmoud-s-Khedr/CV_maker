import React, { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { TwoFactorSetup } from '../components/settings/TwoFactorSetup';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { Copy, Check, Puzzle } from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
    const { user, updateUser, token } = useAuthStore();
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled ?? false);
    const [tokenCopied, setTokenCopied] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [tokenCopyError, setTokenCopyError] = useState('');

    const handleCopyToken = async () => {
        if (!token) return;
        setTokenCopyError('');
        try {
            await navigator.clipboard.writeText(token);
            setTokenCopied(true);
            setTimeout(() => setTokenCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy extension token', err);
            setTokenCopyError('Could not copy token. Please copy it manually from the field.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

            <div className="space-y-6">
                {/* Account Info */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Account</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="text-gray-900">{user?.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Role</span>
                            <span className="text-gray-900">{user?.role}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Plan</span>
                            <span className={user?.isPremium ? 'text-green-600 font-medium' : 'text-gray-900'}>
                                {user?.isPremium ? 'Premium' : 'Free'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Two-Factor Authentication */}
                <TwoFactorSetup
                    isEnabled={twoFactorEnabled}
                    onToggle={(enabled) => {
                        setTwoFactorEnabled(enabled);
                        updateUser({ twoFactorEnabled: enabled });
                    }}
                />

                {/* Email Notifications */}
                <NotificationSettings />

                {/* Browser Extension */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Puzzle className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Browser Extension</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        The HandisCV Chrome extension lets you import your LinkedIn profile into a resume and save job
                        postings to your Job Tracker with one click. Paste the token below into the extension popup to
                        connect your account.
                    </p>
                    <div className="flex gap-2 mb-3">
                        <input
                            type={showToken ? 'text' : 'password'}
                            readOnly
                            value={token ?? ''}
                            className="flex-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-700 select-all"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken((v) => !v)}
                            className="px-3 py-2 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                        >
                            {showToken ? 'Hide' : 'Show'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyToken}
                            className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                            {tokenCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {tokenCopied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">
                        Treat this like a password — anyone with this token can access your account via the API.
                        It expires when your session expires.
                    </p>
                    {tokenCopyError && <p className="text-xs text-red-600 mt-2">{tokenCopyError}</p>}
                </div>
            </div>
        </div>
    );
};

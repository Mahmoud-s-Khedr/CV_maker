import React, { useEffect, useState } from 'react';
import * as api from '../../lib/api';

interface NotificationPrefs {
    resumeViewed: boolean;
    weeklyDigest: boolean;
    subscriptionReminder: boolean;
    accountActivity: boolean;
}

const LABELS: Record<keyof NotificationPrefs, { title: string; description: string }> = {
    resumeViewed: { title: 'Resume Viewed', description: 'Get notified when your resume reaches view milestones' },
    weeklyDigest: { title: 'Weekly Digest', description: 'Receive a weekly summary of resume views from the last 7 days' },
    subscriptionReminder: { title: 'Subscription Reminder', description: 'Get reminded before your premium subscription expires' },
    accountActivity: { title: 'Account Activity', description: 'Receive alerts about logins and account changes' },
};

export const NotificationSettings: React.FC = () => {
    const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getNotificationPreferences()
            .then((data) => {
                setPrefs(data);
                setError('');
            })
            .catch((err) => {
                console.error('Failed to load notification preferences', err);
                setError('Failed to load notification preferences. Please refresh and try again.');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async (key: keyof NotificationPrefs) => {
        if (!prefs) return;
        const newValue = !prefs[key];
        setPrefs({ ...prefs, [key]: newValue });
        setSaving(true);
        try {
            await api.updateNotificationPreferences({ [key]: newValue });
        } catch {
            // Revert on failure
            setPrefs({ ...prefs, [key]: !newValue });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-48" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Notifications</h3>
                <p className="text-sm text-red-700">{error}</p>
            </div>
        );
    }

    if (!prefs) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
            <div className="space-y-4">
                {(Object.keys(LABELS) as Array<keyof NotificationPrefs>).map((key) => (
                    <div key={key} className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-800">{LABELS[key].title}</p>
                            <p className="text-xs text-gray-500">{LABELS[key].description}</p>
                        </div>
                        <button
                            onClick={() => handleToggle(key)}
                            disabled={saving}
                            role="switch"
                            aria-checked={!!prefs[key]}
                            aria-label={`${LABELS[key].title} notifications`}
                            aria-disabled={saving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                prefs[key] ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                    prefs[key] ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

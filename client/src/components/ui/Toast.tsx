import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useResumeStore } from '../../store/resume';

export const Toast: React.FC = () => {
    const { notification, clearNotification } = useResumeStore();

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                clearNotification();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [notification, clearNotification]);

    if (!notification) return null;

    const isSuccess = notification.type === 'success';

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div className={`
                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
                ${isSuccess
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }
            `}>
                {isSuccess ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-medium">{notification.message}</span>
                <button
                    onClick={clearNotification}
                    className="ml-2 p-1 rounded-full hover:bg-black/5 transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

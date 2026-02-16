import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, X } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                    <div className="mx-auto w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <Crown className="w-7 h-7 text-amber-600" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">Upgrade to Premium</h2>
                    <p className="text-gray-600 text-sm mb-6">
                        {feature} is a premium feature. Upgrade your account to unlock it and get access to all premium templates, AI analysis, and more.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/payment');
                            }}
                            className="w-full py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition shadow-sm"
                        >
                            Upgrade Now
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 text-gray-500 text-sm hover:text-gray-700 transition"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Crown, Lock, Palette, X, Check } from 'lucide-react';
import { UpgradeModal } from '../UpgradeModal';

interface Template {
    id: string;
    name: string;
    isPremium?: boolean;
}

const BUILT_IN_TEMPLATES: Template[] = [
    { id: 'standard', name: 'Standard' },
    { id: 'modern', name: 'Modern' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'professional', name: 'Professional' },
    { id: 'executive', name: 'Executive' },
    { id: 'creative', name: 'Creative' },
    { id: 'compact', name: 'Compact' },
    { id: 'atscompact', name: 'ATS Compact' },
    { id: 'elegant', name: 'Elegant' },
    { id: 'twocolpro', name: 'Two-Column Pro' },
];

const ACCENT_COLORS: Record<string, string> = {
    standard: '#374151',
    modern: '#2563EB',
    minimalist: '#6B7280',
    professional: '#1E40AF',
    executive: '#92400E',
    creative: '#7C3AED',
    compact: '#0f766e',
    atscompact: '#1f2937',
    elegant: '#b8860b',
    twocolpro: '#1d4ed8',
};

interface TemplatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    currentTemplateId: string;
    customTemplates: Template[];
    isPremiumUser: boolean;
    onSelectTemplate: (id: string) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
    isOpen,
    onClose,
    currentTemplateId,
    customTemplates,
    isPremiumUser,
    onSelectTemplate,
}) => {
    const [showUpgrade, setShowUpgrade] = useState(false);

    if (!isOpen) return null;

    const handleSelect = (template: Template) => {
        if (template.isPremium && !isPremiumUser) {
            setShowUpgrade(true);
            return;
        }
        onSelectTemplate(template.id);
    };

    const renderCard = (template: Template) => {
        const isActive = currentTemplateId === template.id;
        const accentColor = ACCENT_COLORS[template.id] || '#3B82F6';

        return (
            <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`w-full text-left p-3 rounded-lg border-2 transition group relative ${
                    isActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
                <div
                    className="h-2 rounded-full mb-2"
                    style={{ backgroundColor: accentColor }}
                />
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{template.name}</span>
                    <div className="flex items-center gap-1">
                        {template.isPremium && (
                            isPremiumUser ? (
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                                <Lock className="w-3.5 h-3.5 text-gray-400" />
                            )
                        )}
                        {isActive && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 border-r border-gray-200 flex flex-col">
            <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} feature="Premium Templates" />

            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Templates
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Built-in</h4>
                    <div className="space-y-2">
                        {BUILT_IN_TEMPLATES.map(renderCard)}
                    </div>
                </div>

                {customTemplates.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom</h4>
                        <div className="space-y-2">
                            {customTemplates.map(renderCard)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

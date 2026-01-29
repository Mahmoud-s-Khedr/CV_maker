import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useResumeStore } from '../../store/resume';
import type { SectionType } from '../../types/resume';

interface AddSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SECTION_TYPES: { type: SectionType; label: string; description: string }[] = [
    { type: 'experience', label: 'Work Experience', description: 'Jobs, internships, freelance work' },
    { type: 'education', label: 'Education', description: 'Degrees, certifications, courses' },
    { type: 'skills', label: 'Skills', description: 'Technical and soft skills' },
    { type: 'projects', label: 'Projects', description: 'Personal or professional projects' },
    { type: 'certifications', label: 'Certifications', description: 'Professional certifications' },
    { type: 'languages', label: 'Languages', description: 'Languages you speak' },
    { type: 'custom', label: 'Custom Section', description: 'Create your own section' },
];

export const AddSectionModal: React.FC<AddSectionModalProps> = ({ isOpen, onClose }) => {
    const { addSection, showNotification } = useResumeStore();
    const [selectedType, setSelectedType] = useState<SectionType | null>(null);
    const [customTitle, setCustomTitle] = useState('');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!selectedType) return;

        const title = selectedType === 'custom'
            ? customTitle.trim() || 'Custom Section'
            : SECTION_TYPES.find(s => s.type === selectedType)?.label || 'New Section';

        addSection(selectedType, title);
        showNotification('success', `Added "${title}" section`);
        onClose();
        setSelectedType(null);
        setCustomTitle('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-up">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Add Section</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {SECTION_TYPES.map(({ type, label, description }) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition ${selectedType === type
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="font-medium text-gray-900">{label}</div>
                            <div className="text-sm text-gray-500">{description}</div>
                        </button>
                    ))}
                </div>

                {selectedType === 'custom' && (
                    <div className="px-4 pb-4">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Section Title
                        </label>
                        <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="e.g., Volunteer Work, Publications, Awards"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                )}

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedType}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Section
                    </button>
                </div>
            </div>
        </div>
    );
};

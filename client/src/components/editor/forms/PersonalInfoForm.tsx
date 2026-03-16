import React from 'react';
import { Plus, X } from 'lucide-react';
import { useResumeStore } from '../../../store/resume';
import type { ResumeProfile, SocialLink } from '../../../types/resume';
import { generateId } from '../../../types/resume';

interface PersonalInfoFormProps {
    className?: string;
}

const FIELDS: { key: Exclude<keyof ResumeProfile, 'links'>; label: string; type: 'text' | 'email' | 'tel' | 'url' | 'textarea'; placeholder: string }[] = [
    { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'jobTitle', label: 'Job Title', type: 'text', placeholder: 'Senior Software Engineer' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'San Francisco, CA' },
    { key: 'url', label: 'Website', type: 'url', placeholder: 'yoursite.com' },
];

const LINK_LABELS = ['LinkedIn', 'GitHub', 'Portfolio', 'Blog', 'Twitter/X', 'Behance', 'Dribbble', 'Other'];

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ className = '' }) => {
    const { resume, updateProfile, updateProfileLinks } = useResumeStore();
    const links: SocialLink[] = resume.profile.links ?? [];

    const addLink = () => {
        updateProfileLinks([...links, { id: generateId(), label: 'LinkedIn', url: '' }]);
    };

    const removeLink = (id: string) => {
        updateProfileLinks(links.filter(l => l.id !== id));
    };

    const updateLink = (id: string, field: 'label' | 'url', value: string) => {
        updateProfileLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    return (
        <section className={`space-y-4 ${className}`}>
            <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>

            <div className="grid grid-cols-2 gap-4">
                {FIELDS.map(({ key, label, type, placeholder }) => (
                    <div key={key as string} className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">{label}</label>
                        <input
                            type={type}
                            value={resume.profile[key] as string}
                            onChange={(e) => updateProfile(key, e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>
                ))}
            </div>

            {/* Social & Professional Links */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">Social &amp; Professional Links</label>
                    <button
                        type="button"
                        onClick={addLink}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Link
                    </button>
                </div>

                {links.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No links added yet. Click "Add Link" to add LinkedIn, GitHub, etc.</p>
                )}

                <div className="space-y-2">
                    {links.map((link) => (
                        <div key={link.id} className="flex items-center gap-2">
                            <select
                                value={link.label}
                                onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                                className="w-32 shrink-0 px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                            >
                                {LINK_LABELS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <input
                                type="url"
                                value={link.url}
                                onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                                placeholder="https://..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                            <button
                                type="button"
                                onClick={() => removeLink(link.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Professional Summary</label>
                <textarea
                    value={resume.profile.summary}
                    onChange={(e) => updateProfile('summary', e.target.value)}
                    rows={4}
                    placeholder="Experienced software engineer with a passion for building scalable web applications..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                />
            </div>
        </section>
    );
};

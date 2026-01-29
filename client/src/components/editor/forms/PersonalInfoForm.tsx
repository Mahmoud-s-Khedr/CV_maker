import React from 'react';
import { useResumeStore } from '../../../store/resume';
import type { ResumeProfile } from '../../../types/resume';

interface PersonalInfoFormProps {
    className?: string;
}

const FIELDS: { key: keyof ResumeProfile; label: string; type: 'text' | 'email' | 'tel' | 'url' | 'textarea'; placeholder: string }[] = [
    { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'jobTitle', label: 'Job Title', type: 'text', placeholder: 'Senior Software Engineer' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'San Francisco, CA' },
    { key: 'url', label: 'Website / LinkedIn', type: 'url', placeholder: 'linkedin.com/in/johndoe' },
];

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ className = '' }) => {
    const { resume, updateProfile } = useResumeStore();

    return (
        <section className={`space-y-4 ${className}`}>
            <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>

            <div className="grid grid-cols-2 gap-4">
                {FIELDS.map(({ key, label, type, placeholder }) => (
                    <div key={key as string} className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">{label}</label>
                        <input
                            type={type}
                            value={resume.profile[key]}
                            onChange={(e) => updateProfile(key, e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>
                ))}
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

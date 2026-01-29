import React from 'react';

interface FormFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'textarea' | 'date' | 'url';
    placeholder?: string;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    className = ''
}) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        {type === 'textarea' ? (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder-gray-400"
            />
        ) : (
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
            />
        )}
    </div>
);

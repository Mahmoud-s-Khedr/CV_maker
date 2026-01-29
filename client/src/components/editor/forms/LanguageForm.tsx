import React from 'react';
import { FormField } from './FormField';
import type { LanguageItem, SectionItem } from '../../../types/resume';

interface FormProps<T extends SectionItem> {
    item: T;
    sectionId: string;
    onUpdate: (sectionId: string, itemId: string, updates: Partial<SectionItem>) => void;
}

export const LanguageForm: React.FC<FormProps<LanguageItem>> = ({ item, sectionId, onUpdate }) => (
    <div className="grid grid-cols-2 gap-4">
        <FormField
            label="Language"
            value={item.name}
            onChange={(v) => onUpdate(sectionId, item.id, { name: v })}
            placeholder="e.g. Spanish"
        />
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proficiency</label>
            <select
                value={item.proficiency}
                onChange={(e) => onUpdate(sectionId, item.id, { proficiency: e.target.value as LanguageItem['proficiency'] })}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
                <option value="native">Native</option>
                <option value="fluent">Fluent</option>
                <option value="professional">Professional</option>
                <option value="intermediate">Intermediate</option>
                <option value="basic">Basic</option>
            </select>
        </div>
    </div>
);

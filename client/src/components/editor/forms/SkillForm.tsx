import React from 'react';
import { FormField } from './FormField';
import type { SkillItem, SectionItem } from '../../../types/resume';

interface FormProps<T extends SectionItem> {
    item: T;
    sectionId: string;
    onUpdate: (sectionId: string, itemId: string, updates: Partial<SectionItem>) => void;
}

export const SkillForm: React.FC<FormProps<SkillItem>> = ({ item, sectionId, onUpdate }) => (
    <div className="grid grid-cols-2 gap-4">
        <FormField
            label="Skill Name"
            value={item.name}
            onChange={(v) => onUpdate(sectionId, item.id, { name: v })}
            placeholder="e.g. React.js, Python, Leadership"
        />
        <FormField
            label="Category"
            value={item.category || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { category: v })}
            placeholder="e.g. Frontend, Backend, Soft Skills"
        />
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</label>
            <select
                value={item.level || ''}
                onChange={(e) => onUpdate(sectionId, item.id, { level: (e.target.value as SkillItem['level']) || undefined })}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
                <option value="">None / Hidden</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
            </select>
        </div>
    </div>
);

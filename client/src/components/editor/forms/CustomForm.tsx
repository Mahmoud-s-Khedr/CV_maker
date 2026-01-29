import React from 'react';
import { FormField } from './FormField';
import type { CustomItem, SectionItem } from '../../../types/resume';

interface FormProps<T extends SectionItem> {
    item: T;
    sectionId: string;
    onUpdate: (sectionId: string, itemId: string, updates: Partial<SectionItem>) => void;
}

export const CustomForm: React.FC<FormProps<CustomItem>> = ({ item, sectionId, onUpdate }) => (
    <div className="grid grid-cols-2 gap-4">
        <FormField
            label="Title"
            value={item.title}
            onChange={(v) => onUpdate(sectionId, item.id, { title: v })}
            placeholder="Item Title"
        />
        <FormField
            label="Subtitle"
            value={item.subtitle || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { subtitle: v })}
            placeholder="Subtitle (optional)"
        />
        <FormField
            label="Date"
            value={item.date || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { date: v })}
            placeholder="Date (optional)"
        />
        <div />
        <FormField
            label="Description"
            value={item.description || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { description: v })}
            type="textarea"
            placeholder="Description..."
            className="col-span-2"
        />
    </div>
);

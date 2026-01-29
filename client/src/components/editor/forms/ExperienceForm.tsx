import React from 'react';
import { FormField } from './FormField';
import type { ExperienceItem, SectionItem } from '../../../types/resume';

interface FormProps<T extends SectionItem> {
    item: T;
    sectionId: string;
    onUpdate: (sectionId: string, itemId: string, updates: Partial<SectionItem>) => void;
}

export const ExperienceForm: React.FC<FormProps<ExperienceItem>> = ({ item, sectionId, onUpdate }) => (
    <div className="grid grid-cols-2 gap-4">
        <FormField
            label="Position"
            value={item.position}
            onChange={(v) => onUpdate(sectionId, item.id, { position: v })}
            placeholder="e.g. Senior Software Engineer"
        />
        <FormField
            label="Company"
            value={item.company}
            onChange={(v) => onUpdate(sectionId, item.id, { company: v })}
            placeholder="e.g. Google"
        />
        <FormField
            label="Location"
            value={item.location || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { location: v })}
            placeholder="e.g. San Francisco, CA"
        />
        <div className="grid grid-cols-2 gap-3">
            <FormField
                label="Start Date"
                value={item.startDate}
                onChange={(v) => onUpdate(sectionId, item.id, { startDate: v })}
                placeholder="e.g. Jan 2020"
            />
            <FormField
                label="End Date"
                value={item.endDate || ''}
                onChange={(v) => onUpdate(sectionId, item.id, { endDate: v })}
                placeholder="Present"
            />
        </div>
        <FormField
            label="Description"
            value={item.description}
            onChange={(v) => onUpdate(sectionId, item.id, { description: v })}
            type="textarea"
            placeholder="Describe your key responsibilities and achievements..."
            className="col-span-2"
        />
    </div>
);

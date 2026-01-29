import React from 'react';
import { FormField } from './FormField';
import type { EducationItem, SectionItem } from '../../../types/resume';

interface FormProps<T extends SectionItem> {
    item: T;
    sectionId: string;
    onUpdate: (sectionId: string, itemId: string, updates: Partial<SectionItem>) => void;
}

export const EducationForm: React.FC<FormProps<EducationItem>> = ({ item, sectionId, onUpdate }) => (
    <div className="grid grid-cols-2 gap-4">
        <FormField
            label="Degree"
            value={item.degree}
            onChange={(v) => onUpdate(sectionId, item.id, { degree: v })}
            placeholder="e.g. Bachelor of Science"
        />
        <FormField
            label="Field of Study"
            value={item.field || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { field: v })}
            placeholder="e.g. Computer Science"
        />
        <FormField
            label="Institution"
            value={item.institution}
            onChange={(v) => onUpdate(sectionId, item.id, { institution: v })}
            placeholder="e.g. Stanford University"
        />
        <FormField
            label="GPA"
            value={item.gpa || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { gpa: v })}
            placeholder="e.g. 3.8"
        />
        <FormField
            label="Start Date"
            value={item.startDate}
            onChange={(v) => onUpdate(sectionId, item.id, { startDate: v })}
            placeholder="e.g. Sep 2016"
        />
        <FormField
            label="End Date"
            value={item.endDate || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { endDate: v })}
            placeholder="e.g. May 2020"
        />
        <div className="col-span-2">
            <FormField
                label="Description"
                value={item.description || ''}
                onChange={(v) => onUpdate(sectionId, item.id, { description: v })}
                placeholder="e.g. Graduated with honors, specialized in AI..."
                type="textarea"
            />
        </div>
    </div>
);

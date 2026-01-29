import React from 'react';
import { FormField } from './FormField';
import type { ProjectItem, SectionItem } from '../../../types/resume';

interface FormProps<T extends SectionItem> {
    item: T;
    sectionId: string;
    onUpdate: (sectionId: string, itemId: string, updates: Partial<SectionItem>) => void;
}

export const ProjectForm: React.FC<FormProps<ProjectItem>> = ({ item, sectionId, onUpdate }) => (
    <div className="grid grid-cols-2 gap-4">
        <FormField
            label="Project Name"
            value={item.name}
            onChange={(v) => onUpdate(sectionId, item.id, { name: v })}
            placeholder="e.g. E-Commerce Platform"
        />
        <FormField
            label="URL"
            value={item.url || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { url: v })}
            placeholder="e.g. github.com/user/repo"
        />
        <FormField
            label="Description"
            value={item.description}
            onChange={(v) => onUpdate(sectionId, item.id, { description: v })}
            type="textarea"
            placeholder="Describe the project, technologies used, and your role..."
            className="col-span-2"
        />
    </div>
);

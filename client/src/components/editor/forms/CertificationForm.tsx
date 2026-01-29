import React from 'react';
import { FormField } from './FormField';
import type { CertificationItem, SectionItem } from '../../../types/resume';

interface FormProps<T extends SectionItem> {
    item: T;
    sectionId: string;
    onUpdate: (sectionId: string, itemId: string, updates: Partial<SectionItem>) => void;
}

export const CertificationForm: React.FC<FormProps<CertificationItem>> = ({ item, sectionId, onUpdate }) => (
    <div className="grid grid-cols-2 gap-4">
        <FormField
            label="Certification Name"
            value={item.name}
            onChange={(v) => onUpdate(sectionId, item.id, { name: v })}
            placeholder="e.g. AWS Certified Solutions Architect"
        />
        <FormField
            label="Issuer"
            value={item.issuer}
            onChange={(v) => onUpdate(sectionId, item.id, { issuer: v })}
            placeholder="e.g. Amazon Web Services"
        />
        <FormField
            label="Date"
            value={item.date}
            onChange={(v) => onUpdate(sectionId, item.id, { date: v })}
            placeholder="e.g. Dec 2023"
        />
        <FormField
            label="Credential URL"
            value={item.url || ''}
            onChange={(v) => onUpdate(sectionId, item.id, { url: v })}
            placeholder="https://..."
        />
    </div>
);

import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { ResumeSchema } from '../../types/resume';
import { StandardTemplate } from './templates/StandardTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { ProfessionalTemplate } from './templates/ProfessionalTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';

interface ResumeDocumentProps {
    data: ResumeSchema;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({ data }) => {
    // Default to 'standard' if undefined
    // We assume data.meta might be missing in older state versions, so we guard
    const templateId = (data.meta && data.meta.templateId) ? data.meta.templateId : 'standard';

    const renderTemplate = () => {
        switch (templateId) {
            case 'modern':
                return <ModernTemplate data={data} />;
            case 'minimalist':
                return <MinimalistTemplate data={data} />;
            case 'professional':
                return <ProfessionalTemplate data={data} />;
            case 'executive':
                return <ExecutiveTemplate data={data} />;
            case 'creative':
                return <CreativeTemplate data={data} />;
            case 'standard':
            default:
                return <StandardTemplate data={data} />;
        }
    };

    return (
        <Document>
            {renderTemplate()}
        </Document>
    );
};

import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { ResumeSchema } from '../../types/resume';
import { StandardTemplate } from './templates/StandardTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { ProfessionalTemplate } from './templates/ProfessionalTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { DynamicTemplateRenderer } from './DynamicTemplateRenderer';
import type { TemplateConfig } from '../../types/template';

interface ResumeDocumentProps {
    data: ResumeSchema;
    dynamicConfig?: TemplateConfig | null;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({ data, dynamicConfig }) => {
    // Default to 'standard' if undefined
    const templateId = (data.meta && data.meta.templateId) ? data.meta.templateId : 'standard';

    const renderTemplate = () => {
        // If we have dynamic config and it matches the ID (or we just prioritize it if present)
        if (dynamicConfig) {
            return <DynamicTemplateRenderer data={data} config={dynamicConfig} />;
        }

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

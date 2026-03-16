import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { ResumeSchema } from '../../types/resume';
import { StandardTemplate } from './templates/StandardTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { ProfessionalTemplate } from './templates/ProfessionalTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { CompactTemplate } from './templates/CompactTemplate';
import { AtsCompactTemplate } from './templates/AtsCompactTemplate';
import { ElegantTemplate } from './templates/ElegantTemplate';
import { TwoColumnProTemplate } from './templates/TwoColumnProTemplate';
import { DynamicTemplateRenderer } from './DynamicTemplateRenderer';
import { isBuiltInTemplateId } from './builtInTemplates';
import type { TemplateConfig } from '../../types/template';
import type { SkillItem } from '../../types/resume';

interface ResumeDocumentProps {
    data: ResumeSchema;
    dynamicConfig?: TemplateConfig | null;
    atsMode?: boolean;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({ data, dynamicConfig, atsMode = false }) => {
    // Default to 'standard' if undefined
    const templateId = (data.meta && data.meta.templateId) ? data.meta.templateId : 'standard';

    const renderTemplate = () => {
        if (dynamicConfig && !isBuiltInTemplateId(templateId)) {
            return <DynamicTemplateRenderer data={data} config={dynamicConfig} atsMode={atsMode} />;
        }

        switch (templateId) {
            case 'modern':
                return <ModernTemplate data={data} atsMode={atsMode} />;
            case 'minimalist':
                return <MinimalistTemplate data={data} atsMode={atsMode} />;
            case 'professional':
                return <ProfessionalTemplate data={data} atsMode={atsMode} />;
            case 'executive':
                return <ExecutiveTemplate data={data} atsMode={atsMode} />;
            case 'creative':
                return <CreativeTemplate data={data} atsMode={atsMode} />;
            case 'compact':
                return <CompactTemplate data={data} atsMode={atsMode} />;
            case 'atscompact':
                return <AtsCompactTemplate data={data} atsMode={atsMode} />;
            case 'elegant':
                return <ElegantTemplate data={data} atsMode={atsMode} />;
            case 'twocolpro':
                return <TwoColumnProTemplate data={data} atsMode={atsMode} />;
            case 'standard':
            default:
                return <StandardTemplate data={data} atsMode={atsMode} />;
        }
    };

    const skillKeywords = data.sections
        .filter(s => s.type === 'skills')
        .flatMap(s => (s.items as SkillItem[]).map((item) => item.name))
        .filter(Boolean);

    const metaKeywords = [data.profile.fullName, data.profile.jobTitle, ...skillKeywords]
        .filter(Boolean)
        .join(', ');

    return (
        <Document
            title={`${data.profile.fullName}${data.profile.jobTitle ? ` - ${data.profile.jobTitle}` : ''}`}
            author={data.profile.fullName || ''}
            subject={data.profile.jobTitle || 'Resume'}
            keywords={metaKeywords}
            creator="HandisCV"
            producer="HandisCV"
        >
            {renderTemplate()}
        </Document>
    );
};

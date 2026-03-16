export const BUILT_IN_TEMPLATE_IDS = [
    'modern',
    'minimalist',
    'standard',
    'professional',
    'executive',
    'creative',
    'compact',
    'atscompact',
    'elegant',
    'twocolpro',
] as const;

export const isBuiltInTemplateId = (templateId?: string | null): boolean => {
    if (!templateId) {
        return true;
    }

    return BUILT_IN_TEMPLATE_IDS.includes(templateId as (typeof BUILT_IN_TEMPLATE_IDS)[number]);
};

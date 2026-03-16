import type {
    CertificationItem,
    CustomItem,
    EducationItem,
    ExperienceItem,
    LanguageItem,
    ProjectItem,
    ResumeSection,
    SectionItem,
    SkillItem,
} from '../../types/resume';

export const normalizeExternalUrl = (url?: string): string => {
    const trimmed = url?.trim() ?? '';
    if (!trimmed) {
        return '';
    }

    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const formatExternalUrl = (url?: string): string => {
    const normalized = normalizeExternalUrl(url);
    if (!normalized) {
        return '';
    }

    return normalized.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
};

export const sanitizeText = (value?: string): string => {
    return (value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
};

export const formatDateRange = (
    startDate?: string,
    endDate?: string,
    options?: {
        fallbackToPresent?: boolean;
        presentLabel?: string;
    }
): string => {
    const start = startDate?.trim() ?? '';
    const end = endDate?.trim() ?? '';
    const presentLabel = options?.presentLabel ?? 'Present';

    if (start && end) {
        return `${start} - ${end}`;
    }

    if (start) {
        return options?.fallbackToPresent ? `${start} - ${presentLabel}` : start;
    }

    return end;
};

export const formatItemDate = (item: {
    date?: string;
    startDate?: string;
    endDate?: string;
}): string => {
    const explicitDate = item.date?.trim() ?? '';
    if (explicitDate) {
        return explicitDate;
    }

    return formatDateRange(item.startDate, item.endDate, {
        fallbackToPresent: Boolean(item.startDate?.trim()),
    });
};

export const asExperienceItem = (item: SectionItem): ExperienceItem => item as ExperienceItem;

export const asEducationItem = (item: SectionItem): EducationItem => item as EducationItem;

export const asSkillItem = (item: SectionItem): SkillItem => item as SkillItem;

export const asProjectItem = (item: SectionItem): ProjectItem => item as ProjectItem;

export const asCertificationItem = (item: SectionItem): CertificationItem => item as CertificationItem;

export const asLanguageItem = (item: SectionItem): LanguageItem => item as LanguageItem;

export const asCustomItem = (item: SectionItem): CustomItem => item as CustomItem;

export const getSkillItems = (section: ResumeSection): SkillItem[] => section.items as SkillItem[];

export const getLanguageItems = (section: ResumeSection): LanguageItem[] => section.items as LanguageItem[];

export const sectionHasSkillCategories = (section: ResumeSection): boolean => {
    return getSkillItems(section).some((item) => Boolean(item.category));
};

export const groupSkillItemsByCategory = (section: ResumeSection): Record<string, SkillItem[]> => {
    return getSkillItems(section).reduce<Record<string, SkillItem[]>>((groups, item) => {
        const category = item.category || 'Other';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});
};

export const getSectionItemTitle = (item: SectionItem): string => {
    if ('title' in item && item.title) {
        return sanitizeText(item.title);
    }
    if ('position' in item && item.position) {
        return sanitizeText(item.position);
    }
    if ('company' in item && item.company) {
        return sanitizeText(item.company);
    }
    if ('institution' in item && item.institution) {
        return sanitizeText(item.institution);
    }
    if ('name' in item && item.name) {
        return sanitizeText(item.name);
    }

    return '';
};

export const getSectionItemSubtitle = (item: SectionItem): string => {
    if ('subtitle' in item && item.subtitle) {
        return sanitizeText(item.subtitle);
    }
    if ('company' in item && item.company) {
        const company = sanitizeText(item.company);
        const location = 'location' in item ? sanitizeText(item.location) : '';
        return [company, location].filter(Boolean).join(' | ');
    }
    if ('degree' in item && item.degree) {
        const degree = sanitizeText(item.degree);
        const field = 'field' in item ? sanitizeText(item.field) : '';
        return [degree, field ? `in ${field}` : ''].filter(Boolean).join(' ');
    }
    if ('issuer' in item && item.issuer) {
        return sanitizeText(item.issuer);
    }

    return '';
};

export const getSectionItemDescription = (item: SectionItem): string => {
    return 'description' in item && item.description ? sanitizeText(item.description) : '';
};

export const getSectionItemDate = (item: SectionItem): string => {
    return formatItemDate({
        date: 'date' in item && typeof item.date === 'string' ? item.date : undefined,
        startDate: 'startDate' in item && typeof item.startDate === 'string' ? item.startDate : undefined,
        endDate: 'endDate' in item && typeof item.endDate === 'string' ? item.endDate : undefined,
    });
};

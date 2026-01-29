export type SectionType = 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'custom';

// --- Section Item Types ---
export interface ExperienceItem {
    id: string;
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string; // Empty = Present
    description: string;
    highlights: string[];
}

export interface EducationItem {
    id: string;
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    description?: string;
    highlights: string[];
}

export interface SkillItem {
    id: string;
    name: string;
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    category?: string;
}

export interface ProjectItem {
    id: string;
    name: string;
    description: string;
    url?: string;
    technologies: string[];
    highlights: string[];
}

export interface CertificationItem {
    id: string;
    name: string;
    issuer: string;
    date: string;
    url?: string;
}

export interface LanguageItem {
    id: string;
    name: string;
    proficiency: 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic';
}

export interface CustomItem {
    id: string;
    title: string;
    subtitle?: string;
    date?: string;
    description?: string;
}

export type SectionItem = ExperienceItem | EducationItem | SkillItem | ProjectItem | CertificationItem | LanguageItem | CustomItem;

// --- Section ---
export interface ResumeSection {
    id: string;
    type: SectionType;
    title: string;
    isVisible: boolean;
    columns: 1 | 2;
    items: SectionItem[];
}

// --- Theme ---
export interface ThemeConfig {
    primaryColor: string;
    fontFamily: string;
    spacing: 'compact' | 'standard' | 'relaxed';
}

// --- Profile ---
export interface ResumeProfile {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    url: string;
    summary: string;
}

// --- Main Schema (Content) ---
export interface ResumeSchema {
    meta: {
        templateId: string;
        themeConfig: ThemeConfig;
    };
    profile: ResumeProfile;
    sections: ResumeSection[];
}

// --- API Response Type ---
export interface Resume {
    id: string;
    title: string;
    content: ResumeSchema;
    userId: string;
    isPublic: boolean;
    shareKey?: string;
    createdAt: string;
    updatedAt: string;
}

// --- Helper to generate unique IDs ---
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

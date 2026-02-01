import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as api from '../lib/api';
import type { ResumeSchema, ResumeSection, SectionItem, SectionType } from '../types/resume';
import type { TemplateConfig } from '../types/template';
import { generateId } from '../types/resume';

interface ResumeState {
    resume: ResumeSchema;
    notification: { type: 'success' | 'error'; message: string } | null;

    // Profile Actions
    updateProfile: (field: keyof ResumeSchema['profile'], value: string) => void;

    // Section Actions
    setSections: (sections: ResumeSchema['sections']) => void;
    addSection: (type: SectionType, title: string) => void;
    deleteSection: (sectionId: string) => void;
    updateSectionTitle: (sectionId: string, title: string) => void;
    toggleSectionVisibility: (sectionId: string) => void;

    // Section Item Actions
    addSectionItem: (sectionId: string, item: SectionItem) => void;
    updateSectionItem: (sectionId: string, itemId: string, updates: Partial<SectionItem>) => void;
    deleteSectionItem: (sectionId: string, itemId: string) => void;

    // Template
    updateTemplate: (templateId: string) => void;

    // Notifications
    showNotification: (type: 'success' | 'error', message: string) => void;
    clearNotification: () => void;

    // Backend Integration
    backendId: string | null;
    isSaving: boolean;
    saveToBackend: () => Promise<void>;
    loadFromBackend: (id: string) => Promise<void>;
    resetResume: () => void;

    // Dynamic Templates
    dynamicTemplateConfig: TemplateConfig | null;
    loadDynamicTemplate: (templateId: string) => Promise<void>;

    // Sharing
    isPublic: boolean;
    shareKey: string | null;
    togglePublic: (isPublic: boolean) => Promise<void>;
}

const INITIAL_RESUME: ResumeSchema = {
    meta: {
        templateId: 'modern',
        themeConfig: {
            primaryColor: '#2563EB',
            fontFamily: 'Inter',
            spacing: 'standard',
        },
    },
    profile: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        url: '',
        summary: '',
    },
    sections: [
        {
            id: 'experience',
            type: 'experience',
            title: 'Experience',
            isVisible: true,
            columns: 1,
            items: [],
        },
        {
            id: 'education',
            type: 'education',
            title: 'Education',
            isVisible: true,
            columns: 1,
            items: [],
        },
        {
            id: 'skills',
            type: 'skills',
            title: 'Skills',
            isVisible: true,
            columns: 2,
            items: [],
        }
    ],
};

export const useResumeStore = create<ResumeState>()(
    immer((set, get) => ({
        resume: INITIAL_RESUME,
        notification: null,

        // Profile Actions
        updateProfile: (field, value) =>
            set((state) => {
                state.resume.profile[field] = value;
            }),

        // Section Actions
        setSections: (sections) =>
            set((state) => {
                state.resume.sections = sections;
            }),

        addSection: (type, title) =>
            set((state) => {
                const newSection: ResumeSection = {
                    id: generateId(),
                    type,
                    title,
                    isVisible: true,
                    columns: type === 'skills' || type === 'languages' ? 2 : 1,
                    items: [],
                };
                state.resume.sections.push(newSection);
            }),

        deleteSection: (sectionId) =>
            set((state) => {
                const index = state.resume.sections.findIndex(s => s.id === sectionId);
                if (index !== -1) {
                    state.resume.sections.splice(index, 1);
                }
            }),

        updateSectionTitle: (sectionId, title) =>
            set((state) => {
                const section = state.resume.sections.find(s => s.id === sectionId);
                if (section) {
                    section.title = title;
                }
            }),

        toggleSectionVisibility: (sectionId) =>
            set((state) => {
                const section = state.resume.sections.find(s => s.id === sectionId);
                if (section) {
                    section.isVisible = !section.isVisible;
                }
            }),

        // Section Item Actions
        addSectionItem: (sectionId, item) =>
            set((state) => {
                const section = state.resume.sections.find(s => s.id === sectionId);
                if (section) {
                    section.items.push(item);
                }
            }),

        updateSectionItem: (sectionId, itemId, updates) =>
            set((state) => {
                const section = state.resume.sections.find(s => s.id === sectionId);
                if (section) {
                    const itemIndex = section.items.findIndex(i => i.id === itemId);
                    if (itemIndex !== -1) {
                        section.items[itemIndex] = { ...section.items[itemIndex], ...updates };
                    }
                }
            }),

        deleteSectionItem: (sectionId, itemId) =>
            set((state) => {
                const section = state.resume.sections.find(s => s.id === sectionId);
                if (section) {
                    const itemIndex = section.items.findIndex(i => i.id === itemId);
                    if (itemIndex !== -1) {
                        section.items.splice(itemIndex, 1);
                    }
                }
            }),

        // Template
        updateTemplate: (templateId: string) => {
            set((state) => {
                if (!state.resume.meta) {
                    state.resume.meta = {
                        templateId,
                        themeConfig: {
                            primaryColor: '#000000',
                            fontFamily: 'Helvetica',
                            spacing: 'standard'
                        }
                    };
                } else {
                    state.resume.meta.templateId = templateId;
                }
            });
            // Trigger load for dynamic template
            get().loadDynamicTemplate(templateId);
        },

        // Notifications
        showNotification: (type, message) =>
            set((state) => {
                state.notification = { type, message };
            }),

        clearNotification: () =>
            set((state) => {
                state.notification = null;
            }),

        // Backend Integration
        backendId: null,
        isSaving: false,
        saveToBackend: async () => {
            const state = get();
            // Get user from auth store if available
            const authStorage = localStorage.getItem('cv-maker-auth');
            const userId = authStorage ? JSON.parse(authStorage)?.state?.user?.id : null;

            if (!userId) {
                set((s) => {
                    s.notification = { type: 'error', message: 'Please log in to save your resume' };
                });
                return;
            }

            set((s) => { s.isSaving = true; });
            try {
                if (state.backendId) {
                    await api.updateResume(state.backendId, { content: state.resume });
                } else {
                    const result = await api.saveResume(userId, state.resume);
                    set((s) => { s.backendId = result.data.id; });
                }
                set((s) => {
                    s.notification = { type: 'success', message: 'Resume saved successfully!' };
                    s.isSaving = false;
                });
            } catch (err) {
                console.error("Failed to save", err);
                set((s) => {
                    s.notification = { type: 'error', message: 'Failed to save resume. Please try again.' };
                    s.isSaving = false;
                });
            }
        },
        loadFromBackend: async (id) => {
            set((s) => { s.isSaving = true; });
            try {
                const data = await api.loadResume(id);
                set((s) => {
                    s.resume = data.content as ResumeSchema;
                    s.backendId = data.id;
                    s.isPublic = data.isPublic;
                    s.shareKey = data.shareKey || null;
                    s.isSaving = false;
                    s.notification = { type: 'success', message: 'Resume loaded!' };
                });

                // Load template config if needed
                if (data.content.meta?.templateId) {
                    get().loadDynamicTemplate(data.content.meta.templateId);
                }
            } catch (err) {
                console.error("Failed to load", err);
                set((s) => {
                    s.notification = { type: 'error', message: 'Failed to load resume' };
                    s.isSaving = false;
                });
            }
        },
        resetResume: () =>
            set((state) => {
                state.resume = INITIAL_RESUME;
                state.backendId = null;
                state.notification = null;
                state.dynamicTemplateConfig = null;
                state.isPublic = false;
                state.shareKey = null;
            }),

        // Dynamic Templates
        dynamicTemplateConfig: null,
        loadDynamicTemplate: async (templateId) => {
            // Check if it's a standard template first to avoid unnecessary API calls
            const STANDARD_TEMPLATES = ['modern', 'minimalist', 'standard', 'professional', 'executive', 'creative'];
            if (STANDARD_TEMPLATES.includes(templateId)) {
                set((state) => { state.dynamicTemplateConfig = null; });
                return;
            }

            try {
                const template = await api.getTemplate(templateId);
                set((state) => {
                    state.dynamicTemplateConfig = template.config;
                    // Also ensure styling metadata matches if needed
                    if (state.resume.meta) {
                        // Optional: overwrite theme config from template
                    }
                });
            } catch (err) {
                console.error("Failed to load template config", err);
            }
        },

        // Sharing
        isPublic: false,
        shareKey: null,
        togglePublic: async (isPublic) => {
            const state = get();
            if (!state.backendId) {
                set((s) => { s.notification = { type: 'error', message: 'Please save your resume first.' }; });
                return;
            }

            set((s) => { s.isSaving = true });
            try {
                // Update backend
                const result = await api.updateResume(state.backendId, { isPublic });

                set((s) => {
                    s.isPublic = result.data.isPublic;
                    s.shareKey = result.data.shareKey;
                    s.isSaving = false;
                    s.notification = { type: 'success', message: `Resume is now ${isPublic ? 'Public' : 'Private'}` };
                });
            } catch (err) {
                console.error(err);
                set((s) => {
                    s.isSaving = false;
                    s.notification = { type: 'error', message: 'Failed to update visibility' };
                });
            }
        }
    }))
);

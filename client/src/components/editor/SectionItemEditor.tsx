import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useResumeStore } from '../../store/resume';
import type {
    ResumeSection,
    SectionItem,
    ExperienceItem,
    EducationItem,
    SkillItem,
    ProjectItem,
    CertificationItem,
    LanguageItem,
    CustomItem
} from '../../types/resume';
import { generateId } from '../../types/resume';
import { ExperienceForm } from './forms/ExperienceForm';
import { EducationForm } from './forms/EducationForm';
import { SkillForm } from './forms/SkillForm';
import { ProjectForm } from './forms/ProjectForm';
import { CertificationForm } from './forms/CertificationForm';
import { LanguageForm } from './forms/LanguageForm';
import { CustomForm } from './forms/CustomForm';
import { GitHubImportModal } from './modals/GitHubImportModal';

interface SectionItemEditorProps {
    section: ResumeSection;
}

export const SectionItemEditor: React.FC<SectionItemEditorProps> = ({ section }) => {
    const { addSectionItem, updateSectionItem, deleteSectionItem } = useResumeStore();
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [showGitHubModal, setShowGitHubModal] = useState(false);

    const createNewItem = (): SectionItem => {
        const id = generateId();

        switch (section.type) {
            case 'experience':
                return { id, company: '', position: '', startDate: '', endDate: '', description: '', highlights: [] } as ExperienceItem;
            case 'education':
                return { id, institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', highlights: [] } as EducationItem;
            case 'skills':
                return { id, name: '', level: 'intermediate', category: '' } as SkillItem;
            case 'projects':
                return { id, name: '', description: '', url: '', technologies: [], highlights: [] } as ProjectItem;
            case 'certifications':
                return { id, name: '', issuer: '', date: '', url: '' } as CertificationItem;
            case 'languages':
                return { id, name: '', proficiency: 'professional' } as LanguageItem;
            default:
                return { id, title: '', subtitle: '', date: '', description: '' } as CustomItem;
        }
    };

    const handleAddItem = () => {
        const newItem = createNewItem();
        addSectionItem(section.id, newItem);
        setExpandedItemId(newItem.id);
    };

    const renderItemForm = (item: SectionItem) => {
        switch (section.type) {
            case 'experience':
                return <ExperienceForm item={item as ExperienceItem} sectionId={section.id} onUpdate={updateSectionItem} />;
            case 'education':
                return <EducationForm item={item as EducationItem} sectionId={section.id} onUpdate={updateSectionItem} />;
            case 'skills':
                return <SkillForm item={item as SkillItem} sectionId={section.id} onUpdate={updateSectionItem} />;
            case 'projects':
                return <ProjectForm item={item as ProjectItem} sectionId={section.id} onUpdate={updateSectionItem} />;
            case 'certifications':
                return <CertificationForm item={item as CertificationItem} sectionId={section.id} onUpdate={updateSectionItem} />;
            case 'languages':
                return <LanguageForm item={item as LanguageItem} sectionId={section.id} onUpdate={updateSectionItem} />;
            default:
                return <CustomForm item={item as CustomItem} sectionId={section.id} onUpdate={updateSectionItem} />;
        }
    };

    const getItemTitle = (item: SectionItem): string => {
        if ('position' in item && item.position) return item.position;
        if ('degree' in item && item.degree) return item.degree;
        if ('name' in item && item.name) return item.name;
        if ('title' in item && item.title) return item.title;
        return 'New Item';
    };

    const getItemSubtitle = (item: SectionItem): string => {
        if ('company' in item && item.company) return item.company;
        if ('institution' in item && item.institution) return item.institution;
        if ('issuer' in item && item.issuer) return item.issuer;
        if ('subtitle' in item && item.subtitle) return item.subtitle;
        return '';
    };

    return (
        <div className="space-y-3">
            {section.items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                    <div
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${expandedItemId === item.id ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'
                            }`}
                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    >
                        <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div>
                                <div className="font-semibold text-gray-800 text-sm">
                                    {getItemTitle(item) || <span className="text-gray-400 italic">Untitled</span>}
                                </div>
                                {getItemSubtitle(item) && (
                                    <div className="text-xs text-gray-500 mt-0.5">{getItemSubtitle(item)}</div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSectionItem(section.id, item.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete Item"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {expandedItemId === item.id ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {expandedItemId === item.id && (
                        <div className="p-4 border-t border-gray-100 bg-white">
                            {renderItemForm(item)}
                        </div>
                    )}
                </div>
            ))}

            <button
                onClick={handleAddItem}
                className="w-full py-2.5 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 group"
            >
                <div className="p-1 rounded-full bg-gray-100 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600 transition-colors">
                    <Plus className="w-4 h-4" />
                </div>
                Add {section.type === 'experience' ? 'Experience' : section.type === 'education' ? 'Education' : section.type === 'skills' ? 'Skill' : 'Item'}
            </button>

            {section.type === 'projects' && (
                <div className="mt-2">
                    <button
                        onClick={() => setShowGitHubModal(true)}
                        className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        Import from GitHub
                    </button>
                    <GitHubImportModal
                        isOpen={showGitHubModal}
                        onClose={() => setShowGitHubModal(false)}
                        sectionId={section.id}
                    />
                </div>
            )}
        </div>
    );
};


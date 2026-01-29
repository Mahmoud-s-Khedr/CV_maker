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

interface SectionItemEditorProps {
    section: ResumeSection;
}

export const SectionItemEditor: React.FC<SectionItemEditorProps> = ({ section }) => {
    const { addSectionItem, updateSectionItem, deleteSectionItem } = useResumeStore();
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

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
        </div>
    );
};


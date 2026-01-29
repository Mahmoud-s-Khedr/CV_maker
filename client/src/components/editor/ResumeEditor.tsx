import React, { useEffect, useMemo, useState } from 'react';
import { useResumeStore } from '../../store/resume';
import { useParams, useNavigate } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePDF } from '@react-pdf/renderer';

import { Plus, Eye, EyeOff, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { SortableSection } from './SortableSection';
import { ResumeDocument } from '../pdf/ResumeDocument';
import { useDebounce } from '../../hooks/useDebounce';
import { AnalysisPanel } from './AnalysisPanel';
import { HistoryPanel } from './HistoryPanel';
import { PDFPreview } from './PDFPreview';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import { SectionItemEditor } from './SectionItemEditor';
import { AddSectionModal } from './AddSectionModal';
import { Toast } from '../ui/Toast';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import 'react-pdf/dist/Page/TextLayer.css';

export const ResumeEditor: React.FC = () => {
    const {
        resume,
        setSections,
        updateTemplate,
        saveToBackend,
        isSaving,
        backendId,
        toggleSectionVisibility,
        deleteSection,
        showNotification,
        updateProfile,
        loadFromBackend,
        resetResume
    } = useResumeStore();

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

    // Performance: Debounce the resume data passed to the heavy PDF renderer
    const debouncedResume = useDebounce(resume, 500);

    // Stable reference for the PDF document
    const pdfDocument = useMemo(() => <ResumeDocument data={debouncedResume} />, [debouncedResume]);

    // Generate PDF Blob URL
    // Fix: Explicitly type or inspect usePDF return if needed, but usually it returns [instance, updateInstance]
    const [instance, updateInstance] = usePDF({ document: pdfDocument });

    // Explicitly trigger update when debounced data changes
    useEffect(() => {
        updateInstance(pdfDocument);
    }, [debouncedResume, pdfDocument, updateInstance]);

    // Load Resume on Mount
    useEffect(() => {
        if (id) {
            loadFromBackend(id);
        } else {
            resetResume();
        }
    }, [id, loadFromBackend, resetResume]);

    // Set up Dnd-Kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = resume.sections.findIndex((s) => s.id === active.id);
            const newIndex = resume.sections.findIndex((s) => s.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newSections = arrayMove(resume.sections, oldIndex, newIndex);
                setSections(newSections);
            }
        }
    }

    const handleLinkedInImport = async (file: File) => {
        try {
            const { importLinkedInResume } = await import('../../lib/api');
            const result = await importLinkedInResume(file);

            if (result.success && result.data.profile) {
                updateProfile('fullName', result.data.profile.fullName || '');
                updateProfile('email', result.data.profile.email || '');
                updateProfile('phone', result.data.profile.phone || '');
                updateProfile('summary', result.data.profile.rawText?.slice(0, 500) || '');
                showNotification('success', 'LinkedIn profile imported successfully!');
            } else {
                showNotification('error', 'Could not parse LinkedIn PDF');
            }
        } catch (err) {
            console.error(err);
            showNotification('error', 'Failed to import LinkedIn PDF');
        }
    };

    return (
        <div className="flex h-screen w-full bg-gray-50">
            {/* Toast Notifications */}
            <Toast />

            {/* Add Section Modal */}
            <AddSectionModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

            {/* History Panel */}
            <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} />

            {/* LEFT PANEL: EDITOR */}
            <div className="w-1/2 h-full flex flex-col border-r border-gray-200 bg-white">
                <header className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-white border border-gray-200 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition text-gray-600 shadow-sm"
                            title="Back to Dashboard"
                        >
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>

                        <div className="h-6 w-px bg-gray-200"></div>

                        <select
                            className="bg-transparent text-sm font-medium text-gray-700 border-none outline-none cursor-pointer hover:text-gray-900"
                            value={resume.meta?.templateId || 'standard'}
                            onChange={(e) => updateTemplate(e.target.value)}
                        >
                            <option value="standard">Standard Template</option>
                            <option value="modern">Modern Template</option>
                            <option value="minimalist">Minimalist Template</option>
                            <option value="professional">Professional Template</option>
                            <option value="executive">Executive Template</option>
                            <option value="creative">Creative Template</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowHistory(true)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="Version History"
                        >
                            <Clock className="w-5 h-5" />
                        </button>

                        <label className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer" title="Import LinkedIn PDF">
                            <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLinkedInImport(file);
                                }}
                            />
                            {/* Re-using Upload Cloud Icon-like appearance or standard icon */}
                            <span className="font-semibold text-xs border border-current px-1 rounded">IN</span>
                        </label>

                        <button
                            onClick={() => saveToBackend()}
                            disabled={isSaving}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2 ${backendId
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* ANALYSIS PANEL (Top of editor) */}
                            <AnalysisPanel />

                            {/* Personal Info Section */}
                            <PersonalInfoForm />

                            <hr className="border-gray-200" />

                            {/* Sections Header */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-700">Sections</h2>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Section
                                </button>
                            </div>

                            {/* Draggable Sections */}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={resume.sections.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {resume.sections.map((section) => (
                                            <SortableSection key={section.id} id={section.id}>
                                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                    {/* Section Header */}
                                                    <div
                                                        className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                                                        onClick={() => setExpandedSectionId(
                                                            expandedSectionId === section.id ? null : section.id
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-800">{section.title}</span>
                                                            <span className="text-xs text-gray-400 uppercase tracking-wide bg-gray-200 px-2 py-0.5 rounded">
                                                                {section.type}
                                                            </span>
                                                            {!section.isVisible && (
                                                                <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                                                                    Hidden
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleSectionVisibility(section.id);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition"
                                                                title={section.isVisible ? 'Hide section' : 'Show section'}
                                                            >
                                                                {section.isVisible ? (
                                                                    <Eye className="w-4 h-4" />
                                                                ) : (
                                                                    <EyeOff className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteSection(section.id);
                                                                    showNotification('success', `Deleted "${section.title}" section`);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                                                title="Delete section"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            {expandedSectionId === section.id ? (
                                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Section Content (Expanded) */}
                                                    {expandedSectionId === section.id && (
                                                        <div className="p-4 border-t border-gray-100">
                                                            <SectionItemEditor section={section} />
                                                        </div>
                                                    )}
                                                </div>
                                            </SortableSection>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            {resume.sections.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <p>No sections yet. Click "Add Section" to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT PANEL: PREVIEW */}
            <div className="w-1/2 h-full bg-gray-800 flex flex-col">
                <div className="p-4 bg-gray-800 text-white flex justify-between items-center border-b border-gray-700">
                    <span className="font-medium text-gray-300">Live Preview</span>
                </div>
                <div className="flex-1 p-8 overflow-hidden relative">
                    <PDFPreview
                        url={instance.url}
                        loading={instance.loading}
                        error={instance.error ? new Error(instance.error.toString()) : null}
                    />
                </div>
            </div>
        </div>
    );
};

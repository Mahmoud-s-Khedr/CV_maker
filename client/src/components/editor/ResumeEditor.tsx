import React, { useEffect, useMemo, useState } from 'react';
import { useResumeStore } from '../../store/resume';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { getRoleHomePath } from '../../lib/roleHome';
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

import { Plus, Eye, EyeOff, Trash2, ChevronDown, ChevronUp, Clock, Share2, Globe, Copy, Check, Loader2, Palette, Download, FileJson, FileText, MessageSquare, Briefcase } from 'lucide-react';
import { SortableSection } from './SortableSection';
import { ResumeDocument } from '../pdf/ResumeDocument';
import { useDebounce } from '../../hooks/useDebounce';
import { AnalysisPanel } from './AnalysisPanel';
import { CompletenessScore } from './CompletenessScore';
import { HistoryPanel } from './HistoryPanel';
import { ReviewPanel } from './ReviewPanel';
import { TemplatePicker } from './TemplatePicker';
import { PDFPreview } from './PDFPreview';
import { makeResumePdfFilename } from '../../lib/filename';
import { exportAsJSON, exportAsPlainText } from '../../lib/export';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import { SectionItemEditor } from './SectionItemEditor';
import { AddSectionModal } from './AddSectionModal';
import { Toast } from '../ui/Toast';
import { ErrorBoundary } from '../ErrorBoundary';
import { JobFormModal } from '../jobs/JobFormModal';
import 'react-pdf/dist/Page/AnnotationLayer.css';
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
        resetResume,
        dynamicTemplateConfig,
        isPublic,
        shareKey,
        viewCount,
        togglePublic
    } = useResumeStore();

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
    const [availableTemplates, setAvailableTemplates] = useState<{ id: string, name: string, isPremium?: boolean }[]>([]);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showReviewPanel, setShowReviewPanel] = useState(false);
    const [showJobForm, setShowJobForm] = useState(false);
    const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
    const [justSaved, setJustSaved] = useState(false);
    const prevIsSaving = React.useRef(false);

    // Show "Saved" confirmation for 3s after isSaving transitions true → false
    React.useEffect(() => {
        if (prevIsSaving.current && !isSaving && backendId) {
            setJustSaved(true);
            const timer = setTimeout(() => setJustSaved(false), 3000);
            return () => clearTimeout(timer);
        }
        prevIsSaving.current = isSaving;
    }, [isSaving, backendId]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const { getTemplates } = await import('../../lib/api');
                const templates = await getTemplates();
                setAvailableTemplates(templates);
            } catch (err) {
                console.error("Failed to fetch templates", err);
            }
        };
        fetchTemplates();
    }, []);

    // Performance: Debounce the resume data passed to the heavy PDF renderer
    const debouncedResume = useDebounce(resume, 500);

    const downloadFileName = useMemo(
        () => makeResumePdfFilename(resume.profile?.fullName, resume.profile?.jobTitle),
        [resume.profile?.fullName, resume.profile?.jobTitle]
    );

    // Stable reference for the PDF document
    // Stable reference for the PDF document
    const pdfDocument = useMemo(() => (
        <ResumeDocument
            data={debouncedResume}
            dynamicConfig={dynamicTemplateConfig}
        />
    ), [debouncedResume, dynamicTemplateConfig]);

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
            const anyErr = err as any;
            const message = anyErr?.response?.data?.error || 'Failed to import LinkedIn PDF';
            showNotification('error', message);
        }
    };

    return (
        <div className="flex h-full min-h-0 w-full bg-gray-50 flex-col lg:flex-row">
            {/* Toast Notifications */}
            <Toast />

            {/* Add Section Modal */}
            <AddSectionModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

            {/* History Panel */}
            <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} />

            {/* Review Panel */}
            <ReviewPanel isOpen={showReviewPanel} onClose={() => setShowReviewPanel(false)} />

            {/* Job Application Form */}
            <JobFormModal
                isOpen={showJobForm}
                onClose={() => setShowJobForm(false)}
                onSubmit={async (data) => {
                    const { createJobApplication } = await import('../../lib/api');
                    await createJobApplication(data);
                }}
                prefilledResumeId={backendId || undefined}
            />

            {/* Template Picker Panel */}
            <TemplatePicker
                isOpen={showTemplatePicker}
                onClose={() => setShowTemplatePicker(false)}
                currentTemplateId={resume.meta?.templateId || 'standard'}
                customTemplates={availableTemplates}
                isPremiumUser={user?.isPremium === true}
                onSelectTemplate={(id) => {
                    updateTemplate(id);
                    setShowTemplatePicker(false);
                }}
            />

            {/* Mobile view toggle */}
            <div className="lg:hidden px-4 pt-4">
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setMobileView('edit')}
                        className={[
                            'px-3 py-1.5 rounded-md text-sm font-medium transition',
                            mobileView === 'edit' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100',
                        ].join(' ')}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileView('preview')}
                        className={[
                            'px-3 py-1.5 rounded-md text-sm font-medium transition',
                            mobileView === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100',
                        ].join(' ')}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {/* LEFT PANEL: EDITOR */}
            <div
                className={[
                    'w-full lg:w-1/2 h-full min-h-0 flex flex-col border-gray-200 bg-white',
                    'lg:border-r',
                    mobileView === 'edit' ? 'flex' : 'hidden',
                    'lg:flex',
                ].join(' ')}
            >
                <header className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white z-10 shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <button
                            onClick={() => navigate(getRoleHomePath(user?.role))}
                            className="bg-white border border-gray-200 p-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition text-gray-600 shadow-sm"
                            title="Back to Dashboard"
                        >
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>

                        <div className="h-6 w-px bg-gray-200"></div>

                        <button
                            onClick={() => setShowTemplatePicker(true)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                            title="Choose Template"
                        >
                            <Palette className="w-4 h-4" />
                            <span className="truncate max-w-[160px] sm:max-w-none">Templates</span>
                        </button>
                    </div>



                    <div className="flex items-center gap-2 sm:gap-3 relative flex-wrap justify-end">
                        {/* Share Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className={`p-2 rounded-lg transition ${isPublic ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                title="Share Resume"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>

                            {showShareMenu && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-4 z-50">
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Share to Web
                                    </h3>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm text-gray-600">Public Access</span>
                                        <button
                                            onClick={() => togglePublic(!isPublic)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {isPublic && shareKey && (
                                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                            <p className="text-xs text-gray-500 mb-1">Public Link</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    readOnly
                                                    value={`${window.location.origin}/cv/${shareKey}`}
                                                    className="text-xs w-full bg-transparent outline-none text-gray-700"
                                                />
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/cv/${shareKey}`);
                                                        showNotification('success', 'Link copied!');
                                                    }}
                                                    className="p-1 hover:bg-gray-200 rounded"
                                                >
                                                    <Copy className="w-3 h-3 text-gray-500" />
                                                </button>
                                            </div>
                                            <a
                                                href={`/cv/${shareKey}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block mt-2 text-center text-xs text-blue-600 hover:underline"
                                            >
                                                Open Link
                                            </a>
                                            {viewCount > 0 && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                    <Eye className="w-3 h-3" />
                                                    <span>{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowHistory(true)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="Version History"
                        >
                            <Clock className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setShowReviewPanel(true)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="Get Feedback"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>

                        {backendId && (
                            <button
                                onClick={() => setShowJobForm(true)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                title="Apply with this resume"
                            >
                                <Briefcase className="w-5 h-5" />
                            </button>
                        )}

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
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2 ${
                                isSaving
                                    ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                                    : justSaved
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : backendId
                                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                            ) : justSaved ? (
                                <><Check className="w-4 h-4" /> Saved</>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 min-h-0 overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Profile Completeness Score */}
                            <CompletenessScore />

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
            <div
                className={[
                    'w-full lg:w-1/2 h-full min-h-0 bg-gray-800 flex flex-col',
                    mobileView === 'preview' ? 'flex' : 'hidden',
                    'lg:flex',
                ].join(' ')}
            >
                <div className="p-4 bg-gray-800 text-white flex justify-between items-center border-b border-gray-700">
                    <span className="font-medium text-gray-300">Live Preview</span>
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        {showExportMenu && (
                            <div className="absolute top-full right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                                {instance.url && (
                                    <a
                                        href={instance.url}
                                        download={downloadFileName}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setShowExportMenu(false)}
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        PDF
                                    </a>
                                )}
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                    onClick={() => {
                                        exportAsJSON(resume, downloadFileName.replace('.pdf', '.json'));
                                        setShowExportMenu(false);
                                    }}
                                >
                                    <FileJson className="w-3.5 h-3.5" />
                                    JSON
                                </button>
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                    onClick={() => {
                                        exportAsPlainText(resume, downloadFileName.replace('.pdf', '.txt'));
                                        setShowExportMenu(false);
                                    }}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Plain Text
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-hidden relative">
                    <ErrorBoundary>
                        <PDFPreview
                            url={instance.url}
                            loading={instance.loading}
                            error={instance.error ? new Error(instance.error.toString()) : null}
                            downloadFileName={downloadFileName}
                        />
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
};

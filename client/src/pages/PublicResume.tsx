import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import * as api from '../lib/api';
import { usePDF } from '@react-pdf/renderer';
import { ResumeDocument } from '../components/pdf/ResumeDocument';
import { PDFPreview } from '../components/editor/PDFPreview';
import { isBuiltInTemplateId } from '../components/pdf/builtInTemplates';
import { makeResumePdfFilename } from '../lib/filename';
import type { ResumeSchema } from '../types/resume';
import type { TemplateConfig } from '../types/template';

export const PublicResume: React.FC = () => {
    const { shareKey } = useParams<{ shareKey: string }>();
    const [resumeData, setResumeData] = useState<ResumeSchema | null>(null);
    const [dynamicConfig, setDynamicConfig] = useState<TemplateConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const EMPTY_RESUME: ResumeSchema = useMemo(
        () => ({
            meta: {
                templateId: 'standard',
                themeConfig: {
                    primaryColor: '#2563eb',
                    fontFamily: 'Helvetica',
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
            sections: [],
        }),
        []
    );

    const pdfDocument = useMemo(() => {
        if (!resumeData) return null;
        return <ResumeDocument data={resumeData} dynamicConfig={dynamicConfig} />;
    }, [resumeData, dynamicConfig]);

    const downloadFileName = useMemo(
        () => makeResumePdfFilename(resumeData?.profile?.fullName, resumeData?.profile?.jobTitle),
        [resumeData?.profile?.fullName, resumeData?.profile?.jobTitle]
    );

    const effectivePdfDocument = useMemo(() => {
        return pdfDocument ?? <ResumeDocument data={EMPTY_RESUME} dynamicConfig={null} />;
    }, [pdfDocument, EMPTY_RESUME]);

    // NOTE: usePDF requires a valid @react-pdf/renderer <Document> tree.
    // Passing a Fragment can crash with "container.document is null".
    const [instance, updateInstance] = usePDF({
        document: effectivePdfDocument,
    });

    // Keep PDF in sync with async-loaded resume/template, like the editor preview.
    useEffect(() => {
        updateInstance(effectivePdfDocument);
    }, [effectivePdfDocument, updateInstance]);

    useEffect(() => {
        const fetchResume = async () => {
            try {
                if (!shareKey) return;

                setLoading(true);
                setError(null);
                setResumeData(null);
                setDynamicConfig(null);

                const data = await api.getPublicResume(shareKey);

                // Prisma usually returns JSON object directly for Json type, but be defensive.
                const content = (typeof data.content === 'string'
                    ? (JSON.parse(data.content) as ResumeSchema)
                    : (data.content as ResumeSchema));

                setResumeData(content);

                // Fetch template config if dynamic
                if (content.meta?.templateId) {
                    try {
                        if (!isBuiltInTemplateId(content.meta.templateId)) {
                            const template = await api.getTemplate(content.meta.templateId);
                            setDynamicConfig(template.config);
                        } else {
                            // Ensure stale dynamic config can't override a standard template.
                            setDynamicConfig(null);
                        }
                    } catch (e) {
                        console.error("Failed to load template for public resume", e);
                        setDynamicConfig(null);
                    }
                }

            } catch (err: unknown) {
                console.error(err);
                setError(
                    axios.isAxiosError(err)
                        ? err.response?.data?.error || 'Resume not found or private'
                        : 'Resume not found or private'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchResume();
    }, [shareKey]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">Loading resume…</div>
                    <div className="text-sm text-gray-500 mt-1">Preparing preview</div>
                </div>
            </div>
        );
    }

    if (error || !resumeData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Resume unavailable</h1>
                    <p className="text-gray-600 mb-4">{error || 'Resume not found or is private.'}</p>
                    <Link to="/" className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
                        Create your own CV
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-lg font-bold text-gray-900 truncate">
                            {resumeData.profile?.fullName || 'Resume'}
                        </div>
                        {resumeData.profile?.jobTitle && (
                            <div className="text-sm text-gray-600 truncate">{resumeData.profile.jobTitle}</div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <a
                            href={`/p/${shareKey}`}
                            className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 border border-emerald-200"
                        >
                            View website
                        </a>
                        <Link
                            to="/"
                            className="px-3 py-2 rounded-lg text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                        >
                            Create your own CV
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-200">Resume preview</span>
                        <span className="text-xs text-gray-400">{shareKey ? `Share key: ${shareKey}` : ''}</span>
                    </div>
                    <div className="h-[calc(100vh-9rem)] min-h-[520px] p-4 sm:p-6">
                        <PDFPreview
                            url={instance.url}
                            loading={instance.loading}
                            error={instance.error ? new Error(String(instance.error)) : null}
                            downloadFileName={downloadFileName}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

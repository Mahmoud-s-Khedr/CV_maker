import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ResumeCard } from '../components/ResumeCard';
import { useResumeStore } from '../store/resume';
import { useAuthStore } from '../store/auth';
import * as api from '../lib/api';
import type { Resume } from '../types/resume';
import { Toast } from '../components/ui/Toast';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useResumeStore();
    const { user } = useAuthStore();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const userId = useMemo(() => user?.id ?? null, [user?.id]);

    // Fetch Resumes
    const fetchResumes = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const data = await api.getUserResumes(userId);
            setResumes(data);
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to load resumes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchResumes();
        }
    }, [userId]);

    const handleCreateNew = () => {
        // Reset store state for new resume
        // We might want to clear the store here or rely on ResumeEditor to clear it if no ID is passed.
        // For now, let's manually reset key parts or trust the user wants a fresh start.
        // A better approach is to have a clearResume() action in the store.
        // But navigating to /editor (no ID) implies new.

        // Let's quickly reset the store to defaults to be safe
        // Actually, we can just navigate. The Editor *should* initialize efficiently.
        // But if the store persists in memory, we need to clear it.
        // I will navigate to /editor and rely on mounting logic there (which I will add next)
        navigate('/editor');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resume?')) return;

        try {
            await api.deleteResume(id);
            setResumes(resumes.filter(r => r.id !== id));
            showNotification('success', 'Resume deleted');
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to delete resume');
        }
    };

    const handleDuplicate = async (resume: Resume) => {
        if (!userId) return;
        try {
            // Create a copy locally and save it
            // Or better, fetch full content if we don't have it (we have it in 'resume.content')
            const copyContent = { ...resume.content };
            copyContent.profile.fullName = `${copyContent.profile.fullName} (Copy)`;

            // We use the api.saveResume which expects the ResumeSchema
            // Ideally we should have a duplicate endpoint, but client-side duplication works for now
            await api.saveResume(userId, copyContent);
            showNotification('success', 'Resume duplicated');
            fetchResumes(); // Reload list
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to duplicate resume');
        }
    };

    if (!userId) return null;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Toast />
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
                        <p className="text-gray-500 mt-1">Manage and organize your CVs</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Resume
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No resumes yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Create your first professional resume in minutes with our AI-powered builder.
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="text-blue-600 font-medium hover:text-blue-800"
                        >
                            Create your first resume &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {resumes.map((resume) => (
                            <ResumeCard
                                key={resume.id}
                                resume={resume}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

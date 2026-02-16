import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ResumeCard } from '../components/ResumeCard';
import { useResumeStore } from '../store/resume';
import { useAuthStore } from '../store/auth';
import * as api from '../lib/api';
import type { Resume } from '../types/resume';
import { Toast } from '../components/ui/Toast';

const ResumeCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
        <div className="h-40 bg-gray-100" />
        <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="flex gap-2 pt-2">
                <div className="h-8 bg-gray-100 rounded flex-1" />
                <div className="h-8 bg-gray-100 rounded flex-1" />
            </div>
        </div>
    </div>
);

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { showNotification } = useResumeStore();
    const { user } = useAuthStore();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const userId = useMemo(() => user?.id ?? null, [user?.id]);

    const fetchResumes = async () => {
        setIsLoading(true);
        try {
            const data = await api.getUserResumes();
            setResumes(data);
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to load resumes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    const handleCreateNew = () => {
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
        try {
            const copyContent = { ...resume.content };
            copyContent.profile.fullName = `${copyContent.profile.fullName} (Copy)`;

            await api.saveResume(copyContent);
            showNotification('success', 'Resume duplicated');
            fetchResumes();
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Resumes</h1>
                        <p className="text-gray-500 mt-1">Manage and organize your CVs</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium sm:w-auto w-full"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Resume
                    </button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(3)].map((_, i) => <ResumeCardSkeleton key={i} />)}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

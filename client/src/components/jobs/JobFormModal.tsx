import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import type { JobApplication, ApplicationStatus, CreateJobInput } from '../../types/job';
import * as api from '../../lib/api';

type ResumeOption = { id: string; title: string };

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateJobInput) => Promise<void>;
    initialData?: JobApplication | null;
    prefilledResumeId?: string;
}

const STATUSES: ApplicationStatus[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

export const JobFormModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData, prefilledResumeId }) => {
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateJobInput>();
    const [resumes, setResumes] = useState<ResumeOption[]>([]);
    const [error, setError] = useState('');
    const [resumesError, setResumesError] = useState('');
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const loadResumes = async () => {
            setIsLoadingResumes(true);
            setResumesError('');

            try {
                const data = await api.getUserResumes() as ResumeOption[];
                setResumes(data.map((resume) => ({ id: resume.id, title: resume.title })));
            } catch (err) {
                console.error('Failed to load resumes for job form', err);
                setResumes([]);
                setResumesError('Could not load resumes. You can still save without attaching one.');
            } finally {
                setIsLoadingResumes(false);
            }
        };

        void loadResumes();

        if (initialData) {
            reset({
                jobTitle: initialData.jobTitle,
                company: initialData.company,
                url: initialData.url || '',
                resumeId: initialData.resumeId || '',
                notes: initialData.notes || '',
                salary: initialData.salary || '',
                status: initialData.status,
            });
            return;
        }

        reset({
            jobTitle: '',
            company: '',
            url: '',
            resumeId: prefilledResumeId || '',
            notes: '',
            salary: '',
            status: 'SAVED',
        });
    }, [isOpen, initialData, prefilledResumeId, reset]);

    const handleFormSubmit = async (data: CreateJobInput) => {
        setError('');
        try {
            await onSubmit({
                ...data,
                resumeId: data.resumeId?.trim() ? data.resumeId : null,
            });
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save';
            setError(message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {initialData ? 'Edit Application' : 'Add Job Application'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {error && <div className="mx-6 mt-4 p-3 text-sm text-red-800 bg-red-50 rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Job Title *</label>
                            <input
                                {...register('jobTitle', { required: true })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                placeholder="Software Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Company *</label>
                            <input
                                {...register('company', { required: true })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                placeholder="Acme Inc."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Job URL</label>
                        <input
                            {...register('url')}
                            type="url"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                            <select
                                {...register('status')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                            >
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Salary</label>
                            <input
                                {...register('salary')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                placeholder="$80k - $100k"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Resume</label>
                        <select
                            {...register('resumeId')}
                            disabled={isLoadingResumes}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        >
                            <option value="">None</option>
                            {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                        {isLoadingResumes && <p className="mt-1 text-xs text-gray-500">Loading resumes...</p>}
                        {resumesError && <p className="mt-1 text-xs text-amber-700">{resumesError}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                            placeholder="Any notes about this application..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Add Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

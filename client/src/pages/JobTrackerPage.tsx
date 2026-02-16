import React, { useEffect, useState } from 'react';
import { Plus, LayoutGrid, List, Briefcase } from 'lucide-react';
import { useJobStore } from '../store/job';
import { JobTableView } from '../components/jobs/JobTableView';
import { JobKanbanView } from '../components/jobs/JobKanbanView';
import { JobFormModal } from '../components/jobs/JobFormModal';
import type { JobApplication, ApplicationStatus, CreateJobInput } from '../types/job';

const STATUS_TABS: { value: ApplicationStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'SAVED', label: 'Saved' },
    { value: 'APPLIED', label: 'Applied' },
    { value: 'INTERVIEW', label: 'Interview' },
    { value: 'OFFER', label: 'Offer' },
    { value: 'REJECTED', label: 'Rejected' },
];

export const JobTrackerPage: React.FC = () => {
    const {
        applications,
        stats,
        isLoading,
        filter,
        fetchApplications,
        fetchStats,
        createApplication,
        updateApplication,
        deleteApplication,
        setFilter,
    } = useJobStore();

    const [view, setView] = useState<'table' | 'kanban'>('table');
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState<JobApplication | null>(null);

    useEffect(() => {
        fetchApplications();
        fetchStats();
    }, [fetchApplications, fetchStats]);

    const handleSubmit = async (data: CreateJobInput) => {
        if (editingJob) {
            await updateApplication(editingJob.id, data);
        } else {
            await createApplication(data);
        }
        fetchStats();
    };

    const handleEdit = (job: JobApplication) => {
        setEditingJob(job);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        await deleteApplication(id);
        fetchStats();
    };

    const handleStatusChange = async (id: string, status: ApplicationStatus) => {
        await updateApplication(id, { status });
        fetchStats();
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingJob(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                        Job Tracker
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track your job applications in one place.</p>
                </div>
                <button
                    onClick={() => { setEditingJob(null); setShowForm(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Application
                </button>
            </div>

            {/* Stats Summary */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                    </div>
                    {(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'] as ApplicationStatus[]).map((s) => {
                        const colors: Record<ApplicationStatus, string> = {
                            SAVED: 'text-gray-600',
                            APPLIED: 'text-blue-600',
                            INTERVIEW: 'text-yellow-600',
                            OFFER: 'text-green-600',
                            REJECTED: 'text-red-600',
                        };
                        return (
                            <div key={s} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                                <p className={`text-2xl font-bold ${colors[s]}`}>{stats.byStatus[s] || 0}</p>
                                <p className="text-xs text-gray-500">{s.charAt(0) + s.slice(1).toLowerCase()}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filter Tabs + View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-1 overflow-x-auto">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                                filter === tab.value
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                    <button
                        onClick={() => setView('table')}
                        className={`p-1.5 rounded-md transition ${view === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Table View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setView('kanban')}
                        className={`p-1.5 rounded-md transition ${view === 'kanban' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Kanban View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white border border-gray-200 rounded-lg">
                {isLoading ? (
                    <div className="text-center py-16 text-gray-400">
                        <p>Loading applications...</p>
                    </div>
                ) : view === 'table' ? (
                    <JobTableView
                        applications={applications}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ) : (
                    <div className="p-4">
                        <JobKanbanView
                            applications={applications}
                            onEdit={handleEdit}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <JobFormModal
                isOpen={showForm}
                onClose={handleCloseForm}
                onSubmit={handleSubmit}
                initialData={editingJob}
            />
        </div>
    );
};

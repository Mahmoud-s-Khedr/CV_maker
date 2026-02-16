import React from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { JobApplication } from '../../types/job';
import { formatDistanceToNow } from 'date-fns';

interface Props {
    applications: JobApplication[];
    onEdit: (job: JobApplication) => void;
    onDelete: (id: string) => void;
}

export const JobTableView: React.FC<Props> = ({ applications, onEdit, onDelete }) => {
    if (applications.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <p className="text-lg">No applications yet</p>
                <p className="text-sm mt-1">Click "Add Application" to start tracking your job search.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 text-left">
                        <th className="py-3 px-4 font-medium text-gray-500">Company</th>
                        <th className="py-3 px-4 font-medium text-gray-500">Job Title</th>
                        <th className="py-3 px-4 font-medium text-gray-500">Status</th>
                        <th className="py-3 px-4 font-medium text-gray-500">Resume</th>
                        <th className="py-3 px-4 font-medium text-gray-500">Updated</th>
                        <th className="py-3 px-4 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {applications.map((job) => (
                        <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{job.company}</span>
                                    {job.url && (
                                        <a href={job.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                                {job.salary && <p className="text-xs text-gray-400 mt-0.5">{job.salary}</p>}
                            </td>
                            <td className="py-3 px-4 text-gray-700">{job.jobTitle}</td>
                            <td className="py-3 px-4"><StatusBadge status={job.status} /></td>
                            <td className="py-3 px-4 text-gray-500">{job.resume?.title || '—'}</td>
                            <td className="py-3 px-4 text-gray-400 text-xs">
                                {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
                            </td>
                            <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onEdit(job)}
                                        className="p-1.5 hover:bg-gray-100 rounded transition"
                                        title="Edit"
                                    >
                                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(job.id)}
                                        className="p-1.5 hover:bg-red-50 rounded transition"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

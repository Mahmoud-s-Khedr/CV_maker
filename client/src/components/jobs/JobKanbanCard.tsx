import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink } from 'lucide-react';
import type { JobApplication } from '../../types/job';
import { formatDistanceToNow } from 'date-fns';

export const JobKanbanCard: React.FC<{ job: JobApplication; onClick: () => void }> = ({ job, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: job.id,
        data: { job },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition"
        >
            <p className="font-medium text-sm text-gray-900 truncate">{job.company}</p>
            <p className="text-xs text-gray-500 truncate">{job.jobTitle}</p>
            {job.resume && (
                <p className="text-xs text-blue-500 mt-1 truncate">{job.resume.title}</p>
            )}
            <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
                </span>
                {job.url && (
                    <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-blue-600"
                    >
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </div>
    );
};

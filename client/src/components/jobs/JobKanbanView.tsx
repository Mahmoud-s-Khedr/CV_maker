import React from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { JobKanbanCard } from './JobKanbanCard';
import type { JobApplication, ApplicationStatus } from '../../types/job';

const COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
    { status: 'SAVED', label: 'Saved', color: 'border-gray-300' },
    { status: 'APPLIED', label: 'Applied', color: 'border-blue-400' },
    { status: 'INTERVIEW', label: 'Interview', color: 'border-yellow-400' },
    { status: 'OFFER', label: 'Offer', color: 'border-green-400' },
    { status: 'REJECTED', label: 'Rejected', color: 'border-red-400' },
];

const KanbanColumn: React.FC<{
    status: ApplicationStatus;
    label: string;
    color: string;
    jobs: JobApplication[];
    onEdit: (job: JobApplication) => void;
}> = ({ status, label, color, jobs, onEdit }) => {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 min-w-[200px] max-w-[260px] flex flex-col ${isOver ? 'bg-blue-50/50' : ''} rounded-lg transition`}
        >
            <div className={`border-t-2 ${color} rounded-t-lg px-3 py-2 bg-gray-50`}>
                <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                <span className="text-xs text-gray-400">{jobs.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 min-h-[100px]">
                <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
                    {jobs.map((job) => (
                        <JobKanbanCard key={job.id} job={job} onClick={() => onEdit(job)} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

interface Props {
    applications: JobApplication[];
    onEdit: (job: JobApplication) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export const JobKanbanView: React.FC<Props> = ({ applications, onEdit, onStatusChange }) => {
    const [activeJob, setActiveJob] = React.useState<JobApplication | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const getColumnJobs = (status: ApplicationStatus) =>
        applications.filter((j) => j.status === status);

    const handleDragStart = (event: DragStartEvent) => {
        const job = applications.find((j) => j.id === event.active.id);
        if (job) setActiveJob(job);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveJob(null);
        const { active, over } = event;
        if (!over) return;

        const jobId = active.id as string;
        const overStatus = over.id as ApplicationStatus;

        // Check if dropped on a column
        if (COLUMNS.some((c) => c.status === overStatus)) {
            const job = applications.find((j) => j.id === jobId);
            if (job && job.status !== overStatus) {
                onStatusChange(jobId, overStatus);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-3 overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.status}
                        {...col}
                        jobs={getColumnJobs(col.status)}
                        onEdit={onEdit}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeJob ? (
                    <div className="bg-white border border-blue-300 rounded-lg p-3 shadow-lg w-[240px] opacity-90">
                        <p className="font-medium text-sm text-gray-900">{activeJob.company}</p>
                        <p className="text-xs text-gray-500">{activeJob.jobTitle}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

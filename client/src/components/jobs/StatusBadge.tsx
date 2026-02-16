import React from 'react';
import type { ApplicationStatus } from '../../types/job';

const COLORS: Record<ApplicationStatus, string> = {
    SAVED: 'bg-gray-100 text-gray-700 border-gray-200',
    APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
    INTERVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    OFFER: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

export const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${COLORS[status]}`}>
        {status}
    </span>
);

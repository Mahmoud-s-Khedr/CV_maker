export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

export interface JobApplication {
    id: string;
    jobTitle: string;
    company: string;
    url?: string;
    resumeId?: string | null;
    resume?: { id: string; title: string } | null;
    status: ApplicationStatus;
    notes?: string;
    salary?: string;
    appliedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface JobStats {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
}

export interface CreateJobInput {
    jobTitle: string;
    company: string;
    url?: string;
    resumeId?: string | null;
    notes?: string;
    salary?: string;
    status?: ApplicationStatus;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
    appliedAt?: string;
}

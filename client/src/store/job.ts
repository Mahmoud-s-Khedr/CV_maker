import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { JobApplication, ApplicationStatus, JobStats, CreateJobInput } from '../types/job';
import * as api from '../lib/api';

interface JobState {
    applications: JobApplication[];
    stats: JobStats | null;
    isLoading: boolean;
    filter: ApplicationStatus | 'ALL';
    fetchApplications: () => Promise<void>;
    fetchStats: () => Promise<void>;
    createApplication: (data: CreateJobInput) => Promise<void>;
    updateApplication: (id: string, data: Partial<JobApplication>) => Promise<void>;
    deleteApplication: (id: string) => Promise<void>;
    setFilter: (filter: ApplicationStatus | 'ALL') => void;
}

export const useJobStore = create<JobState>()(
    immer((set, get) => ({
        applications: [],
        stats: null,
        isLoading: false,
        filter: 'ALL',

        fetchApplications: async () => {
            set((s) => { s.isLoading = true; });
            try {
                const filter = get().filter;
                const data = await api.getJobApplications(filter !== 'ALL' ? filter : undefined);
                set((s) => { s.applications = data; s.isLoading = false; });
            } catch {
                set((s) => { s.isLoading = false; });
            }
        },

        fetchStats: async () => {
            try {
                const data = await api.getJobStats();
                set((s) => { s.stats = data; });
            } catch {}
        },

        createApplication: async (data) => {
            const job = await api.createJobApplication(data);
            set((s) => { s.applications.unshift(job); });
        },

        updateApplication: async (id, data) => {
            const job = await api.updateJobApplication(id, data);
            set((s) => {
                const idx = s.applications.findIndex((a) => a.id === id);
                if (idx !== -1) s.applications[idx] = job;
            });
        },

        deleteApplication: async (id) => {
            await api.deleteJobApplication(id);
            set((s) => { s.applications = s.applications.filter((a) => a.id !== id); });
        },

        setFilter: (filter) => {
            set((s) => { s.filter = filter; });
            get().fetchApplications();
        },
    }))
);

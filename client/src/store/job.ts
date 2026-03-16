import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import axios from 'axios';
import type { JobApplication, ApplicationStatus, JobStats, CreateJobInput } from '../types/job';
import * as api from '../lib/api';

interface JobState {
    applications: JobApplication[];
    stats: JobStats | null;
    isLoading: boolean;
    listError: string | null;
    filter: ApplicationStatus | 'ALL';
    fetchApplications: (filter?: ApplicationStatus | 'ALL') => Promise<void>;
    fetchStats: () => Promise<void>;
    createApplication: (data: CreateJobInput) => Promise<void>;
    updateApplication: (id: string, data: Partial<JobApplication>) => Promise<void>;
    deleteApplication: (id: string) => Promise<void>;
    setFilter: (filter: ApplicationStatus | 'ALL') => void;
}

const getJobErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.error || 'Failed to load job applications.';
    }

    return 'Failed to load job applications.';
};

export const useJobStore = create<JobState>()(
    immer((set, get) => ({
        applications: [],
        stats: null,
        isLoading: false,
        listError: null,
        filter: 'ALL',

        fetchApplications: async (requestedFilter) => {
            const activeFilter = requestedFilter ?? get().filter;
            set((s) => {
                s.isLoading = true;
                s.listError = null;
            });
            try {
                const data = await api.getJobApplications(activeFilter !== 'ALL' ? activeFilter : undefined);
                set((s) => {
                    s.applications = data;
                    s.isLoading = false;
                });
            } catch (error) {
                set((s) => {
                    s.isLoading = false;
                    s.listError = getJobErrorMessage(error);
                });
            }
        },

        fetchStats: async () => {
            try {
                const data = await api.getJobStats();
                set((s) => { s.stats = data; });
            } catch {}
        },

        createApplication: async (data) => {
            await api.createJobApplication(data);
            await get().fetchApplications(get().filter);
        },

        updateApplication: async (id, data) => {
            await api.updateJobApplication(id, data);
            await get().fetchApplications(get().filter);
        },

        deleteApplication: async (id) => {
            await api.deleteJobApplication(id);
            await get().fetchApplications(get().filter);
        },

        setFilter: (filter) => {
            set((s) => { s.filter = filter; });
        },
    }))
);

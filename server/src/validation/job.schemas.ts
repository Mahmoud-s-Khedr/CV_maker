import { z } from 'zod';

export const createJobSchema = z.object({
    jobTitle: z.string().min(1).max(200),
    company: z.string().min(1).max(200),
    url: z.string().url().optional().or(z.literal('')),
    resumeId: z.string().optional(),
    notes: z.string().max(2000).optional(),
    salary: z.string().max(100).optional(),
    status: z.enum(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
});

export const updateJobSchema = z.object({
    jobTitle: z.string().min(1).max(200).optional(),
    company: z.string().min(1).max(200).optional(),
    url: z.string().url().optional().or(z.literal('')),
    resumeId: z.string().nullable().optional(),
    notes: z.string().max(2000).optional(),
    salary: z.string().max(100).optional(),
    status: z.enum(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
    appliedAt: z.string().datetime().optional(),
});

import { z } from 'zod';

const optionalUrlSchema = z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().url().optional()
);

const createResumeIdSchema = z.preprocess(
    (value) => value === '' || value == null ? undefined : value,
    z.string().min(1).optional()
);

const updateResumeIdSchema = z.preprocess(
    (value) => value === '' ? null : value,
    z.string().min(1).nullable().optional()
);

export const createJobSchema = z.object({
    jobTitle: z.string().min(1).max(200),
    company: z.string().min(1).max(200),
    url: optionalUrlSchema,
    resumeId: createResumeIdSchema,
    notes: z.string().max(2000).optional(),
    salary: z.string().max(100).optional(),
    status: z.enum(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
});

export const updateJobSchema = z.object({
    jobTitle: z.string().min(1).max(200).optional(),
    company: z.string().min(1).max(200).optional(),
    url: optionalUrlSchema,
    resumeId: updateResumeIdSchema,
    notes: z.string().max(2000).optional(),
    salary: z.string().max(100).optional(),
    status: z.enum(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
    appliedAt: z.string().datetime().optional(),
});

export const listJobQuerySchema = z.object({
    status: z.enum(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'ALL']).optional(),
});

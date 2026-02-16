import { z } from 'zod';

export const analyzeResumeSchema = z.object({
    content: z.record(z.string(), z.unknown()).refine(
        (val) => Object.keys(val).length > 0,
        { message: 'Resume content must not be empty' }
    ),
});

export const analyzeJobFitSchema = z.object({
    resume: z.record(z.string(), z.unknown()).refine(
        (val) => Object.keys(val).length > 0,
        { message: 'Resume content must not be empty' }
    ),
    jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
});

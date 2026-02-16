import { z } from 'zod';

export const createResumeSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.record(z.string(), z.unknown()),
});

export const updateResumeSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.record(z.string(), z.unknown()).optional(),
    isPublic: z.boolean().optional(),
    shareKey: z.string().optional(),
});

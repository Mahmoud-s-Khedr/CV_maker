import { z } from 'zod';

export const addCommentSchema = z.object({
    sectionId: z.string().min(1, 'Section ID is required'),
    text: z.string().min(1).max(1000, 'Comment must be under 1000 characters'),
    reviewerName: z.string().min(1).max(100, 'Name must be under 100 characters'),
});

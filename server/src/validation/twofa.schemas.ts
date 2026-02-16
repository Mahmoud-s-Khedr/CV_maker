import { z } from 'zod';

export const verifySetupSchema = z.object({
    code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
});

export const disableSchema = z.object({
    code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
});

export const validateSchema = z.object({
    tempToken: z.string().min(1, 'Temporary token is required'),
    code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
});

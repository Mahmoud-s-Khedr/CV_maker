import { z } from 'zod';

export const notificationPrefsSchema = z.object({
    resumeViewed: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    subscriptionReminder: z.boolean().optional(),
    accountActivity: z.boolean().optional(),
});

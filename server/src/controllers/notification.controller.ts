import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { logError } from '../utils/logger';
import { sendError } from '../utils/http';

// GET /api/notifications/preferences
export const getPreferences = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;

        let prefs = await prisma.notificationPreference.findUnique({
            where: { userId: user.userId },
        });

        // Create default preferences if none exist
        if (!prefs) {
            prefs = await prisma.notificationPreference.create({
                data: { userId: user.userId },
            });
        }

        res.json({
            resumeViewed: prefs.resumeViewed,
            weeklyDigest: prefs.weeklyDigest,
            subscriptionReminder: prefs.subscriptionReminder,
            accountActivity: prefs.accountActivity,
        });
    } catch (error) {
        logError(error as Error, { context: 'getNotificationPreferences' });
        sendError(res, 500, 'NOTIFICATION_PREFERENCES_FETCH_FAILED', 'Failed to fetch notification preferences');
    }
};

// PATCH /api/notifications/preferences
export const updatePreferences = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const { resumeViewed, weeklyDigest, subscriptionReminder, accountActivity } = req.body;

        const prefs = await prisma.notificationPreference.upsert({
            where: { userId: user.userId },
            create: {
                userId: user.userId,
                ...(resumeViewed !== undefined && { resumeViewed }),
                ...(weeklyDigest !== undefined && { weeklyDigest }),
                ...(subscriptionReminder !== undefined && { subscriptionReminder }),
                ...(accountActivity !== undefined && { accountActivity }),
            },
            update: {
                ...(resumeViewed !== undefined && { resumeViewed }),
                ...(weeklyDigest !== undefined && { weeklyDigest }),
                ...(subscriptionReminder !== undefined && { subscriptionReminder }),
                ...(accountActivity !== undefined && { accountActivity }),
            },
        });

        res.json({
            resumeViewed: prefs.resumeViewed,
            weeklyDigest: prefs.weeklyDigest,
            subscriptionReminder: prefs.subscriptionReminder,
            accountActivity: prefs.accountActivity,
        });
    } catch (error) {
        logError(error as Error, { context: 'updateNotificationPreferences' });
        sendError(res, 500, 'NOTIFICATION_PREFERENCES_UPDATE_FAILED', 'Failed to update notification preferences');
    }
};

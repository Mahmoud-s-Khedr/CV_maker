import { prisma } from '../lib/prisma';
import { startOfUtcDay } from '../utils/dates';
import {
    sendResumeViewedEmail,
    sendWeeklyDigestEmail,
    sendSubscriptionExpiryEmail,
    sendAccountActivityEmail,
} from './email.service';
import { logError, logInfo } from '../utils/logger';

/**
 * Notify resume owner when their resume is viewed.
 * Throttled: only sends at milestone view counts (1, 5, 10, 25, 50, 100, etc.)
 * or at most once per 24 hours per resume.
 */
export async function notifyResumeViewed(resumeId: string, viewCount: number): Promise<void> {
    try {
        const milestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
        if (!milestones.includes(viewCount)) return;

        const resume = await prisma.resume.findUnique({
            where: { id: resumeId },
            select: { title: true, userId: true },
        });
        if (!resume) return;

        const prefs = await prisma.notificationPreference.findUnique({
            where: { userId: resume.userId },
        });
        if (prefs && !prefs.resumeViewed) return;

        // Check if we already sent a notification in the last 24 hours
        const recentNotif = await prisma.notificationLog.findFirst({
            where: {
                userId: resume.userId,
                type: 'resume_viewed',
                sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
        });
        if (recentNotif) return;

        const user = await prisma.user.findUnique({
            where: { id: resume.userId },
            select: { email: true },
        });
        if (!user) return;

        await sendResumeViewedEmail(user.email, resume.title, viewCount);
        await prisma.notificationLog.create({
            data: { userId: resume.userId, type: 'resume_viewed' },
        });

        logInfo('Resume viewed notification sent', { userId: resume.userId, viewCount });
    } catch (error) {
        logError(error as Error, { context: 'notifyResumeViewed' });
    }
}

/**
 * Send weekly digest emails to all users who have opted in.
 * Called by cron scheduler every Monday.
 */
export async function sendWeeklyDigests(): Promise<void> {
    try {
        const today = startOfUtcDay(new Date());
        const oneWeekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

        // Find users who have public resumes with view activity in the last 7 UTC days.
        const users = await prisma.user.findMany({
            where: {
                resumes: {
                    some: {
                        isPublic: true,
                        dailyViewStats: {
                            some: {
                                day: { gte: oneWeekAgo },
                            },
                        },
                    },
                },
            },
            select: {
                id: true,
                email: true,
                notificationPreference: true,
                resumes: {
                    where: {
                        isPublic: true,
                    },
                    select: {
                        title: true,
                        dailyViewStats: {
                            where: {
                                day: { gte: oneWeekAgo },
                            },
                            select: {
                                viewCount: true,
                            },
                        },
                    },
                },
            },
        });

        const notificationLogs: Array<{ userId: string; type: string }> = [];
        let deliveredCount = 0;

        for (const user of users) {
            if (user.notificationPreference && !user.notificationPreference.weeklyDigest) continue;

            const resumeSummaries = user.resumes
                .map((resume) => ({
                    title: resume.title,
                    views: resume.dailyViewStats.reduce((sum, stat) => sum + stat.viewCount, 0),
                }))
                .filter((resume) => resume.views > 0);

            const totalViews = resumeSummaries.reduce((sum, resume) => sum + resume.views, 0);
            if (totalViews === 0) continue;

            await sendWeeklyDigestEmail(user.email, { totalViews, resumeSummaries });
            notificationLogs.push({ userId: user.id, type: 'weekly_digest' });
            deliveredCount += 1;
        }

        if (notificationLogs.length > 0) {
            await prisma.notificationLog.createMany({
                data: notificationLogs,
            });
        }

        logInfo('Weekly digests sent', { userCount: users.length, deliveredCount });
    } catch (error) {
        logError(error as Error, { context: 'sendWeeklyDigests' });
    }
}

/**
 * Send subscription expiry reminders (3 days before expiry).
 * Called by cron scheduler daily.
 */
export async function sendSubscriptionExpiryReminders(): Promise<void> {
    try {
        const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const now = new Date();

        const users = await prisma.user.findMany({
            where: {
                isPremium: true,
                premiumExpiresAt: {
                    gte: now,
                    lte: threeDaysFromNow,
                },
            },
            select: {
                id: true,
                email: true,
                premiumExpiresAt: true,
                notificationPreference: true,
            },
        });

        for (const user of users) {
            if (user.notificationPreference && !user.notificationPreference.subscriptionReminder) continue;

            // Check if we already sent this notification
            const alreadySent = await prisma.notificationLog.findFirst({
                where: {
                    userId: user.id,
                    type: 'subscription_expiry',
                    sentAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                },
            });
            if (alreadySent) continue;

            const daysRemaining = Math.ceil(
                (user.premiumExpiresAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
            );

            await sendSubscriptionExpiryEmail(user.email, daysRemaining);
            await prisma.notificationLog.create({
                data: { userId: user.id, type: 'subscription_expiry' },
            });
        }

        logInfo('Subscription expiry reminders sent', { userCount: users.length });
    } catch (error) {
        logError(error as Error, { context: 'sendSubscriptionExpiryReminders' });
    }
}

/**
 * Notify user of account activity (login, password reset, etc.).
 * Fire-and-forget — should not block the main request.
 */
export async function notifyAccountActivity(userId: string, activity: string): Promise<void> {
    try {
        const prefs = await prisma.notificationPreference.findUnique({
            where: { userId },
        });
        if (prefs && !prefs.accountActivity) return;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user) return;

        await sendAccountActivityEmail(user.email, activity, new Date());
        await prisma.notificationLog.create({
            data: { userId, type: 'account_activity' },
        });
    } catch (error) {
        logError(error as Error, { context: 'notifyAccountActivity' });
    }
}

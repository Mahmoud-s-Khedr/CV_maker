import cron from 'node-cron';
import { sendWeeklyDigests, sendSubscriptionExpiryReminders } from '../services/notification.service';
import { logInfo, logError } from '../utils/logger';

export function initScheduler() {
    // Weekly digest: every Monday at 9:00 AM UTC
    cron.schedule('0 9 * * 1', async () => {
        logInfo('Running weekly digest job');
        try {
            await sendWeeklyDigests();
        } catch (error) {
            logError(error as Error, { context: 'weekly-digest-cron' });
        }
    });

    // Subscription expiry check: daily at 10:00 AM UTC
    cron.schedule('0 10 * * *', async () => {
        logInfo('Running subscription expiry reminder job');
        try {
            await sendSubscriptionExpiryReminders();
        } catch (error) {
            logError(error as Error, { context: 'subscription-expiry-cron' });
        }
    });

    logInfo('Cron scheduler initialized');
}

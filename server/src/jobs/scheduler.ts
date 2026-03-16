import cron from 'node-cron';
import crypto from 'crypto';
import { sendWeeklyDigests, sendSubscriptionExpiryReminders } from '../services/notification.service';
import { purgeExpiredAuthArtifacts } from '../services/auth-maintenance.service';
import { prisma } from '../lib/prisma';
import { logInfo, logError } from '../utils/logger';

const getAdvisoryLockKey = (name: string): [number, number] => {
    const hash = crypto.createHash('sha256').update(name).digest();
    return [hash.readInt32BE(0), hash.readInt32BE(4)];
};

const runWithSchedulerLock = async (name: string, job: () => Promise<void>) => {
    const [key1, key2] = getAdvisoryLockKey(name);

    const lockResult = await prisma.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_try_advisory_lock(${key1}, ${key2}) AS locked
    `;
    const locked = lockResult[0]?.locked ?? false;

    if (!locked) {
        logInfo('Skipping scheduled job because another instance holds the lock', { job: name });
        return;
    }

    try {
        await job();
    } finally {
        await prisma.$queryRaw`SELECT pg_advisory_unlock(${key1}, ${key2})`;
    }
};

export function initScheduler() {
    // Weekly digest: every Monday at 9:00 AM UTC
    cron.schedule('0 9 * * 1', async () => {
        try {
            await runWithSchedulerLock('scheduler:weekly-digest', async () => {
                logInfo('Running weekly digest job');
                await sendWeeklyDigests();
            });
        } catch (error) {
            logError(error as Error, { context: 'weekly-digest-cron' });
        }
    }, { timezone: 'UTC' });

    // Subscription expiry check: daily at 10:00 AM UTC
    cron.schedule('0 10 * * *', async () => {
        try {
            await runWithSchedulerLock('scheduler:subscription-expiry', async () => {
                logInfo('Running subscription expiry reminder job');
                await sendSubscriptionExpiryReminders();
            });
        } catch (error) {
            logError(error as Error, { context: 'subscription-expiry-cron' });
        }
    }, { timezone: 'UTC' });

    // Expired auth artifact cleanup: daily at 11:00 AM UTC
    cron.schedule('0 11 * * *', async () => {
        try {
            await runWithSchedulerLock('scheduler:auth-artifact-cleanup', async () => {
                logInfo('Running expired auth artifact cleanup job');
                const result = await purgeExpiredAuthArtifacts();
                logInfo('Expired auth artifact cleanup finished', result);
            });
        } catch (error) {
            logError(error as Error, { context: 'auth-artifact-cleanup-cron' });
        }
    }, { timezone: 'UTC' });

    logInfo('Cron scheduler initialized');
}

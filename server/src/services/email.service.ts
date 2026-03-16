import { Resend } from 'resend';
import config from '../config/config';
import { logError, logInfo } from '../utils/logger';

const resend = config.email.resendApiKey
    ? new Resend(config.email.resendApiKey)
    : null;

interface SendEmailResult {
    success: boolean;
    error?: string;
}

const escapeHtml = (value: string): string => {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

export const sendVerificationEmail = async (
    email: string,
    token: string
): Promise<SendEmailResult> => {
    const verificationUrl = `${config.email.appUrl}/verify-email?token=${token}`;

    // Development fallback: log to console
    if (!resend) {
        logInfo('Verification email delivery skipped because Resend is not configured', {
            email,
            verificationUrl,
        });
        return { success: true };
    }

    try {
        const { error } = await resend.emails.send({
            from: 'HandisCV <onboarding@resend.dev>',
            to: email,
            subject: 'Verify your email for HandisCV',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Welcome to HandisCV!</h1>
                    <p>Please verify your email address by clicking the button below:</p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background-color: #2563eb; color: white; 
                              padding: 12px 24px; text-decoration: none; border-radius: 8px; 
                              margin: 16px 0;">
                        Verify Email
                    </a>
                    <p style="color: #666; font-size: 14px;">
                        Or copy this link: ${verificationUrl}
                    </p>
                    <p style="color: #999; font-size: 12px;">
                        This link expires in 24 hours.
                    </p>
                </div>
            `,
        });

        if (error) {
            logError(new Error(error.message), { context: 'sendVerificationEmail.resend' });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        logError(err as Error, { context: 'sendVerificationEmail' });
        return { success: false, error: 'Failed to send email' };
    }
};

export const sendPasswordResetEmail = async (
    email: string,
    token: string
): Promise<SendEmailResult> => {
    const resetUrl = `${config.email.appUrl}/reset-password?token=${token}`;

    // Development fallback
    if (!resend) {
        logInfo('Password reset email delivery skipped because Resend is not configured', {
            email,
            resetUrl,
        });
        return { success: true };
    }

    try {
        const { error } = await resend.emails.send({
            from: config.email.fromEmail,
            to: email,
            subject: 'Reset your HandisCV password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Reset Your Password</h1>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetUrl}" 
                       style="display: inline-block; background-color: #2563eb; color: white; 
                              padding: 12px 24px; text-decoration: none; border-radius: 8px; 
                              margin: 16px 0;">
                        Reset Password
                    </a>
                    <p style="color: #666; font-size: 14px;">
                        Or copy this link: ${resetUrl}
                    </p>
                    <p style="color: #999; font-size: 12px;">
                        This link expires in 1 hour. If you didn't request this, ignore this email.
                    </p>
                </div>
            `,
        });

        if (error) {
            logError(new Error(error.message), { context: 'sendPasswordResetEmail.resend' });
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        logError(err as Error, { context: 'sendPasswordResetEmail' });
        return { success: false, error: 'Failed to send email' };
    }
};

// --- NOTIFICATION EMAILS ---

export const sendResumeViewedEmail = async (
    email: string,
    resumeTitle: string,
    viewCount: number
): Promise<SendEmailResult> => {
    if (!resend) {
        logInfo('Resume viewed email skipped because Resend is not configured', { email, resumeTitle, viewCount });
        return { success: true };
    }
    const safeResumeTitle = escapeHtml(String(resumeTitle || 'Untitled Resume'));
    try {
        const { error } = await resend.emails.send({
            from: config.email.fromEmail,
            to: email,
            subject: `Your resume "${safeResumeTitle}" has been viewed!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Your Resume is Getting Noticed!</h1>
                    <p>Your resume <strong>"${safeResumeTitle}"</strong> has reached <strong>${viewCount}</strong> views.</p>
                    <p style="color: #666;">Keep your resume updated to make a great impression on potential employers.</p>
                    <a href="${config.email.appUrl}/dashboard"
                       style="display: inline-block; background-color: #2563eb; color: white;
                              padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                        View Dashboard
                    </a>
                </div>
            `,
        });
        if (error) {
            logError(new Error(error.message), { context: 'sendResumeViewedEmail.resend' });
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        logError(err as Error, { context: 'sendResumeViewedEmail' });
        return { success: false, error: 'Failed to send email' };
    }
};

export const sendWeeklyDigestEmail = async (
    email: string,
    data: { totalViews: number; resumeSummaries: Array<{ title: string; views: number }> }
): Promise<SendEmailResult> => {
    if (!resend) {
        logInfo('Weekly digest email skipped because Resend is not configured', { email, totalViews: data.totalViews });
        return { success: true };
    }
    const resumeList = data.resumeSummaries
        .map((r) => `<li><strong>${escapeHtml(String(r.title || 'Untitled Resume'))}</strong> — ${r.views} views</li>`)
        .join('');
    try {
        const { error } = await resend.emails.send({
            from: config.email.fromEmail,
            to: email,
            subject: `Your weekly HandisCV digest — ${data.totalViews} total views`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Your Weekly Summary</h1>
                    <p>Here's how your resumes performed this week:</p>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 0;">${data.totalViews} total views</p>
                    </div>
                    <ul style="color: #475569;">${resumeList}</ul>
                    <a href="${config.email.appUrl}/dashboard"
                       style="display: inline-block; background-color: #2563eb; color: white;
                              padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                        View Dashboard
                    </a>
                </div>
            `,
        });
        if (error) {
            logError(new Error(error.message), { context: 'sendWeeklyDigestEmail.resend' });
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        logError(err as Error, { context: 'sendWeeklyDigestEmail' });
        return { success: false, error: 'Failed to send email' };
    }
};

export const sendSubscriptionExpiryEmail = async (
    email: string,
    daysRemaining: number
): Promise<SendEmailResult> => {
    if (!resend) {
        logInfo('Subscription expiry email skipped because Resend is not configured', { email, daysRemaining });
        return { success: true };
    }
    try {
        const { error } = await resend.emails.send({
            from: config.email.fromEmail,
            to: email,
            subject: `Your HandisCV Premium expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Subscription Reminder</h1>
                    <p>Your HandisCV Premium subscription expires in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>.</p>
                    <p style="color: #666;">Renew now to keep access to AI analysis, premium templates, and more.</p>
                    <a href="${config.email.appUrl}/payment"
                       style="display: inline-block; background-color: #2563eb; color: white;
                              padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                        Renew Premium
                    </a>
                </div>
            `,
        });
        if (error) {
            logError(new Error(error.message), { context: 'sendSubscriptionExpiryEmail.resend' });
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        logError(err as Error, { context: 'sendSubscriptionExpiryEmail' });
        return { success: false, error: 'Failed to send email' };
    }
};

export const sendAccountActivityEmail = async (
    email: string,
    activity: string,
    timestamp: Date
): Promise<SendEmailResult> => {
    if (!resend) {
        logInfo('Account activity email skipped because Resend is not configured', {
            email,
            activity,
            timestamp: timestamp.toISOString(),
        });
        return { success: true };
    }
    const formattedTime = timestamp.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const safeActivity = escapeHtml(String(activity || 'Unknown activity'));
    try {
        const { error } = await resend.emails.send({
            from: config.email.fromEmail,
            to: email,
            subject: 'HandisCV Account Activity Alert',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Account Activity</h1>
                    <p>We detected the following activity on your account:</p>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 0;"><strong>Activity:</strong> ${safeActivity}</p>
                        <p style="margin: 4px 0 0 0; color: #666;"><strong>Time:</strong> ${formattedTime}</p>
                    </div>
                    <p style="color: #999; font-size: 12px;">If this wasn't you, please change your password immediately.</p>
                </div>
            `,
        });
        if (error) {
            logError(new Error(error.message), { context: 'sendAccountActivityEmail.resend' });
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        logError(err as Error, { context: 'sendAccountActivityEmail' });
        return { success: false, error: 'Failed to send email' };
    }
};

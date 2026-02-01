import { Resend } from 'resend';
import config from '../config/config';

const resend = config.email.resendApiKey
    ? new Resend(config.email.resendApiKey)
    : null;

interface SendEmailResult {
    success: boolean;
    error?: string;
}

export const sendVerificationEmail = async (
    email: string,
    token: string
): Promise<SendEmailResult> => {
    const verificationUrl = `${config.email.appUrl}/verify-email?token=${token}`;

    // Development fallback: log to console
    if (!resend) {
        console.log('\n========== EMAIL VERIFICATION ==========');
        console.log(`To: ${email}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log('==========================================\n');
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
            console.error('Resend error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Email send error:', err);
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
        console.log('\n========== PASSWORD RESET ==========');
        console.log(`To: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('=====================================\n');
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
            console.error('Resend error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Email send error:', err);
        return { success: false, error: 'Failed to send email' };
    }
};

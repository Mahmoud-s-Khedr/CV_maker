import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import config from '../config/config';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { logError, logInfo, logWarn } from '../utils/logger';
import { sendError } from '../utils/http';

const googleClient = new OAuth2Client(config.auth.googleClientId);
const MIN_AUTH_RESPONSE_MS = 300;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const generateToken = (userId: string, email: string, role: string) => {
    return jwt.sign(
        { userId, email, role },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );
};

const generateVerificationToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const enforceMinimumResponseTime = async (startedAt: number) => {
    const remaining = MIN_AUTH_RESPONSE_MS - (Date.now() - startedAt);
    if (remaining > 0) {
        await wait(remaining);
    }
};

const isStrongPassword = (password: string) => STRONG_PASSWORD_REGEX.test(password);
const passwordRequirementsMessage = 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

// REGISTER (Email/Password)
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            sendError(res, 400, 'AUTH_FIELDS_REQUIRED', 'Email and password are required');
            return;
        }

        if (!isStrongPassword(password)) {
            sendError(res, 400, 'WEAK_PASSWORD', passwordRequirementsMessage);
            return;
        }

        // Validate Role (Security: Only allow USER or RECRUITER)
        let assignedRole = 'USER';
        if (role) {
            if (role === 'RECRUITER') {
                assignedRole = 'RECRUITER';
            } else if (role !== 'USER') {
                logWarn('Invalid role requested during registration', { email, role });
                sendError(res, 400, 'INVALID_ROLE', 'Invalid role selected');
                return;
            }
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            logInfo('Registration attempt failed: User already exists', { email });
            sendError(res, 400, 'USER_ALREADY_EXISTS', 'User with this email already exists');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();
        const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: assignedRole as any, // Cast to match Prisma enum
                isEmailVerified: false,
                verificationToken,
                verificationExpiry,
            }
        });

        logInfo('User registered successfully', { userId: user.id, email });

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationToken);
        if (!emailResult.success) {
            logError(new Error('Failed to send verification email'), { email, error: emailResult.error });
            // Don't fail the registration, just let them know
            res.status(201).json({
                message: 'Registration successful, but failed to send verification email. Please try logging in and requesting a new one.',
                requiresVerification: true,
            });
            return;
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            requiresVerification: true,
        });

    } catch (error) {
        logError(error as Error, { context: 'register' });

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                sendError(res, 400, 'USER_ALREADY_EXISTS', 'A user with this email already exists');
                return;
            }
        }
        sendError(res, 500, 'REGISTER_FAILED', 'Registration failed. Please try again later.');
    }
};

// LOGIN (Email/Password)
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            sendError(res, 400, 'AUTH_FIELDS_REQUIRED', 'Email and password are required');
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Generic error message for security
        const invalidCredentials = () => {
            logInfo('Login failed: Invalid credentials', { email });
            sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        };

        if (!user || !user.password) {
            invalidCredentials();
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            invalidCredentials();
            return;
        }

        // Check email verification
        if (!user.isEmailVerified) {
            logInfo('Login blocked: Email not verified', { userId: user.id });
            sendError(
                res,
                403,
                'EMAIL_VERIFICATION_REQUIRED',
                'Please verify your email before logging in',
                { requiresVerification: true, email: user.email }
            );
            return;
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            const tempToken = jwt.sign(
                { userId: user.id, purpose: '2fa' },
                config.auth.jwtSecret,
                { expiresIn: '5m' }
            );
            logInfo('2FA required for login', { userId: user.id });
            res.json({ requiresTwoFactor: true, tempToken });
            return;
        }

        const token = generateToken(user.id, user.email, user.role);
        logInfo('User logged in successfully', { userId: user.id });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isPremium: user.isPremium,
                avatar: user.avatar,
            }
        });

    } catch (error) {
        logError(error as Error, { context: 'login' });
        sendError(res, 500, 'LOGIN_FAILED', 'Login failed. Please try again later.');
    }
};

// VERIFY EMAIL
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            sendError(res, 400, 'INVALID_VERIFICATION_TOKEN', 'Invalid verification token');
            return;
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token }
        });

        if (!user) {
            sendError(res, 400, 'INVALID_VERIFICATION_TOKEN', 'Invalid or expired verification token');
            return;
        }

        if (user.verificationExpiry && user.verificationExpiry < new Date()) {
            sendError(res, 400, 'VERIFICATION_TOKEN_EXPIRED', 'Verification token has expired. Please request a new one.');
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationToken: null,
                verificationExpiry: null,
            }
        });

        logInfo('Email verified successfully', { userId: user.id });
        res.json({ message: 'Email verified successfully. You can now log in.' });

    } catch (error) {
        logError(error as Error, { context: 'verifyEmail' });
        sendError(res, 500, 'VERIFY_EMAIL_FAILED', 'Email verification failed.');
    }
};

// RESEND VERIFICATION EMAIL
export const resendVerification = async (req: Request, res: Response) => {
    const startedAt = Date.now();

    try {
        const { email } = req.body;

        if (!email) {
            sendError(res, 400, 'EMAIL_REQUIRED', 'Email is required');
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            logInfo('Resend verification asked for non-existent email', { email });
        } else if (!user.isEmailVerified) {
            const verificationToken = generateVerificationToken();
            const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    verificationToken,
                    verificationExpiry,
                }
            });

            const emailResult = await sendVerificationEmail(email, verificationToken);
            if (!emailResult.success) {
                throw new Error(`Failed to send email: ${emailResult.error}`);
            }

            logInfo('Verification email resent', { userId: user.id });
        }

        await enforceMinimumResponseTime(startedAt);
        res.json({ message: 'If an account exists, a verification email has been sent.' });

    } catch (error) {
        logError(error as Error, { context: 'resendVerification' });
        await enforceMinimumResponseTime(startedAt);
        sendError(res, 500, 'RESEND_VERIFICATION_FAILED', 'Failed to resend verification email.');
    }
};

// FORGOT PASSWORD
export const forgotPassword = async (req: Request, res: Response) => {
    const startedAt = Date.now();

    try {
        const { email } = req.body;

        if (!email) {
            sendError(res, 400, 'EMAIL_REQUIRED', 'Email is required');
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Always respond with the same message to prevent email enumeration
        if (!user || !user.password) {
            await enforceMinimumResponseTime(startedAt);
            res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
            return;
        }

        const resetToken = generateVerificationToken();
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetExpiry },
        });

        const emailResult = await sendPasswordResetEmail(email, resetToken);
        if (!emailResult.success) {
            logError(new Error('Failed to send password reset email'), { email, error: emailResult.error });
        }

        logInfo('Password reset requested', { userId: user.id });
        await enforceMinimumResponseTime(startedAt);
        res.json({ message: 'If an account with that email exists, a reset link has been sent.' });

    } catch (error) {
        logError(error as Error, { context: 'forgotPassword' });
        await enforceMinimumResponseTime(startedAt);
        sendError(res, 500, 'FORGOT_PASSWORD_FAILED', 'Failed to process password reset request.');
    }
};

// RESET PASSWORD
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            sendError(res, 400, 'RESET_FIELDS_REQUIRED', 'Token and new password are required');
            return;
        }

        if (!isStrongPassword(newPassword)) {
            sendError(res, 400, 'WEAK_PASSWORD', passwordRequirementsMessage);
            return;
        }

        const user = await prisma.user.findUnique({ where: { resetToken: token } });

        if (!user || !user.resetExpiry) {
            sendError(res, 400, 'INVALID_RESET_TOKEN', 'Invalid or expired reset token');
            return;
        }

        if (user.resetExpiry < new Date()) {
            sendError(res, 400, 'RESET_TOKEN_EXPIRED', 'Reset token has expired. Please request a new one.');
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetExpiry: null,
            },
        });

        logInfo('Password reset successfully', { userId: user.id });
        res.json({ message: 'Password reset successfully. You can now log in.' });

    } catch (error) {
        logError(error as Error, { context: 'resetPassword' });
        sendError(res, 500, 'RESET_PASSWORD_FAILED', 'Failed to reset password.');
    }
};

// GOOGLE AUTH
export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            logWarn('Google Auth attempt without credential');
            sendError(res, 400, 'GOOGLE_CREDENTIAL_REQUIRED', 'No Google credential provided');
            return;
        }

        if (!config.auth.googleClientId) {
            logError(new Error('GOOGLE_CLIENT_ID is not configured on the server'));
            sendError(res, 500, 'SERVER_CONFIGURATION_ERROR', 'Server configuration error');
            return;
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: config.auth.googleClientId
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            sendError(res, 400, 'INVALID_GOOGLE_TOKEN', 'Invalid Google Token');
            return;
        }

        let user = await prisma.user.findUnique({ where: { email: payload.email } });

        if (!user) {
            // Google users are auto-verified since Google already verified their email
            user = await prisma.user.create({
                data: {
                    email: payload.email,
                    googleId: payload.sub,
                    avatar: payload.picture,
                    isEmailVerified: true, // Auto-verify Google users
                }
            });
            logInfo('New user registered via Google', { userId: user.id });
        } else if (!user.googleId) {
            if (!user.isEmailVerified) {
                sendError(
                    res,
                    403,
                    'EMAIL_VERIFICATION_REQUIRED',
                    'Please verify your email before linking Google Sign-In',
                    { requiresVerification: true, email: user.email }
                );
                return;
            }

            // Link Google account to an existing verified email.
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: payload.sub,
                    avatar: payload.picture,
                }
            });
            logInfo('Existing user linked Google account', { userId: user.id });
        }

        // Check if 2FA is enabled for Google auth users
        if (user.twoFactorEnabled) {
            const tempToken = jwt.sign(
                { userId: user.id, purpose: '2fa' },
                config.auth.jwtSecret,
                { expiresIn: '5m' }
            );
            logInfo('2FA required for Google login', { userId: user.id });
            res.json({ requiresTwoFactor: true, tempToken });
            return;
        }

        const token = generateToken(user.id, user.email, user.role);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isPremium: user.isPremium,
                avatar: user.avatar,
            }
        });

    } catch (error) {
        logError(error as Error, { context: 'googleAuth' });
        sendError(
            res,
            500,
            'GOOGLE_AUTH_FAILED',
            'Google Auth Failed',
            process.env.NODE_ENV !== 'production' ? { details: (error as Error).message } : undefined
        );
    }
};

// GET /api/auth/me — returns the authenticated user's profile (used by the browser extension popup)
export const getMe = async (req: Request, res: Response) => {
    try {
        const authUser = (req as any).user as { userId: string };
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: { id: true, email: true, role: true, isPremium: true, twoFactorEnabled: true, avatar: true },
        });
        if (!user) {
            sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
            return;
        }
        res.json(user);
    } catch (error) {
        logError(error as Error, { context: 'getMe' });
        sendError(res, 500, 'AUTH_ME_FAILED', 'Failed to fetch user');
    }
};

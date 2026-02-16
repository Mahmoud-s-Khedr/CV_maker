import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import config from '../config/config';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import logger, { logError, logInfo, logWarn } from '../utils/logger';

const googleClient = new OAuth2Client(config.auth.googleClientId);

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

// REGISTER (Email/Password)
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        // Validate Role (Security: Only allow USER or RECRUITER)
        let assignedRole = 'USER';
        if (role) {
            if (role === 'RECRUITER') {
                assignedRole = 'RECRUITER';
            } else if (role !== 'USER') {
                logWarn('Invalid role requested during registration', { email, role });
                res.status(400).json({ error: 'Invalid role selected' });
                return;
            }
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            logInfo('Registration attempt failed: User already exists', { email });
            res.status(400).json({ error: 'User with this email already exists' });
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
                res.status(400).json({ error: 'A user with this email already exists' });
                return;
            }
        }
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
};

// LOGIN (Email/Password)
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Generic error message for security
        const invalidCredentials = () => {
            logInfo('Login failed: Invalid credentials', { email });
            res.status(401).json({ error: 'Invalid email or password' });
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
            res.status(403).json({
                error: 'Please verify your email before logging in',
                requiresVerification: true,
                email: user.email,
            });
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
        res.status(500).json({ error: 'Login failed. Please try again later.' });
    }
};

// VERIFY EMAIL
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ error: 'Invalid verification token' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token }
        });

        if (!user) {
            res.status(400).json({ error: 'Invalid or expired verification token' });
            return;
        }

        if (user.verificationExpiry && user.verificationExpiry < new Date()) {
            res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
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
        res.status(500).json({ error: 'Email verification failed.' });
    }
};

// RESEND VERIFICATION EMAIL
export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Don't reveal if user exists
            logInfo('Resend verification asked for non-existent email', { email });
            res.json({ message: 'If an account exists, a verification email has been sent.' });
            return;
        }

        if (user.isEmailVerified) {
            res.status(400).json({ error: 'Email is already verified' });
            return;
        }

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
        res.json({ message: 'If an account exists, a verification email has been sent.' });

    } catch (error) {
        logError(error as Error, { context: 'resendVerification' });
        res.status(500).json({ error: 'Failed to resend verification email.' });
    }
};

// FORGOT PASSWORD
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Always respond with the same message to prevent email enumeration
        if (!user || !user.password) {
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
        res.json({ message: 'If an account with that email exists, a reset link has been sent.' });

    } catch (error) {
        logError(error as Error, { context: 'forgotPassword' });
        res.status(500).json({ error: 'Failed to process password reset request.' });
    }
};

// RESET PASSWORD
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            res.status(400).json({ error: 'Token and new password are required' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { resetToken: token } });

        if (!user || !user.resetExpiry) {
            res.status(400).json({ error: 'Invalid or expired reset token' });
            return;
        }

        if (user.resetExpiry < new Date()) {
            res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
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
        res.status(500).json({ error: 'Failed to reset password.' });
    }
};

// GOOGLE AUTH
export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            logWarn('Google Auth attempt without credential');
            res.status(400).json({ error: 'No Google credential provided' });
            return;
        }

        if (!config.auth.googleClientId) {
            logError(new Error('GOOGLE_CLIENT_ID is not configured on the server'));
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: config.auth.googleClientId
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({ error: 'Invalid Google Token' });
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
            // Link Google Account to existing email and verify
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: payload.sub,
                    avatar: payload.picture,
                    isEmailVerified: true, // Verify on Google link
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
        res.status(500).json({
            error: 'Google Auth Failed',
            details: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
        });
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
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error) {
        logError(error as Error, { context: 'getMe' });
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

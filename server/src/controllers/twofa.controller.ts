import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import config from '../config/config';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateTotpSecret, verifyTotpCode, generateQrCodeDataUrl } from '../services/totp.service';
import { logError, logInfo } from '../utils/logger';
import { sendError, sendMessage } from '../utils/http';

const generateToken = (userId: string, email: string, role: string) => {
    return jwt.sign(
        { userId, email, role },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );
};

// POST /api/auth/2fa/setup — Generate TOTP secret and QR code
export const setup = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { email: true, twoFactorEnabled: true },
        });

        if (!dbUser) {
            sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
            return;
        }

        if (dbUser.twoFactorEnabled) {
            sendError(res, 400, 'TWO_FACTOR_ALREADY_ENABLED', '2FA is already enabled');
            return;
        }

        const { secret, uri } = generateTotpSecret(dbUser.email);
        const qrCodeUrl = await generateQrCodeDataUrl(uri);

        // Store secret temporarily (not enabled yet)
        await prisma.user.update({
            where: { id: user.userId },
            data: { totpSecret: secret },
        });

        logInfo('2FA setup initiated', { userId: user.userId });
        res.json({ qrCodeUrl, secret });
    } catch (error) {
        logError(error as Error, { context: '2fa-setup' });
        sendError(res, 500, 'TWO_FACTOR_SETUP_FAILED', 'Failed to set up 2FA');
    }
};

// POST /api/auth/2fa/verify-setup — Verify first code and enable 2FA
export const verifySetup = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const { code } = req.body;

        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { totpSecret: true, twoFactorEnabled: true },
        });

        if (!dbUser || !dbUser.totpSecret) {
            sendError(res, 400, 'TWO_FACTOR_SETUP_REQUIRED', 'Please initiate 2FA setup first');
            return;
        }

        if (dbUser.twoFactorEnabled) {
            sendError(res, 400, 'TWO_FACTOR_ALREADY_ENABLED', '2FA is already enabled');
            return;
        }

        const isValid = verifyTotpCode(dbUser.totpSecret, code);
        if (!isValid) {
            sendError(res, 400, 'INVALID_TWO_FACTOR_CODE', 'Invalid verification code. Please try again.');
            return;
        }

        await prisma.user.update({
            where: { id: user.userId },
            data: { twoFactorEnabled: true },
        });

        logInfo('2FA enabled successfully', { userId: user.userId });
        sendMessage(res, 200, '2FA has been enabled successfully', { success: true });
    } catch (error) {
        logError(error as Error, { context: '2fa-verify-setup' });
        sendError(res, 500, 'TWO_FACTOR_VERIFY_SETUP_FAILED', 'Failed to verify 2FA setup');
    }
};

// POST /api/auth/2fa/disable — Disable 2FA (requires current code)
export const disable = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const { code } = req.body;

        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { totpSecret: true, twoFactorEnabled: true },
        });

        if (!dbUser || !dbUser.twoFactorEnabled || !dbUser.totpSecret) {
            sendError(res, 400, 'TWO_FACTOR_NOT_ENABLED', '2FA is not enabled');
            return;
        }

        const isValid = verifyTotpCode(dbUser.totpSecret, code);
        if (!isValid) {
            sendError(res, 400, 'INVALID_TWO_FACTOR_CODE', 'Invalid verification code');
            return;
        }

        await prisma.user.update({
            where: { id: user.userId },
            data: { twoFactorEnabled: false, totpSecret: null },
        });

        logInfo('2FA disabled', { userId: user.userId });
        sendMessage(res, 200, '2FA has been disabled', { success: true });
    } catch (error) {
        logError(error as Error, { context: '2fa-disable' });
        sendError(res, 500, 'TWO_FACTOR_DISABLE_FAILED', 'Failed to disable 2FA');
    }
};

// POST /api/auth/2fa/validate — Validate code during login, issue real JWT
export const validate = async (req: Request, res: Response) => {
    try {
        const { tempToken, code } = req.body;

        // Verify the temporary token
        let decoded: any;
        try {
            decoded = jwt.verify(tempToken, config.auth.jwtSecret);
        } catch {
            sendError(res, 401, 'INVALID_OR_EXPIRED_TOKEN', 'Invalid or expired token. Please log in again.');
            return;
        }

        if (decoded.purpose !== '2fa') {
            sendError(res, 401, 'INVALID_TOKEN', 'Invalid token');
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, isPremium: true, avatar: true, totpSecret: true, twoFactorEnabled: true },
        });

        if (!user || !user.twoFactorEnabled || !user.totpSecret) {
            sendError(res, 400, 'TWO_FACTOR_NOT_ENABLED', '2FA is not enabled for this account');
            return;
        }

        const isValid = verifyTotpCode(user.totpSecret, code);
        if (!isValid) {
            sendError(res, 400, 'INVALID_TWO_FACTOR_CODE', 'Invalid verification code');
            return;
        }

        // Issue the real JWT
        const token = generateToken(user.id, user.email, user.role);
        logInfo('2FA validation successful', { userId: user.id });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isPremium: user.isPremium,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        logError(error as Error, { context: '2fa-validate' });
        sendError(res, 500, 'TWO_FACTOR_VALIDATE_FAILED', 'Failed to validate 2FA code');
    }
};

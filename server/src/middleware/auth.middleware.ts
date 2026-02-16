import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
        const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
        (req as AuthRequest).user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'USER', // Default to USER if not present (legacy tokens)
        };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
};

export const requirePremium = async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { isPremium: true },
    });

    if (!dbUser?.isPremium) {
        res.status(403).json({ error: 'Premium subscription required' });
        return;
    }

    next();
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;

        if (!user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        if (!roles.includes(user.role)) {
            res.status(403).json({ error: 'Access denied: Insufficient permissions' });
            return;
        }

        next();
    };
};

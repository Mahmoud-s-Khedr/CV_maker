import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
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
            email: decoded.email
        };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
};

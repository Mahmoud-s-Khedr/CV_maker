import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger';

/**
 * HTTP request logging middleware
 * Logs all incoming requests with timing information
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logRequest(req, res, duration);
    });

    next();
};

export default requestLogger;

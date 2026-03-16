import type { Response } from 'express';

export const sendError = (
    res: Response,
    status: number,
    code: string,
    message: string,
    details?: unknown
) => {
    res.status(status).json(
        details === undefined
            ? { error: message, code }
            : { error: message, code, details }
    );
};

export const sendMessage = (
    res: Response,
    status: number,
    message: string,
    extra?: Record<string, unknown>
) => {
    res.status(status).json({
        message,
        ...extra,
    });
};

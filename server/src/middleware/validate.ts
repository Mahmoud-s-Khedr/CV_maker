import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/http';

/**
 * Generic Zod validation middleware factory.
 * Returns 400 with field-level error messages on validation failure.
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
            return;
        }
        req.body = result.data;
        next();
    };
};

/**
 * Query-string validation middleware using Zod.
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const errors = result.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
            return;
        }
        req.query = result.data as Request['query'];
        next();
    };
};

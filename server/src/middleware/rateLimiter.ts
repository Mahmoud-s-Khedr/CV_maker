import rateLimit from 'express-rate-limit';

/**
 * Strict limiter for AI endpoints — these call a paid external API.
 * 20 requests per hour per IP.
 */
export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many AI requests. Please try again later.' },
});

/**
 * Auth limiter — prevents brute-force on login/register.
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again later.' },
});

/**
 * Resend verification limiter - tight cap to prevent abuse/spam.
 */
export const resendVerificationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many verification email requests. Please try again later.' },
});

/**
 * General API limiter — broad protection against scripted abuse.
 * 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' },
});

/**
 * Review comment limiter — prevents anonymous spam on public review links.
 * 10 comments per 10 minutes per IP.
 */
export const reviewCommentLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many review comments. Please try again later.' },
});

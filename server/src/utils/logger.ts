import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for file logs
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Custom format for console logs
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'cv-maker-api' },
    transports: [
        // Error logs - separate file for easy debugging
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined logs - all levels
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // HTTP request logs - separate file
        new winston.transports.File({
            filename: path.join(logsDir, 'http.log'),
            level: 'http',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 3,
        }),
    ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
    }));
}

// Helper methods for common logging patterns
export const logRequest = (req: any, res: any, duration: number) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
    });
};

export const logError = (error: Error, context?: Record<string, any>) => {
    logger.error(error.message, {
        stack: error.stack,
        ...context,
    });
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
};

export const logWarn = (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
};

export default logger;

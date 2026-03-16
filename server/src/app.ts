import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import config from './config/config';
import resumeRoutes from './routes/resume.routes';
import importRoutes from './routes/import.routes';
import aiRoutes from './routes/ai.routes';
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import templateRoutes from './routes/template.routes';
import recruiterRoutes from './routes/recruiter.routes';
import twofaRoutes from './routes/twofa.routes';
import notificationRoutes from './routes/notification.routes';
import reviewRoutes from './routes/review.routes';
import jobRoutes from './routes/job.routes';
import { initScheduler } from './jobs/scheduler';
import { logError, logInfo, logWarn } from './utils/logger';
import requestLogger from './middleware/requestLogger';
import { generalLimiter } from './middleware/rateLimiter';
import { prisma } from './lib/prisma';
import { sendError } from './utils/http';

const app = express();
const corsOrigins = config.server.corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedCorsOrigins = new Set(corsOrigins);

// Middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        if (allowedCorsOrigins.has(origin)) {
            callback(null, origin);
            return;
        }

        logWarn('Blocked CORS origin', { origin });
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 204,
}));
app.use((req, res, next) => {
    if (req.path === '/api/payment/webhook' || req.originalUrl === '/api/payment/webhook') {
        next();
        return;
    }
    express.json()(req, res, next);
});

// Request logging middleware
app.use(requestLogger);

// General rate limiting (applied to all API routes)
app.use('/api', generalLimiter);

// Routes
app.use('/api/resumes', resumeRoutes);
app.use('/api/import', importRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/auth/2fa', twofaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', reviewRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            status: 'ok',
            database: 'ok',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logError(error as Error, { context: 'healthcheck' });
        sendError(res, 503, 'DEPENDENCY_UNAVAILABLE', 'Database connectivity check failed');
    }
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.message === 'Not allowed by CORS') {
        sendError(res, 403, 'CORS_NOT_ALLOWED', 'Origin is not allowed by CORS policy');
        return;
    }

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            sendError(res, 413, 'FILE_TOO_LARGE', 'Uploaded file exceeds the 10MB limit');
            return;
        }

        sendError(res, 400, 'UPLOAD_ERROR', err.message);
        return;
    }

    logError(err, {
        path: req.path,
        method: req.method,
        body: req.body
    });
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
});


app.listen(config.server.port, () => {
    logInfo('Server started', {
        port: config.server.port,
        env: config.env,
        logLevel: process.env.LOG_LEVEL || 'info'
    });
    initScheduler();
});

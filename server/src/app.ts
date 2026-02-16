import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import logger, { logError, logInfo } from './utils/logger';
import requestLogger from './middleware/requestLogger';
import { generalLimiter } from './middleware/rateLimiter';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: config.server.corsOrigins.split(','),
    credentials: true,
}));
app.use(express.json());

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

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logError(err, {
        path: req.path,
        method: req.method,
        body: req.body
    });
    res.status(500).json({ error: 'Internal server error' });
});


app.listen(config.server.port, () => {
    logInfo(`Server started`, {
        port: config.server.port,
        env: config.env,
        logLevel: process.env.LOG_LEVEL || 'info'
    });
    console.log(`Server running on port ${config.server.port} (${config.env})`);
    initScheduler();
});

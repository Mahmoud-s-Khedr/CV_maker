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
import logger, { logError, logInfo } from './utils/logger';
import requestLogger from './middleware/requestLogger';

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

// Routes
app.use('/api/resumes', resumeRoutes);
app.use('/api/import', importRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/recruiter', recruiterRoutes);

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
});

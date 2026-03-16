import dotenv from 'dotenv';
import path from 'path';

const projectRootEnvPath = path.resolve(__dirname, '../../../.env');
const serverLocalEnvPath = path.resolve(__dirname, '../../.env');

// Load shared defaults from the project root, then allow server/.env to override them locally.
dotenv.config({ path: projectRootEnvPath });
dotenv.config({ path: serverLocalEnvPath, override: true });

// Helper to get required env var (throws if missing in production)
const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value && process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
};

// Helper for optional env vars
const getOptionalEnvVar = (key: string, defaultValue: string = ''): string => {
    return process.env[key] || defaultValue;
};

const getRequiredEnvVar = (key: string): string => {
    const value = process.env[key]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

// Helper for numeric env vars
const getNumericEnvVar = (key: string, defaultValue: number): number => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
};

// Helper for boolean env vars
const getBoolEnvVar = (key: string, defaultValue: boolean): boolean => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
};

const defaultLocalClientOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
].join(',');

export const config = {
    // Environment
    env: getOptionalEnvVar('NODE_ENV', 'development'),
    isDev: getOptionalEnvVar('NODE_ENV', 'development') === 'development',
    isProd: process.env.NODE_ENV === 'production',

    // Server
    server: {
        port: getNumericEnvVar('PORT', 4000),
        corsOrigins: getOptionalEnvVar('CORS_ORIGINS', defaultLocalClientOrigins),
    },

    // Database
    database: {
        url: getEnvVar('DATABASE_URL', 'postgresql://localhost:5432/cvmaker'),
    },

    // Authentication
    auth: {
        jwtSecret: getRequiredEnvVar('JWT_SECRET'),
        jwtExpiresIn: getOptionalEnvVar('JWT_EXPIRES_IN', '7d'),
        googleClientId: getOptionalEnvVar('GOOGLE_CLIENT_ID'),
    },

    // Email (Resend)
    email: {
        resendApiKey: getOptionalEnvVar('RESEND_API_KEY'),
        fromEmail: getOptionalEnvVar('FROM_EMAIL', 'noreply@cvmaker.com'),
        appUrl: getOptionalEnvVar('APP_URL', 'http://localhost:4173'),
    },

    // Payments (Stripe)
    stripe: {
        secretKey: getOptionalEnvVar('STRIPE_SECRET_KEY'),
        webhookSecret: getOptionalEnvVar('STRIPE_WEBHOOK_SECRET'),
        clientUrl: getOptionalEnvVar('CLIENT_URL', 'http://localhost:4173'),
    },

    // AI / OpenRouter
    ai: {
        openRouterApiKey: getOptionalEnvVar('OPENROUTER_API_KEY'),
        defaultModel: getOptionalEnvVar('OPENROUTER_MODEL', 'meta-llama/llama-3.3-70b-instruct'),
    },
} as const;

// Type export for use in other files
export type Config = typeof config;

// Default export for convenience
export default config;

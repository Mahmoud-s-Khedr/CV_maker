import axios from 'axios';
import type { ResumeSchema, Resume } from '../types/resume';
import type { CreateJobInput } from '../types/job';

// Use environment variable for API URL, fallback to localhost for development.
// We normalize it to ensure it includes the `/api` prefix.
const normalizeApiUrl = (rawUrl: string): string => {
    const trimmed = rawUrl.replace(/\/+$/, '');
    if (trimmed.endsWith('/api')) return trimmed;
    return `${trimmed}/api`;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || 'http://localhost:4000');

// Create axios instance first
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auth Helper - defined after api instance
export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// --- RESUME API ---
export const saveResume = async (resume: ResumeSchema) => {
    const title = resume.profile?.fullName
        ? `${resume.profile.fullName}'s Resume`
        : 'Untitled Resume';

    return await api.post('/resumes', {
        title,
        content: resume,
    });
};

export const updateResume = async (id: string, resumeUpdates: Partial<Resume> | { content: ResumeSchema }) => {
    return await api.patch(`/resumes/${id}`, resumeUpdates);
};

export const loadResume = async (id: string) => {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
};

export const getUserResumes = async () => {
    const response = await api.get('/resumes/user/me');
    return response.data;
};

export const deleteResume = async (id: string) => {
    await api.delete(`/resumes/${id}`);
};

export const saveVersion = async (resumeId: string, content: any) => {
    return await api.post(`/resumes/${resumeId}/versions`, { content });
};

export const getResumeVersions = async (resumeId: string) => {
    const response = await api.get(`/resumes/${resumeId}/versions`);
    return response.data;
};

export const importLinkedInResume = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/linkedin', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
    return response.data;
};

export const importGitHubRepos = async (username: string) => {
    const response = await api.post('/import/github', { username });
    return response.data;
};

// --- AUTH API ---
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    role?: 'USER' | 'RECRUITER';
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        role: string;
        isPremium: boolean;
        avatar?: string;
    };
    requiresTwoFactor?: boolean;
    tempToken?: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const register = async (credentials: RegisterCredentials) => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
};

export const googleLogin = async (credential: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', { credential });
    return response.data;
};

// --- AI API ---
export interface AnalysisResult {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
}

export const analyzeResume = async (resumeContent: ResumeSchema): Promise<AnalysisResult> => {
    const response = await api.post('/ai/analyze', { content: resumeContent });
    return response.data;
};

export interface JobFitResult {
    score: number;
    summary: string;
    matchingKeywords: string[];
    missingKeywords: string[];
    recommendedFocus: string;
}

export const analyzeJobFit = async (resumeContent: ResumeSchema, jobDescription: string): Promise<JobFitResult> => {
    const response = await api.post('/ai/job-fit', { resume: resumeContent, jobDescription });
    return response.data;
};

// --- TWO-FACTOR AUTH ---
export const setup2FA = async (): Promise<{ qrCodeUrl: string; secret: string }> => {
    const response = await api.post('/auth/2fa/setup');
    return response.data;
};

export const verifySetup2FA = async (code: string) => {
    const response = await api.post('/auth/2fa/verify-setup', { code });
    return response.data;
};

export const disable2FA = async (code: string) => {
    const response = await api.post('/auth/2fa/disable', { code });
    return response.data;
};

export const validate2FA = async (tempToken: string, code: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/2fa/validate', { tempToken, code });
    return response.data;
};

// --- PASSWORD RESET ---
export const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
};

// --- EMAIL VERIFICATION ---
export const verifyEmail = async (token: string) => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
};

export const resendVerification = async (email: string) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
};

// --- ADMIN API ---
export const getUsers = async (page = 1, limit = 20) => {
    const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
    return response.data;
};

export const deleteUser = async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};

export const getAuditLogs = async (page = 1, limit = 50) => {
    const response = await api.get(`/admin/logs?page=${page}&limit=${limit}`);
    return response.data;
};

export const createTemplate = async (data: { name: string, config: any, isPremium: boolean, thumbnailUrl?: string }) => {
    const response = await api.post('/admin/templates', data);
    return response.data;
};

export const deleteTemplate = async (id: string) => {
    const response = await api.delete(`/admin/templates/${id}`);
    return response.data;
};

// --- TEMPLATE API ---
export const getTemplates = async () => {
    const response = await api.get('/templates');
    return response.data;
};

export const getTemplate = async (id: string) => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
};

// --- RECRUITER API ---
export const searchResumes = async (query: string, page = 1, limit = 10) => {
    const response = await api.get(`/recruiter/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
};

export const getPublicResume = async (shareKey: string) => {
    const response = await api.get(`/recruiter/public/${shareKey}`);
    return response.data;
};

// --- PAYMENT API ---
export const createCheckoutSession = async (): Promise<{ url: string }> => {
    const response = await api.post('/payment/create-checkout-session');
    return response.data;
};

// --- NOTIFICATION API ---
export interface NotificationPrefs {
    resumeViewed: boolean;
    weeklyDigest: boolean;
    subscriptionReminder: boolean;
    accountActivity: boolean;
}

export const getNotificationPreferences = async (): Promise<NotificationPrefs> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
};

export const updateNotificationPreferences = async (prefs: Partial<NotificationPrefs>): Promise<NotificationPrefs> => {
    const response = await api.patch('/notifications/preferences', prefs);
    return response.data;
};

// --- REVIEW SESSION API ---
export const createReviewSession = async (resumeId: string, expiresInDays?: number) => {
    const response = await api.post(`/resumes/${resumeId}/review-sessions`, { expiresInDays });
    return response.data;
};

export const getReviewSessions = async (resumeId: string) => {
    const response = await api.get(`/resumes/${resumeId}/review-sessions`);
    return response.data;
};

export const deleteReviewSession = async (sessionId: string) => {
    const response = await api.delete(`/review-sessions/${sessionId}`);
    return response.data;
};

export const getReviewByToken = async (token: string) => {
    const response = await api.get(`/review/${token}`);
    return response.data;
};

export const addReviewComment = async (token: string, comment: { sectionId: string; text: string; reviewerName: string }) => {
    const response = await api.post(`/review/${token}/comments`, comment);
    return response.data;
};

export const resolveComment = async (resumeId: string, sessionId: string, commentId: string) => {
    const response = await api.patch(`/resumes/${resumeId}/review-sessions/${sessionId}/comments/${commentId}`, { resolved: true });
    return response.data;
};

// --- JOB APPLICATION API ---
export const getJobApplications = async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/jobs${params}`);
    return response.data;
};

export const createJobApplication = async (data: CreateJobInput) => {
    const response = await api.post('/jobs', data);
    return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateJobApplication = async (id: string, data: any) => {
    const response = await api.patch(`/jobs/${id}`, data);
    return response.data;
};

export const deleteJobApplication = async (id: string) => {
    await api.delete(`/jobs/${id}`);
};

export const getJobStats = async () => {
    const response = await api.get('/jobs/stats');
    return response.data;
};


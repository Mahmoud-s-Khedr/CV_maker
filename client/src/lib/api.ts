import axios from 'axios';
import type { ResumeSchema, Resume } from '../types/resume';

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
export const saveResume = async (userId: string, resume: ResumeSchema) => {
    const title = resume.profile?.fullName
        ? `${resume.profile.fullName}'s Resume`
        : 'Untitled Resume';

    return await api.post('/resumes', {
        userId,
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

export const getUserResumes = async (userId: string) => {
    const response = await api.get(`/resumes/user/${userId}`);
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
export interface InitiatePaymentRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export interface InitiatePaymentResponse {
    paymentKey: string;
    frameId: number | string;
}

export const initiatePayment = async (payload: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
    const response = await api.post('/payment/initiate', payload);
    return response.data;
};


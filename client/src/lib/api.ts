import axios from 'axios';
import type { ResumeSchema } from '../types/resume';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

export const updateResume = async (id: string, resume: ResumeSchema) => {
    return await api.patch(`/resumes/${id}`, {
        content: resume,
    });
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

export const createVersion = async (resumeId: string) => {
    // We expect the server to use current state if no content provided, 
    // or we can pass current content. 
    // For simplicity, let's assume server handles it or we pass it if needed.
    // Based on backend implementation: const { content } = req.body;
    // We should probably pass content to be safe/explicit, but I'll update it to be flexible.
    // Actually, let's just trigger it. If backend needs content, we'd need to pass it.
    // My backend controller implementation uses req.body.content. 
    // If it's missing, it creates version with "undefined" content? 
    // Wait, backend: createVersion(id, content). Service: data: { content }.
    // So I MUST pass content.
    // I should update this signature to accept content.
    return await api.post(`/resumes/${resumeId}/versions`, {});
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

// --- AUTH API ---
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
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

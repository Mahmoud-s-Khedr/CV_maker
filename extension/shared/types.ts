// Scraped from a LinkedIn /in/* profile page
export interface LinkedInExperience {
  title: string;
  company: string;
  dateRange: string; // e.g. "Jan 2020 – Mar 2023" or "Mar 2021 – Present"
  description: string;
}

export interface LinkedInEducation {
  school: string;
  degree: string;
  dateRange: string;
}

export interface LinkedInScrapedProfile {
  fullName: string;
  headline: string;    // → jobTitle
  location: string;
  summary: string;     // "About" section
  experience: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
}

// Scraped from a LinkedIn /jobs/view/* page
export interface LinkedInJobPayload {
  jobTitle: string;
  company: string;
  location: string;
  description: string;
  url: string;
}

// Messages sent between extension contexts
export type ExtensionMessage =
  | { type: 'PROFILE_READY'; payload: LinkedInScrapedProfile }
  | { type: 'JOB_READY'; payload: LinkedInJobPayload }
  | { type: 'GET_CACHED_PROFILE' }
  | { type: 'GET_CACHED_JOB' }
  | { type: 'API_FETCH'; path: string; method: string; body?: unknown }
  | { type: 'SET_BADGE'; count: number };

export type MessageResponse<T = unknown> =
  | { data: T; error?: never }
  | { error: string; data?: never };

// Job Application status enum (mirrors server ApplicationStatus)
export type JobStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

// Minimal user info returned by GET /api/auth/me
export interface ExtensionUser {
  id: string;
  email: string;
  role: string;
  isPremium: boolean;
  twoFactorEnabled: boolean;
  avatar?: string;
}

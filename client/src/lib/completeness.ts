import type { ResumeSchema } from '../types/resume';

export interface CompletenessResult {
    score: number;
    hints: string[];
}

interface ScoringRule {
    points: number;
    check: (resume: ResumeSchema) => boolean;
    hint: string;
}

const rules: ScoringRule[] = [
    { points: 10, check: (r) => !!r.profile.fullName?.trim(), hint: 'Add your full name' },
    { points: 5, check: (r) => !!r.profile.email?.trim(), hint: 'Add your email address' },
    { points: 5, check: (r) => !!r.profile.phone?.trim(), hint: 'Add your phone number' },
    { points: 10, check: (r) => !!r.profile.jobTitle?.trim(), hint: 'Add a job title' },
    { points: 5, check: (r) => !!r.profile.location?.trim(), hint: 'Add your location' },
    { points: 5, check: (r) => !!r.profile.url?.trim(), hint: 'Add a website or LinkedIn URL' },
    { points: 15, check: (r) => (r.profile.summary?.trim().length ?? 0) >= 50, hint: 'Write a professional summary (at least 50 characters)' },
    {
        points: 15,
        check: (r) => r.sections.some((s) => s.type === 'experience' && Array.isArray(s.items) && s.items.length >= 1),
        hint: 'Add at least 1 work experience',
    },
    {
        points: 5,
        check: (r) => r.sections.some((s) => s.type === 'experience' && Array.isArray(s.items) && s.items.length >= 2),
        hint: 'Add a second work experience for a stronger profile',
    },
    {
        points: 10,
        check: (r) => r.sections.some((s) => s.type === 'education' && Array.isArray(s.items) && s.items.length >= 1),
        hint: 'Add your education',
    },
    {
        points: 10,
        check: (r) => r.sections.some((s) => s.type === 'skills' && Array.isArray(s.items) && s.items.length >= 3),
        hint: 'Add at least 3 skills',
    },
    {
        points: 5,
        check: (r) => r.sections.some((s) => !['experience', 'education', 'skills'].includes(s.type) && Array.isArray(s.items) && s.items.length >= 1),
        hint: 'Add a projects, certifications, or languages section',
    },
];

export function calculateCompleteness(resume: ResumeSchema): CompletenessResult {
    let score = 0;
    const hints: string[] = [];

    for (const rule of rules) {
        if (rule.check(resume)) {
            score += rule.points;
        } else {
            hints.push(rule.hint);
        }
    }

    return { score, hints: hints.slice(0, 3) };
}

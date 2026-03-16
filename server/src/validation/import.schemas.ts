import { z } from 'zod';

const linkedInExperienceSchema = z.object({
    title: z.string().trim().min(1).max(200),
    company: z.string().trim().min(1).max(200),
    dateRange: z.string().trim().max(100),
    description: z.string().max(5000).default(''),
});

const linkedInEducationSchema = z.object({
    school: z.string().trim().min(1).max(200),
    degree: z.string().trim().max(200).default(''),
    dateRange: z.string().trim().max(100).default(''),
});

export const githubImportSchema = z.object({
    username: z
        .string()
        .trim()
        .regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, 'Invalid GitHub username'),
});

export const linkedInExtensionImportSchema = z.object({
    profileData: z.object({
        fullName: z.string().trim().min(1).max(200),
        headline: z.string().max(300).default(''),
        location: z.string().max(200).default(''),
        summary: z.string().max(5000).default(''),
        experience: z.array(linkedInExperienceSchema).max(100).default([]),
        education: z.array(linkedInEducationSchema).max(50).default([]),
        skills: z.array(z.string().trim().min(1).max(100)).max(200).default([]),
    }),
});

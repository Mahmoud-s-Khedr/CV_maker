import { Request, Response } from 'express';
import * as pdfParserService from '../services/pdf-parser.service';
import * as aiService from '../services/ai.service';
import * as githubService from '../services/github.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import logger from '../utils/logger';
import { sendError } from '../utils/http';

export const importLinkedInPDF = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            sendError(res, 400, 'FILE_REQUIRED', 'No file uploaded');
            return;
        }

        if (req.file.mimetype !== 'application/pdf') {
            sendError(res, 400, 'INVALID_FILE_TYPE', 'Only PDF files are allowed');
            return;
        }

        const buffer = req.file.buffer;
        const text = await pdfParserService.parseResumePDF(buffer);

        // Prefer AI extraction (best quality), but fall back to heuristic extraction
        // so import still works when OPENROUTER_API_KEY is not configured.
        let profileData: any;
        let parser: 'ai' | 'heuristic' = 'heuristic';
        try {
            if (process.env.OPENROUTER_API_KEY) {
                profileData = await aiService.parseResumeText(text);
                parser = 'ai';
            } else {
                profileData = pdfParserService.extractProfileData(text);
            }
        } catch (e) {
            profileData = pdfParserService.extractProfileData(text);
        }

        res.json({
            success: true,
            data: {
                profile: profileData,
                fullText: text,
                parser,
            }
        });

    } catch (error) {
        logger.error('Import Error', { error });
        sendError(res, 500, 'PDF_IMPORT_FAILED', 'Failed to process PDF');
    }
};

export const importGitHubRepos = async (req: Request, res: Response) => {
    try {
        const { username } = req.body;
        const projects = await githubService.fetchUserRepos(username);

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        logger.error('GitHub Import Error', { error });
        sendError(
            res,
            500,
            'GITHUB_IMPORT_FAILED',
            error instanceof Error ? error.message : 'Failed to import projects'
        );
    }
};

// --- LinkedIn Extension Import ---

interface LinkedInExperience {
    title: string;
    company: string;
    dateRange: string;
    description: string;
}

interface LinkedInEducation {
    school: string;
    degree: string;
    dateRange: string;
}

interface LinkedInScrapedProfile {
    fullName: string;
    headline: string;
    location: string;
    summary: string;
    experience: LinkedInExperience[];
    education: LinkedInEducation[];
    skills: string[];
}

/**
 * Parse a LinkedIn date range string like "Jan 2020 – Mar 2023" or "Mar 2021 – Present"
 * into separate startDate / endDate strings.
 */
function parseDateRange(dateRange: string): { startDate: string; endDate?: string } {
    const parts = dateRange.split(/\s*[–—-]\s*/); // handle en-dash, em-dash, hyphen
    const startDate = parts[0]?.trim() ?? '';
    const rawEnd = parts[1]?.trim() ?? '';
    const endDate = rawEnd && rawEnd.toLowerCase() !== 'present' ? rawEnd : undefined;
    return { startDate, endDate };
}

function makeId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mapLinkedInToResumeSchema(profile: LinkedInScrapedProfile): object {
    const experienceItems = profile.experience.map((exp) => {
        const { startDate, endDate } = parseDateRange(exp.dateRange);
        return {
            id: makeId(),
            company: exp.company,
            position: exp.title,
            location: '',
            startDate,
            endDate,
            description: exp.description,
            highlights: [],
        };
    });

    const educationItems = profile.education.map((edu) => {
        const { startDate, endDate } = parseDateRange(edu.dateRange);
        return {
            id: makeId(),
            institution: edu.school,
            degree: edu.degree,
            field: '',
            location: '',
            startDate,
            endDate,
            highlights: [],
        };
    });

    const skillItems = profile.skills.map((skill) => ({
        id: makeId(),
        name: skill,
    }));

    return {
        meta: {
            templateId: 'standard',
            themeConfig: {
                primaryColor: '#2563eb',
                fontFamily: 'Inter',
                spacing: 'standard',
            },
        },
        profile: {
            fullName: profile.fullName,
            jobTitle: profile.headline,
            email: '',
            phone: '',
            location: profile.location,
            url: '',
            summary: profile.summary,
        },
        sections: [
            {
                id: makeId(),
                type: 'experience',
                title: 'Experience',
                isVisible: true,
                columns: 1,
                items: experienceItems,
            },
            {
                id: makeId(),
                type: 'education',
                title: 'Education',
                isVisible: true,
                columns: 1,
                items: educationItems,
            },
            {
                id: makeId(),
                type: 'skills',
                title: 'Skills',
                isVisible: true,
                columns: 2,
                items: skillItems,
            },
        ],
    };
}

// POST /api/import/linkedin-extension
export const importFromExtension = async (req: Request, res: Response) => {
    try {
        const { profileData } = req.body as { profileData: LinkedInScrapedProfile };

        const userId = (req as AuthRequest).user!.userId;
        const resumeContent = mapLinkedInToResumeSchema(profileData);
        const title = `${profileData.fullName} — LinkedIn Import`;

        const resume = await prisma.resume.create({
            data: {
                title,
                content: resumeContent as any,
                userId,
            },
        });

        res.status(201).json({ resumeId: resume.id, title: resume.title });
    } catch (error) {
        logger.error('LinkedIn extension import failed', { error });
        sendError(res, 500, 'LINKEDIN_EXTENSION_IMPORT_FAILED', 'Import failed');
    }
};

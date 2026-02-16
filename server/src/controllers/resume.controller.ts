import { Request, Response } from 'express';
import crypto from 'crypto';
import * as resumeService from '../services/resume.service';
import type { AuthRequest } from '../middleware/auth.middleware';
import { logError } from '../utils/logger';
import { prisma } from '../lib/prisma';

export const createResume = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user!.userId;
        const { title, content } = req.body;
        const resume = await resumeService.createResume(userId, title, content);
        res.status(201).json(resume);
    } catch (error) {
        logError(error as Error, { context: 'createResume' });
        res.status(500).json({ error: 'Failed to create resume' });
    }
};

export const getResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;
        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }
        if (resume.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        res.json(resume);
    } catch (error) {
        logError(error as Error, { context: 'getResume' });
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
};

export const updateResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;
        const data = req.body;

        // Auto-versioning: Save current state as version before update
        const currentResume = await resumeService.getResumeById(id as string);
        if (!currentResume) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }
        if (currentResume.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        await resumeService.createVersion(id as string, currentResume.content);
        resumeService.pruneOldVersions(id as string).catch(() => {});

        // Check premium template access
        const templateId = data.content?.meta?.templateId;
        if (templateId) {
            const template = await resumeService.getTemplateById(templateId);
            if (template?.isPremium) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { isPremium: true },
                });
                if (!user?.isPremium) {
                    res.status(403).json({ error: 'Premium template requires upgrade' });
                    return;
                }
            }
        }

        // Handle Public/Share Key logic
        if (data.isPublic === true && !currentResume.shareKey) {
            data.shareKey = crypto.randomBytes(8).toString('base64url');
        }

        const resume = await resumeService.updateResume(id as string, data);
        res.json(resume);
    } catch (error) {
        logError(error as Error, { context: 'updateResume' });
        res.status(500).json({ error: 'Failed to update resume' });
    }
};

export const getUserResumes = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user!.userId;
        const resumes = await resumeService.getResumesByUser(userId);
        res.json(resumes);
    } catch (error) {
        logError(error as Error, { context: 'getUserResumes' });
        res.status(500).json({ error: 'Failed to fetch user resumes' });
    }
};

export const deleteResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;

        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }
        if (resume.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        await resumeService.deleteResume(id as string);
        res.status(204).send();
    } catch (error) {
        logError(error as Error, { context: 'deleteResume' });
        res.status(500).json({ error: 'Failed to delete resume' });
    }
};

export const createVersion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;
        const { content } = req.body;

        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }
        if (resume.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        await resumeService.createVersion(id as string, content);
        res.status(201).json({ message: 'Version saved' });
    } catch (error) {
        logError(error as Error, { context: 'createVersion' });
        res.status(500).json({ error: 'Failed to save version' });
    }
};

export const getResumeVersions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;

        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }
        if (resume.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const versions = await resumeService.getResumeVersions(id as string);
        res.json(versions);
    } catch (error) {
        logError(error as Error, { context: 'getResumeVersions' });
        res.status(500).json({ error: 'Failed to fetch versions' });
    }
};

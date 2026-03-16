import { Request, Response } from 'express';
import * as resumeService from '../services/resume.service';
import type { AuthRequest } from '../middleware/auth.middleware';
import { logError } from '../utils/logger';
import { sendError, sendMessage } from '../utils/http';

export const createResume = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user!.userId;
        const { title, content } = req.body;
        const resume = await resumeService.createResume(userId, title, content);
        res.status(201).json(resume);
    } catch (error) {
        logError(error as Error, { context: 'createResume' });
        sendError(res, 500, 'RESUME_CREATE_FAILED', 'Failed to create resume');
    }
};

export const getResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;
        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            sendError(res, 404, 'RESUME_NOT_FOUND', 'Resume not found');
            return;
        }
        if (resume.userId !== userId) {
            sendError(res, 403, 'ACCESS_DENIED', 'Access denied');
            return;
        }
        res.json(resume);
    } catch (error) {
        logError(error as Error, { context: 'getResume' });
        sendError(res, 500, 'RESUME_FETCH_FAILED', 'Failed to fetch resume');
    }
};

export const updateResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;
        const data = req.body;

        const currentResume = await resumeService.getResumeById(id as string);
        if (!currentResume) {
            sendError(res, 404, 'RESUME_NOT_FOUND', 'Resume not found');
            return;
        }
        if (currentResume.userId !== userId) {
            sendError(res, 403, 'ACCESS_DENIED', 'Access denied');
            return;
        }

        const templateId = data.content?.meta?.templateId;
        if (templateId) {
            try {
                await resumeService.assertTemplateAccess(userId, templateId);
            } catch (error) {
                if (error instanceof Error && error.name === 'PREMIUM_TEMPLATE_REQUIRED') {
                    sendError(res, 403, 'PREMIUM_TEMPLATE_REQUIRED', error.message);
                    return;
                }
                throw error;
            }
        }

        // Handle Public/Share Key logic
        if (data.isPublic === true && !currentResume.shareKey) {
            data.shareKey = resumeService.createShareKey();
        }

        const resume = await resumeService.updateResumeWithVersion(
            id as string,
            currentResume.content,
            data
        );
        res.json(resume);
    } catch (error) {
        logError(error as Error, { context: 'updateResume' });
        sendError(res, 500, 'RESUME_UPDATE_FAILED', 'Failed to update resume');
    }
};

export const getUserResumes = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user!.userId;
        const resumes = await resumeService.getResumesByUser(userId);
        res.json(resumes);
    } catch (error) {
        logError(error as Error, { context: 'getUserResumes' });
        sendError(res, 500, 'USER_RESUMES_FETCH_FAILED', 'Failed to fetch user resumes');
    }
};

export const deleteResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;

        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            sendError(res, 404, 'RESUME_NOT_FOUND', 'Resume not found');
            return;
        }
        if (resume.userId !== userId) {
            sendError(res, 403, 'ACCESS_DENIED', 'Access denied');
            return;
        }

        await resumeService.deleteResume(id as string);
        res.status(204).send();
    } catch (error) {
        logError(error as Error, { context: 'deleteResume' });
        sendError(res, 500, 'RESUME_DELETE_FAILED', 'Failed to delete resume');
    }
};

export const createVersion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;
        const { content } = req.body;

        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            sendError(res, 404, 'RESUME_NOT_FOUND', 'Resume not found');
            return;
        }
        if (resume.userId !== userId) {
            sendError(res, 403, 'ACCESS_DENIED', 'Access denied');
            return;
        }

        await resumeService.createVersion(id as string, content);
        sendMessage(res, 201, 'Version saved');
    } catch (error) {
        logError(error as Error, { context: 'createVersion' });
        sendError(res, 500, 'RESUME_VERSION_CREATE_FAILED', 'Failed to save version');
    }
};

export const getResumeVersions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user!.userId;

        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            sendError(res, 404, 'RESUME_NOT_FOUND', 'Resume not found');
            return;
        }
        if (resume.userId !== userId) {
            sendError(res, 403, 'ACCESS_DENIED', 'Access denied');
            return;
        }

        const versions = await resumeService.getResumeVersions(id as string);
        res.json(versions);
    } catch (error) {
        logError(error as Error, { context: 'getResumeVersions' });
        sendError(res, 500, 'RESUME_VERSIONS_FETCH_FAILED', 'Failed to fetch versions');
    }
};

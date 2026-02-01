import { Request, Response } from 'express';
import * as resumeService from '../services/resume.service';

export const createResume = async (req: Request, res: Response) => {
    try {
        const { userId, title, content } = req.body;
        // TODO: userId should come from auth middleware
        const resume = await resumeService.createResume(userId, title, content);
        res.status(201).json(resume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create resume' });
    }
};

export const getResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const resume = await resumeService.getResumeById(id as string);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        res.json(resume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
};

export const updateResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Auto-versioning: Save current state as version before update
        const currentResume = await resumeService.getResumeById(id as string);
        if (currentResume) {
            await resumeService.createVersion(id as string, currentResume.content);

            // Handle Public/Share Key logic
            if (data.isPublic === true && !currentResume.shareKey) {
                // simple 10 char random string
                data.shareKey = Math.random().toString(36).substring(2, 12);
            }
        }

        const resume = await resumeService.updateResume(id as string, data);
        res.json(resume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update resume' });
    }
};

export const getUserResumes = async (req: Request, res: Response) => {
    try {
        // TODO: userId should come from auth middleware
        const { userId } = req.params; // or from auth
        const resumes = await resumeService.getResumesByUser(userId as string);
        res.json(resumes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user resumes' });
    }
};

export const deleteResume = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await resumeService.deleteResume(id as string);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete resume' });
    }
};

export const createVersion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content } = req.body; // Can optionally pass content, or fetch current
        // If content not passed, we could fetch it, but usually client sends current state
        await resumeService.createVersion(id as string, content);
        res.status(201).json({ message: 'Version saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save version' });
    }
};

export const getResumeVersions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const versions = await resumeService.getResumeVersions(id as string);
        res.json(versions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch versions' });
    }
};

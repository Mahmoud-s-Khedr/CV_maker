import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as jobService from '../services/job.service';
import { logError } from '../utils/logger';

// POST /api/jobs
export const create = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const job = await jobService.createJobApplication(user.userId, req.body);
        res.status(201).json(job);
    } catch (error) {
        logError(error as Error, { context: 'createJobApplication' });
        res.status(500).json({ error: 'Failed to create job application' });
    }
};

// GET /api/jobs
export const list = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const { status } = req.query;
        const jobs = await jobService.getJobApplications(user.userId, status as string);
        res.json(jobs);
    } catch (error) {
        logError(error as Error, { context: 'listJobApplications' });
        res.status(500).json({ error: 'Failed to fetch job applications' });
    }
};

// GET /api/jobs/stats
export const stats = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const result = await jobService.getJobStats(user.userId);
        res.json(result);
    } catch (error) {
        logError(error as Error, { context: 'getJobStats' });
        res.status(500).json({ error: 'Failed to fetch job stats' });
    }
};

// GET /api/jobs/:id
export const get = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const job = await jobService.getJobApplicationById(req.params.id as string);
        if (!job || job.userId !== user.userId) {
            res.status(404).json({ error: 'Job application not found' });
            return;
        }
        res.json(job);
    } catch (error) {
        logError(error as Error, { context: 'getJobApplication' });
        res.status(500).json({ error: 'Failed to fetch job application' });
    }
};

// PATCH /api/jobs/:id
export const update = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const existing = await jobService.getJobApplicationById(req.params.id as string);
        if (!existing || existing.userId !== user.userId) {
            res.status(404).json({ error: 'Job application not found' });
            return;
        }
        const job = await jobService.updateJobApplication(req.params.id as string, req.body);
        res.json(job);
    } catch (error) {
        logError(error as Error, { context: 'updateJobApplication' });
        res.status(500).json({ error: 'Failed to update job application' });
    }
};

// DELETE /api/jobs/:id
export const remove = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const existing = await jobService.getJobApplicationById(req.params.id as string);
        if (!existing || existing.userId !== user.userId) {
            res.status(404).json({ error: 'Job application not found' });
            return;
        }
        await jobService.deleteJobApplication(req.params.id as string);
        res.json({ message: 'Job application deleted' });
    } catch (error) {
        logError(error as Error, { context: 'deleteJobApplication' });
        res.status(500).json({ error: 'Failed to delete job application' });
    }
};

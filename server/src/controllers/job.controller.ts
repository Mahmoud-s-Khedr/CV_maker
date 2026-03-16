import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as jobService from '../services/job.service';
import { logError } from '../utils/logger';
import { sendError, sendMessage } from '../utils/http';

// POST /api/jobs
export const create = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const job = await jobService.createJobApplication(user.userId, req.body);
        res.status(201).json(job);
    } catch (error) {
        logError(error as Error, { context: 'createJobApplication' });
        sendError(res, 500, 'JOB_CREATE_FAILED', 'Failed to create job application');
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
        sendError(res, 500, 'JOB_LIST_FAILED', 'Failed to fetch job applications');
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
        sendError(res, 500, 'JOB_STATS_FETCH_FAILED', 'Failed to fetch job stats');
    }
};

// GET /api/jobs/:id
export const get = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const job = await jobService.getJobApplicationById(req.params.id as string);
        if (!job || job.userId !== user.userId) {
            sendError(res, 404, 'JOB_NOT_FOUND', 'Job application not found');
            return;
        }
        res.json(job);
    } catch (error) {
        logError(error as Error, { context: 'getJobApplication' });
        sendError(res, 500, 'JOB_FETCH_FAILED', 'Failed to fetch job application');
    }
};

// PATCH /api/jobs/:id
export const update = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const existing = await jobService.getJobApplicationById(req.params.id as string);
        if (!existing || existing.userId !== user.userId) {
            sendError(res, 404, 'JOB_NOT_FOUND', 'Job application not found');
            return;
        }
        const job = await jobService.updateJobApplication(req.params.id as string, req.body);
        res.json(job);
    } catch (error) {
        logError(error as Error, { context: 'updateJobApplication' });
        sendError(res, 500, 'JOB_UPDATE_FAILED', 'Failed to update job application');
    }
};

// DELETE /api/jobs/:id
export const remove = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const existing = await jobService.getJobApplicationById(req.params.id as string);
        if (!existing || existing.userId !== user.userId) {
            sendError(res, 404, 'JOB_NOT_FOUND', 'Job application not found');
            return;
        }
        await jobService.deleteJobApplication(req.params.id as string);
        sendMessage(res, 200, 'Job application deleted');
    } catch (error) {
        logError(error as Error, { context: 'deleteJobApplication' });
        sendError(res, 500, 'JOB_DELETE_FAILED', 'Failed to delete job application');
    }
};

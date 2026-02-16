import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { logError, logInfo } from '../utils/logger';

// POST /api/resumes/:id/review-sessions — Create a review session
export const createSession = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const resumeId = req.params.id as string;
        const { expiresInDays = 7 } = req.body;

        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId: user.userId },
        });
        if (!resume) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }

        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
        const token = crypto.randomBytes(16).toString('hex');

        const session = await prisma.reviewSession.create({
            data: { resumeId, token, expiresAt },
        });

        logInfo('Review session created', { resumeId, sessionId: session.id });
        res.status(201).json({
            id: session.id,
            token: session.token,
            expiresAt: session.expiresAt,
        });
    } catch (error) {
        logError(error as Error, { context: 'createReviewSession' });
        res.status(500).json({ error: 'Failed to create review session' });
    }
};

// GET /api/resumes/:id/review-sessions — List sessions for a resume
export const getSessions = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const resumeId = req.params.id as string;

        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId: user.userId },
        });
        if (!resume) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }

        const sessions = await prisma.reviewSession.findMany({
            where: { resumeId },
            orderBy: { createdAt: 'desc' },
        });

        const result = sessions.map((s) => {
            const comments = Array.isArray(s.comments) ? s.comments : [];
            const unresolvedCount = (comments as any[]).filter((c) => !c.resolved).length;
            return {
                id: s.id,
                token: s.token,
                expiresAt: s.expiresAt,
                createdAt: s.createdAt,
                commentCount: comments.length,
                unresolvedCount,
                isExpired: s.expiresAt < new Date(),
            };
        });

        res.json(result);
    } catch (error) {
        logError(error as Error, { context: 'getReviewSessions' });
        res.status(500).json({ error: 'Failed to fetch review sessions' });
    }
};

// DELETE /api/review-sessions/:sessionId — Delete a review session
export const deleteSession = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const sessionId = req.params.sessionId as string;

        const session = await prisma.reviewSession.findUnique({
            where: { id: sessionId },
            include: { resume: { select: { userId: true } } },
        });

        if (!session || session.resume.userId !== user.userId) {
            res.status(404).json({ error: 'Review session not found' });
            return;
        }

        await prisma.reviewSession.delete({ where: { id: sessionId } });
        res.json({ message: 'Review session deleted' });
    } catch (error) {
        logError(error as Error, { context: 'deleteReviewSession' });
        res.status(500).json({ error: 'Failed to delete review session' });
    }
};

// PATCH /api/resumes/:id/review-sessions/:sessionId/comments/:commentId — Resolve a comment
export const resolveComment = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const resumeId = req.params.id as string;
        const sessionId = req.params.sessionId as string;
        const commentId = req.params.commentId as string;

        const session = await prisma.reviewSession.findFirst({
            where: { id: sessionId, resumeId },
            include: { resume: { select: { userId: true } } },
        });

        if (!session || session.resume.userId !== user.userId) {
            res.status(404).json({ error: 'Review session not found' });
            return;
        }

        const comments = (Array.isArray(session.comments) ? session.comments : []) as any[];
        const commentIndex = comments.findIndex((c: any) => c.id === commentId);
        if (commentIndex === -1) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        comments[commentIndex].resolved = true;

        await prisma.reviewSession.update({
            where: { id: sessionId },
            data: { comments },
        });

        res.json({ message: 'Comment resolved' });
    } catch (error) {
        logError(error as Error, { context: 'resolveComment' });
        res.status(500).json({ error: 'Failed to resolve comment' });
    }
};

// GET /api/review/:token — Public: get review session for reviewer
export const getReviewSession = async (req: Request, res: Response) => {
    try {
        const token = req.params.token as string;

        const session = await prisma.reviewSession.findUnique({
            where: { token },
            include: {
                resume: { select: { content: true, title: true } },
            },
        });

        if (!session) {
            res.status(404).json({ error: 'Review session not found' });
            return;
        }

        if (session.expiresAt < new Date()) {
            res.status(410).json({ error: 'This review link has expired' });
            return;
        }

        res.json({
            id: session.id,
            resumeTitle: session.resume.title,
            resumeContent: session.resume.content,
            comments: session.comments,
            expiresAt: session.expiresAt,
        });
    } catch (error) {
        logError(error as Error, { context: 'getReviewSession' });
        res.status(500).json({ error: 'Failed to fetch review session' });
    }
};

// POST /api/review/:token/comments — Public: add a comment
export const addComment = async (req: Request, res: Response) => {
    try {
        const token = req.params.token as string;
        const { sectionId, text, reviewerName } = req.body;

        const session = await prisma.reviewSession.findUnique({ where: { token } });

        if (!session) {
            res.status(404).json({ error: 'Review session not found' });
            return;
        }

        if (session.expiresAt < new Date()) {
            res.status(410).json({ error: 'This review link has expired' });
            return;
        }

        const comments = (Array.isArray(session.comments) ? session.comments : []) as any[];
        const newComment = {
            id: crypto.randomUUID(),
            sectionId,
            text,
            reviewerName,
            createdAt: new Date().toISOString(),
            resolved: false,
        };
        comments.push(newComment);

        await prisma.reviewSession.update({
            where: { token },
            data: { comments },
        });

        res.status(201).json(newComment);
    } catch (error) {
        logError(error as Error, { context: 'addReviewComment' });
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

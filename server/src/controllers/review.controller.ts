import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { logError, logInfo } from '../utils/logger';
import { sendError, sendMessage } from '../utils/http';

interface ReviewComment {
    id: string;
    sectionId: string;
    text: string;
    reviewerName: string;
    createdAt: string;
    resolved: boolean;
}

const getReviewComments = (comments: unknown): ReviewComment[] => {
    return Array.isArray(comments) ? (comments as ReviewComment[]) : [];
};

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
            sendError(res, 404, 'RESUME_NOT_FOUND', 'Resume not found');
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
        sendError(res, 500, 'REVIEW_SESSION_CREATE_FAILED', 'Failed to create review session');
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
            sendError(res, 404, 'RESUME_NOT_FOUND', 'Resume not found');
            return;
        }

        const sessions = await prisma.reviewSession.findMany({
            where: { resumeId },
            orderBy: { createdAt: 'desc' },
        });

        const result = sessions.map((s: (typeof sessions)[number]) => {
            const comments = getReviewComments(s.comments);
            const unresolvedCount = comments.filter((comment) => !comment.resolved).length;
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
        sendError(res, 500, 'REVIEW_SESSIONS_FETCH_FAILED', 'Failed to fetch review sessions');
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
            sendError(res, 404, 'REVIEW_SESSION_NOT_FOUND', 'Review session not found');
            return;
        }

        await prisma.reviewSession.delete({ where: { id: sessionId } });
        sendMessage(res, 200, 'Review session deleted');
    } catch (error) {
        logError(error as Error, { context: 'deleteReviewSession' });
        sendError(res, 500, 'REVIEW_SESSION_DELETE_FAILED', 'Failed to delete review session');
    }
};

// PATCH /api/resumes/:id/review-sessions/:sessionId/comments/:commentId — Resolve a comment
export const resolveComment = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        const resumeId = req.params.id as string;
        const sessionId = req.params.sessionId as string;
        const commentId = req.params.commentId as string;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            const session = await prisma.reviewSession.findFirst({
                where: { id: sessionId, resumeId },
                include: { resume: { select: { userId: true } } },
            });

            if (!session || session.resume.userId !== user.userId) {
                sendError(res, 404, 'REVIEW_SESSION_NOT_FOUND', 'Review session not found');
                return;
            }

            const comments = getReviewComments(session.comments);
            const commentIndex = comments.findIndex((comment) => comment.id === commentId);
            if (commentIndex === -1) {
                sendError(res, 404, 'REVIEW_COMMENT_NOT_FOUND', 'Comment not found');
                return;
            }

            if (comments[commentIndex].resolved) {
                sendMessage(res, 200, 'Comment resolved');
                return;
            }

            const nextComments = comments.map((comment) => (
                comment.id === commentId ? { ...comment, resolved: true } : comment
            ));

            const updateResult = await prisma.reviewSession.updateMany({
                where: {
                    id: sessionId,
                    updatedAt: session.updatedAt,
                },
                data: { comments: nextComments as any },
            });

            if (updateResult.count === 1) {
                sendMessage(res, 200, 'Comment resolved');
                return;
            }
        }

        sendError(res, 409, 'REVIEW_COMMENT_CONFLICT', 'Comment was updated by another request. Please try again.');
    } catch (error) {
        logError(error as Error, { context: 'resolveComment' });
        sendError(res, 500, 'REVIEW_COMMENT_RESOLVE_FAILED', 'Failed to resolve comment');
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
            sendError(res, 404, 'REVIEW_SESSION_NOT_FOUND', 'Review session not found');
            return;
        }

        if (session.expiresAt < new Date()) {
            sendError(res, 410, 'REVIEW_SESSION_EXPIRED', 'This review link has expired');
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
        sendError(res, 500, 'REVIEW_SESSION_FETCH_FAILED', 'Failed to fetch review session');
    }
};

// POST /api/review/:token/comments — Public: add a comment
export const addComment = async (req: Request, res: Response) => {
    try {
        const token = req.params.token as string;
        const { sectionId, text, reviewerName } = req.body;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            const session = await prisma.reviewSession.findUnique({ where: { token } });

            if (!session) {
                sendError(res, 404, 'REVIEW_SESSION_NOT_FOUND', 'Review session not found');
                return;
            }

            if (session.expiresAt < new Date()) {
                sendError(res, 410, 'REVIEW_SESSION_EXPIRED', 'This review link has expired');
                return;
            }

            const newComment: ReviewComment = {
                id: crypto.randomUUID(),
                sectionId,
                text,
                reviewerName,
                createdAt: new Date().toISOString(),
                resolved: false,
            };
            const comments = [...getReviewComments(session.comments), newComment];

            const updateResult = await prisma.reviewSession.updateMany({
                where: {
                    id: session.id,
                    updatedAt: session.updatedAt,
                },
                data: { comments: comments as any },
            });

            if (updateResult.count === 1) {
                res.status(201).json(newComment);
                return;
            }
        }

        sendError(res, 409, 'REVIEW_COMMENT_CONFLICT', 'Review session was updated by another request. Please try again.');
    } catch (error) {
        logError(error as Error, { context: 'addReviewComment' });
        sendError(res, 500, 'REVIEW_COMMENT_ADD_FAILED', 'Failed to add comment');
    }
};

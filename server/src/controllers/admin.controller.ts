import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import logger, { logError } from '../utils/logger';
import { parsePaginationValue, parsePositiveInt, isUuid } from '../utils/request';
import { sendError, sendMessage } from '../utils/http';

// Helper to log administrative actions (AuditLog is a generated Prisma model)
const createAuditLog = async (adminId: string, action: string, details?: any) => {
    try {
        await prisma.auditLog.create({
            data: {
                adminId,
                action,
                details: details || {}
            }
        });
    } catch (error) {
        logError(error as Error, { context: 'createAuditLog' });
    }
};

// GET /api/admin/users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = parsePaginationValue(req.query.limit, 20);
        const skip = (page - 1) * limit;

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isPremium: true,
                    googleId: true,
                    createdAt: true,
                    isEmailVerified: true
                }
            }),
            prisma.user.count()
        ]);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logError(error as Error, { context: 'admin.getUsers' });
        sendError(res, 500, 'ADMIN_USERS_FETCH_FAILED', 'Failed to fetch users');
    }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const adminId = (req as any).user.userId;

        if (!isUuid(id)) {
            sendError(res, 400, 'INVALID_USER_ID', 'User ID must be a valid UUID');
            return;
        }

        // Prevent self-deletion
        if (id === adminId) {
            sendError(res, 400, 'SELF_DELETE_FORBIDDEN', 'Cannot delete your own account');
            return;
        }

        const user = await prisma.user.delete({
            where: { id }
        });

        await createAuditLog(adminId, 'USER_DELETE', { deletedUserId: id, email: user.email });

        sendMessage(res, 200, 'User deleted successfully');

    } catch (error) {
        logError(error as Error, { context: 'admin.deleteUser' });
        sendError(res, 500, 'ADMIN_DELETE_USER_FAILED', 'Failed to delete user');
    }
};

// GET /api/admin/logs
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = parsePaginationValue(req.query.limit, 50);
        const skip = (page - 1) * limit;

        const [logs, total] = await prisma.$transaction([
            prisma.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    admin: {
                        select: { email: true }
                    }
                }
            }),
            prisma.auditLog.count()
        ]);

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logError(error as Error, { context: 'admin.getAuditLogs' });
        sendError(res, 500, 'ADMIN_AUDIT_LOGS_FETCH_FAILED', 'Failed to fetch audit logs');
    }
};

// POST /api/admin/templates (Foundation for Phase 2)
export const createTemplate = async (req: Request, res: Response) => {
    try {
        const { name, config, isPremium, thumbnailUrl } = req.body;
        const adminId = (req as any).user.userId;

        const template = await prisma.template.create({
            data: {
                name,
                config,
                isPremium: isPremium || false,
                thumbnailUrl
            }
        });

        await createAuditLog(adminId, 'TEMPLATE_CREATE', { templateId: template.id, name });

        res.json(template);

    } catch (error) {
        logError(error as Error, { context: 'admin.createTemplate' });
        sendError(res, 500, 'ADMIN_CREATE_TEMPLATE_FAILED', 'Failed to create template');
    }
};

// PUT /api/admin/templates/:id
export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const adminId = (req as any).user.userId;
        const { name, config, isPremium, thumbnailUrl } = req.body;

        if (!isUuid(id)) {
            sendError(res, 400, 'INVALID_TEMPLATE_ID', 'Template ID must be a valid UUID');
            return;
        }

        const template = await prisma.template.update({
            where: { id },
            data: { name, config, isPremium: isPremium ?? false, thumbnailUrl },
        });

        await createAuditLog(adminId, 'TEMPLATE_UPDATE', { templateId: id, name });

        res.json(template);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            sendError(res, 404, 'TEMPLATE_NOT_FOUND', 'Template not found');
            return;
        }
        logError(error as Error, { context: 'admin.updateTemplate' });
        sendError(res, 500, 'ADMIN_UPDATE_TEMPLATE_FAILED', 'Failed to update template');
    }
};

// DELETE /api/admin/templates/:id
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const adminId = (req as any).user.userId;

        if (!isUuid(id)) {
            sendError(res, 400, 'INVALID_TEMPLATE_ID', 'Template ID must be a valid UUID');
            return;
        }

        const template = await prisma.template.delete({
            where: { id },
        });

        await createAuditLog(adminId, 'TEMPLATE_DELETE', { templateId: id, name: template.name });

        sendMessage(res, 200, 'Template deleted successfully');
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            sendError(res, 404, 'TEMPLATE_NOT_FOUND', 'Template not found');
            return;
        }
        logError(error as Error, { context: 'admin.deleteTemplate' });
        sendError(res, 500, 'ADMIN_DELETE_TEMPLATE_FAILED', 'Failed to delete template');
    }
};

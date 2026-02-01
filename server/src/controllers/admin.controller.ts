import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger, { logError } from '../utils/logger';

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
        // Simple pagination
        const page = parseInt(req.query.page as unknown as string) || 1;
        const limit = parseInt(req.query.limit as unknown as string) || 20;
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
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const adminId = (req as any).user.userId;

        // Prevent self-deletion
        if (id === adminId) {
            res.status(400).json({ error: 'Cannot delete your own account' });
            return;
        }

        const user = await prisma.user.delete({
            where: { id }
        });

        await createAuditLog(adminId, 'USER_DELETE', { deletedUserId: id, email: user.email });

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        logError(error as Error, { context: 'admin.deleteUser' });
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// GET /api/admin/logs
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as unknown as string) || 1;
        const limit = parseInt(req.query.limit as unknown as string) || 50;
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
        res.status(500).json({ error: 'Failed to fetch audit logs' });
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
        res.status(500).json({ error: 'Failed to create template' });
    }
};

// DELETE /api/admin/templates/:id
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const adminId = (req as any).user.userId;

        const template = await prisma.template.delete({
            where: { id },
        });

        await createAuditLog(adminId, 'TEMPLATE_DELETE', { templateId: id, name: template.name });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        logError(error as Error, { context: 'admin.deleteTemplate' });
        res.status(500).json({ error: 'Failed to delete template' });
    }
};

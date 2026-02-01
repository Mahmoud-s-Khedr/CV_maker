import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logError } from '../utils/logger';

// GET /api/templates
export const getTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await prisma.template.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                thumbnailUrl: true,
                isPremium: true,
                // We don't need the full config for the list view
            }
        });
        res.json(templates);
    } catch (error) {
        logError(error as Error, { context: 'getTemplates' });
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

// GET /api/templates/:id
export const getTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const template = await prisma.template.findUnique({
            where: { id }
        });

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        res.json(template);
    } catch (error) {
        logError(error as Error, { context: 'getTemplate' });
        res.status(500).json({ error: 'Failed to fetch template' });
    }
};

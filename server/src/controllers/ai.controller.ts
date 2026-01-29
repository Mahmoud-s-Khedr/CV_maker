import { Request, Response } from 'express';
import * as aiService from '../services/ai.service';
import { logError } from '../utils/logger';

export const analyzeResume = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Resume content is required' });
        }

        const analysis = await aiService.analyzeResume(content);
        res.json(analysis);

    } catch (error) {
        logError(error as Error, { controller: 'ai', action: 'analyzeResume' });
        res.status(500).json({ error: 'Failed to generate analysis' });
    }
};

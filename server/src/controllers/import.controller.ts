import { Request, Response } from 'express';
import * as pdfParserService from '../services/pdf-parser.service';
import * as aiService from '../services/ai.service';

export const importLinkedInPDF = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const buffer = req.file.buffer;
        const text = await pdfParserService.parseResumePDF(buffer);

        // Use AI to extract structured data
        const profileData = await aiService.parseResumeText(text);

        res.json({
            success: true,
            data: {
                profile: profileData,
                fullText: text
            }
        });

    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
};

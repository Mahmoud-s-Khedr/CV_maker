import { Request, Response } from 'express';
import * as pdfParserService from '../services/pdf-parser.service';
import * as aiService from '../services/ai.service';
import * as githubService from '../services/github.service';

export const importLinkedInPDF = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const buffer = req.file.buffer;
        const text = await pdfParserService.parseResumePDF(buffer);

        // Prefer AI extraction (best quality), but fall back to heuristic extraction
        // so import still works when OPENROUTER_API_KEY is not configured.
        let profileData: any;
        let parser: 'ai' | 'heuristic' = 'heuristic';
        try {
            if (process.env.OPENROUTER_API_KEY) {
                profileData = await aiService.parseResumeText(text);
                parser = 'ai';
            } else {
                profileData = pdfParserService.extractProfileData(text);
            }
        } catch (e) {
            profileData = pdfParserService.extractProfileData(text);
        }

        res.json({
            success: true,
            data: {
                profile: profileData,
                fullText: text,
                parser,
            }
        });

    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
};

export const importGitHubRepos = async (req: Request, res: Response) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'GitHub username is required' });
        }

        const projects = await githubService.fetchUserRepos(username);

        res.json({
            success: true,
            data: projects
        });
    } catch (error: any) {
        console.error('GitHub Import Error:', error);
        res.status(500).json({ error: error.message || 'Failed to import projects' });
    }
};

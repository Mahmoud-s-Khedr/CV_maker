import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logError } from '../utils/logger';
import { notifyResumeViewed } from '../services/notification.service';

// GET /api/recruiter/search
// Search public resumes by query (matches job title, skills, or location in content)
export const searchResumes = async (req: Request, res: Response) => {
    try {
        const { q, page = '1', limit = '10' } = req.query;
        const searchQuery = (q as string) || '';
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const normalizedLimit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10;
        const normalizedPage = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
        const normalizedSkip = (normalizedPage - 1) * normalizedLimit;

        // We want recruiter search to work across *all* public CV data.
        // Prisma JSON deep-search is limited, so for Postgres we safely query `content::text`.
        // If needed later, we can add proper FTS (tsvector + GIN) for performance.
        const search = searchQuery.trim();
        const pattern = `%${search}%`;

        let rows: Array<{ id: string; shareKey: string | null; title: string; content: any; updatedAt: Date; userEmail: string }> = [];
        let total = 0;

        if (search.length > 0) {
            const [resultRows, countRows] = await Promise.all([
                prisma.$queryRaw<Array<any>>`
                    SELECT r.id,
                           r."shareKey",
                           r.title,
                           r.content,
                           r."updatedAt",
                           u.email AS "userEmail"
                    FROM "Resume" r
                    JOIN "User" u ON u.id = r."userId"
                    WHERE r."isPublic" = true
                      AND (r.title ILIKE ${pattern} OR r.content::text ILIKE ${pattern})
                    ORDER BY r."updatedAt" DESC
                    LIMIT ${normalizedLimit} OFFSET ${normalizedSkip}
                `,
                prisma.$queryRaw<Array<{ count: number }>>`
                    SELECT COUNT(*)::int AS count
                    FROM "Resume" r
                    WHERE r."isPublic" = true
                      AND (r.title ILIKE ${pattern} OR r.content::text ILIKE ${pattern})
                `,
            ]);

            rows = resultRows;
            total = countRows?.[0]?.count ?? 0;
        } else {
            const [resumes, count] = await Promise.all([
                prisma.resume.findMany({
                    where: { isPublic: true },
                    skip: normalizedSkip,
                    take: normalizedLimit,
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                }),
                prisma.resume.count({ where: { isPublic: true } }),
            ]);

            rows = resumes.map((r) => ({
                id: r.id,
                shareKey: r.shareKey,
                title: r.title,
                content: r.content,
                updatedAt: r.updatedAt,
                userEmail: r.user.email,
            }));
            total = count;
        }

        const results = rows.map((r) => {
            const content: any = r.content;
            const profile = content?.profile || {};
            return {
                id: r.id,
                shareKey: r.shareKey,
                title: r.title,
                fullName: profile.fullName || 'Anonymous',
                jobTitle: profile.jobTitle || 'Job Seeker',
                location: profile.location || '',
                summary: profile.summary ? String(profile.summary).substring(0, 150) + '...' : '',
                updatedAt: r.updatedAt,
                userEmail: r.userEmail,
            };
        });

        res.json({
            resumes: results,
            pagination: {
                page: normalizedPage,
                limit: normalizedLimit,
                total,
                pages: Math.ceil(total / normalizedLimit)
            }
        });
    } catch (error) {
        logError(error as Error, { context: 'searchResumes' });
        res.status(500).json({ error: 'Failed to search resumes' });
    }
};

// GET /api/recruiter/public/:shareKey
// Fetch a single public resume by its unique share key (Accessible by anyone)
export const getPublicResume = async (req: Request, res: Response) => {
    try {
        const { shareKey } = req.params as { shareKey: string };

        if (!shareKey) {
            res.status(400).json({ error: 'Share key is required' });
            return;
        }

        // `findUnique` only supports unique fields; we also need to enforce `isPublic=true`.
        const resume = await prisma.resume.findFirst({
            where: {
                shareKey,
                isPublic: true,
            },
        });

        if (!resume) {
            res.status(404).json({ error: 'Resume not found or is private' });
            return;
        }

        // Increment view count (fire-and-forget)
        prisma.resume.update({
            where: { id: resume.id },
            data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
        }).catch(() => {});

        // Notify resume owner (fire-and-forget)
        notifyResumeViewed(resume.id, resume.viewCount + 1).catch(() => {});

        // Return the full content for rendering
        res.json(resume);

    } catch (error) {
        logError(error as Error, { context: 'getPublicResume' });
        res.status(500).json({ error: 'Failed to fetch public resume' });
    }
};

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logError } from '../utils/logger';
import { notifyResumeViewed } from '../services/notification.service';
import { parsePaginationValue, parsePositiveInt } from '../utils/request';
import { sendError } from '../utils/http';
import { startOfUtcDay } from '../utils/dates';

// GET /api/recruiter/search
// Search public resumes by query (matches job title, skills, or location in content)
export const searchResumes = async (req: Request, res: Response) => {
    try {
        const { q, page = '1', limit = '10' } = req.query;
        const searchQuery = (q as string) || '';
        const normalizedPage = parsePositiveInt(page, 1);
        const normalizedLimit = parsePaginationValue(limit, 10);
        const normalizedSkip = (normalizedPage - 1) * normalizedLimit;

        // We want recruiter search to work across *all* public CV data.
        // Prisma JSON deep-search is limited, so for Postgres we safely query `content::text`.
        // If needed later, we can add proper FTS (tsvector + GIN) for performance.
        const search = searchQuery.trim();
        const pattern = `%${search}%`;

        let rows: Array<{ id: string; shareKey: string | null; title: string; content: any; updatedAt: Date }> = [];
        let total = 0;

        if (search.length > 0) {
            const [resultRows, countRows] = await Promise.all([
                prisma.$queryRaw<Array<any>>`
                    SELECT r.id,
                           r."shareKey",
                           r.title,
                           r.content,
                           r."updatedAt"
                    FROM "Resume" r
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
                }),
                prisma.resume.count({ where: { isPublic: true } }),
            ]);

            rows = resumes.map((r: (typeof resumes)[number]) => ({
                id: r.id,
                shareKey: r.shareKey,
                title: r.title,
                content: r.content,
                updatedAt: r.updatedAt,
            }));
            total = count;
        }

        const results = rows.map((r) => {
            const content: any = r.content;
            const profile = content?.profile || {};
            const summary = String(profile.summary || '');
            return {
                id: r.id,
                shareKey: r.shareKey,
                title: r.title,
                fullName: profile.fullName || 'Anonymous',
                jobTitle: profile.jobTitle || 'Job Seeker',
                location: profile.location || '',
                summary: summary.length > 150 ? `${summary.substring(0, 150)}...` : summary,
                updatedAt: r.updatedAt,
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
        sendError(res, 500, 'RECRUITER_SEARCH_FAILED', 'Failed to search resumes');
    }
};

// GET /api/recruiter/public/:shareKey
// Fetch a single public resume by its unique share key (Accessible by anyone)
export const getPublicResume = async (req: Request, res: Response) => {
    try {
        const { shareKey } = req.params as { shareKey: string };

        if (!shareKey) {
            sendError(res, 400, 'SHARE_KEY_REQUIRED', 'Share key is required');
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
            sendError(res, 404, 'PUBLIC_RESUME_NOT_FOUND', 'Resume not found or is private');
            return;
        }

        const viewedAt = new Date();
        const updatedResume = await prisma.$transaction(async (tx) => {
            const nextResume = await tx.resume.update({
                where: { id: resume.id },
                data: { viewCount: { increment: 1 }, lastViewedAt: viewedAt },
            });

            await tx.resumeDailyViewStat.upsert({
                where: {
                    resumeId_day: {
                        resumeId: resume.id,
                        day: startOfUtcDay(viewedAt),
                    },
                },
                update: {
                    viewCount: { increment: 1 },
                },
                create: {
                    resumeId: resume.id,
                    day: startOfUtcDay(viewedAt),
                    viewCount: 1,
                },
            });

            return nextResume;
        });

        // Notify resume owner (fire-and-forget)
        notifyResumeViewed(resume.id, updatedResume.viewCount).catch((error: unknown) => {
            logError(error as Error, { context: 'notifyResumeViewed', resumeId: resume.id });
        });

        // Return the full content for rendering
        res.json(resume);

    } catch (error) {
        logError(error as Error, { context: 'getPublicResume' });
        sendError(res, 500, 'PUBLIC_RESUME_FETCH_FAILED', 'Failed to fetch public resume');
    }
};

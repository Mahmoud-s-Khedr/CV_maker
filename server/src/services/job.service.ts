import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createJobSchema, updateJobSchema } from '../validation/job.schemas';

type CreateJobInput = z.infer<typeof createJobSchema>;
type UpdateJobInput = z.infer<typeof updateJobSchema>;

const normalizeOptionalJobFields = <T extends { resumeId?: string | null; url?: string }>(data: T) => ({
    ...data,
    resumeId: data.resumeId === '' ? null : (data.resumeId ?? null),
    url: data.url?.trim() ? data.url : null,
});

export const createJobApplication = async (userId: string, data: CreateJobInput) => {
    const normalizedData = normalizeOptionalJobFields(data);

    return prisma.jobApplication.create({
        data: {
            userId,
            ...normalizedData,
            status: normalizedData.status || 'SAVED',
        },
        include: { resume: { select: { id: true, title: true } } },
    });
};

export const getJobApplications = async (userId: string, status?: string) => {
    return prisma.jobApplication.findMany({
        where: {
            userId,
            ...(status && status !== 'ALL' ? { status: status as any } : {}),
        },
        include: { resume: { select: { id: true, title: true } } },
        orderBy: { updatedAt: 'desc' },
    });
};

export const getJobApplicationById = async (id: string) => {
    return prisma.jobApplication.findUnique({
        where: { id },
        include: { resume: { select: { id: true, title: true } } },
    });
};

export const updateJobApplication = async (id: string, data: UpdateJobInput) => {
    const normalizedData = normalizeOptionalJobFields(data);

    return prisma.jobApplication.update({
        where: { id },
        data: normalizedData,
        include: { resume: { select: { id: true, title: true } } },
    });
};

export const deleteJobApplication = async (id: string) => {
    return prisma.jobApplication.delete({ where: { id } });
};

export const getJobStats = async (userId: string) => {
    const [total, grouped] = await Promise.all([
        prisma.jobApplication.count({ where: { userId } }),
        prisma.jobApplication.groupBy({
            by: ['status'],
            where: { userId },
            _count: true,
        }),
    ]);

    const byStatus: Record<string, number> = {
        SAVED: 0, APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0,
    };
    for (const g of grouped) {
        byStatus[g.status] = g._count;
    }

    return { total, byStatus };
};

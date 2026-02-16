import { prisma } from '../lib/prisma';

export const createJobApplication = async (userId: string, data: {
    jobTitle: string;
    company: string;
    url?: string;
    resumeId?: string;
    notes?: string;
    salary?: string;
    status?: string;
}) => {
    return prisma.jobApplication.create({
        data: {
            userId,
            ...data,
            status: (data.status as any) || 'SAVED',
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

export const updateJobApplication = async (id: string, data: Record<string, any>) => {
    return prisma.jobApplication.update({
        where: { id },
        data,
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

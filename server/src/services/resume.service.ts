import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const createResume = async (userId: string, title: string, content: any) => {
    return await prisma.resume.create({
        data: {
            userId,
            title,
            content,
        },
    });
};

export const getResumeById = async (id: string) => {
    return await prisma.resume.findUnique({
        where: { id },
    });
};

export const updateResume = async (id: string, data: Prisma.ResumeUpdateInput) => {
    return await prisma.resume.update({
        where: { id },
        data,
    });
};

export const updateResumeWithVersion = async (
    id: string,
    previousContent: Prisma.JsonValue,
    data: Prisma.ResumeUpdateInput,
    maxVersions = 20
) => {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.resumeVersion.create({
            data: {
                resumeId: id,
                content: previousContent === null
                    ? Prisma.JsonNull
                    : (previousContent as Prisma.InputJsonValue),
            },
        });

        const resume = await tx.resume.update({
            where: { id },
            data,
        });

        const count = await tx.resumeVersion.count({ where: { resumeId: id } });
        if (count > maxVersions) {
            const oldest = await tx.resumeVersion.findMany({
                where: { resumeId: id },
                orderBy: { createdAt: 'asc' },
                take: count - maxVersions,
                select: { id: true },
            });

            await tx.resumeVersion.deleteMany({
                where: { id: { in: oldest.map((version) => version.id) } },
            });
        }

        return resume;
    });
};

export const getResumesByUser = async (userId: string) => {
    return await prisma.resume.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });
};

export const deleteResume = async (id: string) => {
    return await prisma.resume.delete({
        where: { id },
    });
};

export const createVersion = async (resumeId: string, content: any) => {
    return await prisma.resumeVersion.create({
        data: {
            resumeId,
            content,
        },
    });
};

export const getResumeVersions = async (resumeId: string) => {
    return await prisma.resumeVersion.findMany({
        where: { resumeId },
        orderBy: { createdAt: 'desc' },
    });
};

export const getTemplateById = async (id: string) => {
    return await prisma.template.findUnique({
        where: { id },
        select: { id: true, isPremium: true },
    });
};

export const assertTemplateAccess = async (userId: string, templateId: string) => {
    const template = await getTemplateById(templateId);
    if (!template?.isPremium) {
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true },
    });

    if (!user?.isPremium) {
        const error = new Error('Premium template requires upgrade');
        error.name = 'PREMIUM_TEMPLATE_REQUIRED';
        throw error;
    }
};

export const createShareKey = () => {
    return crypto.randomBytes(24).toString('base64url');
};

export const pruneOldVersions = async (resumeId: string, maxVersions = 20) => {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const count = await tx.resumeVersion.count({ where: { resumeId } });
        if (count <= maxVersions) return;

        const oldest = await tx.resumeVersion.findMany({
            where: { resumeId },
            orderBy: { createdAt: 'asc' },
            take: count - maxVersions,
            select: { id: true },
        });

        await tx.resumeVersion.deleteMany({
            where: { id: { in: oldest.map((version: { id: string }) => version.id) } },
        });
    });
};

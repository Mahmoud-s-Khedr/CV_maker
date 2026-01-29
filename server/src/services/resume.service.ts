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

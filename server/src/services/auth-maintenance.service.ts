import { prisma } from '../lib/prisma';

export const purgeExpiredAuthArtifacts = async () => {
    const now = new Date();
    const staleTotpCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [expiredVerification, expiredReset, staleTotp] = await prisma.$transaction([
        prisma.user.updateMany({
            where: {
                verificationExpiry: { lt: now },
                verificationToken: { not: null },
            },
            data: {
                verificationToken: null,
                verificationExpiry: null,
            },
        }),
        prisma.user.updateMany({
            where: {
                resetExpiry: { lt: now },
                resetToken: { not: null },
            },
            data: {
                resetToken: null,
                resetExpiry: null,
            },
        }),
        prisma.user.updateMany({
            where: {
                twoFactorEnabled: false,
                totpSecret: { not: null },
                updatedAt: { lt: staleTotpCutoff },
            },
            data: {
                totpSecret: null,
            },
        }),
    ]);

    return {
        verificationTokensCleared: expiredVerification.count,
        resetTokensCleared: expiredReset.count,
        totpSecretsCleared: staleTotp.count,
    };
};

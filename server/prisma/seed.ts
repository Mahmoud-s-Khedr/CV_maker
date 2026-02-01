import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordRaw = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPasswordRaw) {
        throw new Error('❌ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env');
    }

    console.log(`🔑 Seeding Admin: ${adminEmail}`);

    const password = await bcrypt.hash(adminPasswordRaw, 10);

    // Create Admin Only
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password, // Update password if re-seeding
            role: 'ADMIN',
            isPremium: true,
            isEmailVerified: true
        },
        create: {
            email: adminEmail,
            password,
            role: 'ADMIN',
            isEmailVerified: true,
            isPremium: true,
        },
    });

    console.log(`✅ Admin user seeded successfully: ${admin.email}`);
    console.log('🚀 Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

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

    // Seed Templates
    console.log('🎨 Seeding templates...');

    const defaultSection = {
        titleStyle: { fontSize: 14, fontWeight: 'bold' as const, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 },
        itemStyle: {
            title: { fontSize: 12, fontWeight: 'bold' as const },
            subtitle: { fontSize: 11, fontWeight: 'normal' as const, fontStyle: 'italic' as const },
            date: { fontSize: 10, fontWeight: 'normal' as const, color: '#6B7280' },
            description: { fontSize: 10, fontWeight: 'normal' as const },
            marginBottom: 10,
        },
        layout: 'list' as const,
    };

    const templates = [
        {
            name: 'Classic',
            isPremium: false,
            config: {
                id: 'classic',
                layout: 'single-column',
                theme: { primaryColor: '#1F2937', secondaryColor: '#4B5563', backgroundColor: '#FFFFFF', textColor: '#111827', fontFamily: 'Times-Roman', fontSize: 11, lineHeight: 1.4, margins: { top: 40, right: 40, bottom: 40, left: 40 } },
                sections: { default: defaultSection },
                header: { layout: 'centered', name: { fontSize: 24, fontWeight: 'bold' }, title: { fontSize: 13, fontWeight: 'normal', color: '#4B5563' }, showPhoto: false },
            },
        },
        {
            name: 'Elegant',
            isPremium: false,
            config: {
                id: 'elegant',
                layout: 'single-column',
                theme: { primaryColor: '#7C3AED', secondaryColor: '#8B5CF6', backgroundColor: '#FFFFFF', textColor: '#1F2937', fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.5, margins: { top: 36, right: 36, bottom: 36, left: 36 } },
                sections: { default: { ...defaultSection, titleStyle: { ...defaultSection.titleStyle, color: '#7C3AED' } } },
                header: { layout: 'left', name: { fontSize: 26, fontWeight: 'bold', color: '#7C3AED' }, title: { fontSize: 12, fontWeight: 'medium', color: '#6B7280' }, showPhoto: false },
            },
        },
        {
            name: 'Tech',
            isPremium: false,
            config: {
                id: 'tech',
                layout: 'single-column',
                theme: { primaryColor: '#059669', secondaryColor: '#10B981', backgroundColor: '#FFFFFF', textColor: '#111827', fontFamily: 'Courier', fontSize: 10, lineHeight: 1.4, margins: { top: 30, right: 30, bottom: 30, left: 30 } },
                sections: { default: { ...defaultSection, titleStyle: { ...defaultSection.titleStyle, color: '#059669' } }, skills: { ...defaultSection, layout: 'chips' } },
                header: { layout: 'left', name: { fontSize: 22, fontWeight: 'bold' }, title: { fontSize: 12, fontWeight: 'normal', color: '#059669' }, showPhoto: false },
            },
        },
        {
            name: 'Simple',
            isPremium: false,
            config: {
                id: 'simple',
                layout: 'single-column',
                theme: { primaryColor: '#374151', secondaryColor: '#6B7280', backgroundColor: '#FFFFFF', textColor: '#1F2937', fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.5, margins: { top: 40, right: 50, bottom: 40, left: 50 } },
                sections: { default: defaultSection },
                header: { layout: 'centered', name: { fontSize: 20, fontWeight: 'bold' }, title: { fontSize: 11, fontWeight: 'normal', color: '#6B7280' }, showPhoto: false },
            },
        },
        {
            name: 'Two-Column',
            isPremium: false,
            config: {
                id: 'two-column',
                layout: 'sidebar-left',
                theme: { primaryColor: '#1E40AF', secondaryColor: '#3B82F6', backgroundColor: '#FFFFFF', textColor: '#111827', fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.4, margins: { top: 0, right: 0, bottom: 0, left: 0 } },
                sections: { default: defaultSection, skills: { ...defaultSection, layout: 'chips' } },
                sidebar: { width: '35%', backgroundColor: '#1E3A5F', textColor: '#FFFFFF', order: ['skills', 'languages', 'certifications'] },
                header: { layout: 'left', name: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' }, title: { fontSize: 12, fontWeight: 'normal', color: '#93C5FD' }, showPhoto: false },
            },
        },
        {
            name: 'Executive Pro',
            isPremium: true,
            config: {
                id: 'executive-pro',
                layout: 'single-column',
                theme: { primaryColor: '#92400E', secondaryColor: '#D97706', backgroundColor: '#FFFBEB', textColor: '#1C1917', fontFamily: 'Times-Roman', fontSize: 11, lineHeight: 1.6, margins: { top: 50, right: 50, bottom: 50, left: 50 } },
                sections: { default: { ...defaultSection, titleStyle: { ...defaultSection.titleStyle, color: '#92400E', letterSpacing: 2 } } },
                header: { layout: 'centered', name: { fontSize: 28, fontWeight: 'bold', color: '#92400E', letterSpacing: 3 }, title: { fontSize: 14, fontWeight: 'medium', color: '#B45309', textTransform: 'uppercase', letterSpacing: 2 }, showPhoto: false },
            },
        },
        {
            name: 'Designer',
            isPremium: true,
            config: {
                id: 'designer',
                layout: 'sidebar-right',
                theme: { primaryColor: '#DB2777', secondaryColor: '#EC4899', backgroundColor: '#FFFFFF', textColor: '#1F2937', fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.5, margins: { top: 0, right: 0, bottom: 0, left: 0 } },
                sections: { default: { ...defaultSection, titleStyle: { ...defaultSection.titleStyle, color: '#DB2777' } }, skills: { ...defaultSection, layout: 'chips' } },
                sidebar: { width: '30%', backgroundColor: '#FDF2F8', textColor: '#1F2937', order: ['skills', 'languages'] },
                header: { layout: 'left', name: { fontSize: 24, fontWeight: 'bold', color: '#DB2777' }, title: { fontSize: 13, fontWeight: 'medium', color: '#EC4899' }, showPhoto: true, photoStyle: { shape: 'circle', size: 80, border: true } },
            },
        },
    ];

    for (const t of templates) {
        await prisma.template.upsert({
            where: { id: t.config.id },
            update: { name: t.name, isPremium: t.isPremium, config: t.config },
            create: { id: t.config.id, name: t.name, isPremium: t.isPremium, config: t.config },
        });
    }

    console.log(`✅ ${templates.length} templates seeded`);
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

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from project root
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordRaw = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPasswordRaw) {
        throw new Error('❌ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env');
    }
    console.log(`🔑 Seeding Admin: ${adminEmail}`);
    const password = await bcrypt_1.default.hash(adminPasswordRaw, 10);
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

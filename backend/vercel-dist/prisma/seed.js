"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("../config/prisma.js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_js_1 = require("../config/env.js");
if (env_js_1.env.ADMIN_EMAIL && env_js_1.env.ADMIN_PASSWORD) {
    const adminEmail = env_js_1.env.ADMIN_EMAIL.toLowerCase().trim();
    const adminPassword = env_js_1.env.ADMIN_PASSWORD.trim();
    const passwordHash = await bcryptjs_1.default.hash(adminPassword, 12);
    await prisma_js_1.prisma.user.upsert({
        where: { email: adminEmail },
        update: { status: 'active', passwordHash },
        create: {
            email: adminEmail,
            fullName: 'MilletsNow Administrator',
            role: 'admin',
            status: 'active',
            passwordHash,
        },
    });
}
const category = await prisma_js_1.prisma.category.upsert({
    where: { slug: 'sweets' },
    update: {},
    create: { name: 'Sweets', slug: 'sweets', description: 'Traditional and healthy millet sweets' },
});
const existingProduct = await prisma_js_1.prisma.product.findFirst({
    where: { OR: [{ sku: 'MN-LADOO-180G-001' }, { slug: 'millets-ladoo' }] },
});
const product = existingProduct
    ? await prisma_js_1.prisma.product.update({
        where: { id: existingProduct.id },
        data: { name: 'Millets Ladoo', sku: 'MN-LADOO-180G-001', sellingPrice: 249, mrp: 299 },
        include: { batches: true },
    })
    : await prisma_js_1.prisma.product.create({
        data: {
            name: 'Millets Ladoo',
            sku: 'MN-LADOO-180G-001',
            slug: 'millets-ladoo',
            brand: 'MilletsNow',
            unit: 'pack',
            weight: 0.18,
            description: 'Nutritious and delicious handmade Millets Ladoo made with organic millets, jaggery, and pure ghee.',
            category: { connect: { id: category.id } },
            mrp: 299,
            sellingPrice: 249,
            batches: {
                create: {
                    batchNumber: 'MN-LADOO-B1',
                    quantity: 500,
                    manufacturingDate: new Date('2026-08-01'),
                    expiryDate: new Date('2026-11-01'),
                },
            },
        },
        include: { batches: true },
    });
const batch = product.batches[0];
if (batch) {
    await prisma_js_1.prisma.qRCode.upsert({
        where: { code: 'MN-LADOO-00001' },
        update: { status: 'active', productId: product.id, batchId: batch.id },
        create: {
            code: 'MN-LADOO-00001',
            productId: product.id,
            batchId: batch.id,
            status: 'active',
            destinationUrl: 'http://localhost:5173/scan/MN-LADOO-00001',
        },
    });
}
await prisma_js_1.prisma.$disconnect();

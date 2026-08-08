import { prisma } from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await prisma.user.upsert({ where: { email: env.ADMIN_EMAIL.toLowerCase() }, update: { status: 'active', passwordHash }, create: { email: env.ADMIN_EMAIL.toLowerCase(), fullName: 'MilletsNow Administrator', role: 'admin', status: 'active', passwordHash } });
}
const seedProducts = [
    { name: 'Classic Ragi Flour', sku: 'MN-RAGI-001', slug: 'classic-ragi-flour', category: 'Flours', mrp: 249, sellingPrice: 219, stock: 1240 },
    { name: 'Organic Bajra Atta', sku: 'MN-BAJRA-002', slug: 'organic-bajra-atta', category: 'Flours', mrp: 189, sellingPrice: 169, stock: 860 },
    { name: 'Foxtail Millet Mix', sku: 'MN-FOX-003', slug: 'foxtail-millet-mix', category: 'Breakfast', mrp: 299, sellingPrice: 269, stock: 420 },
];
for (const item of seedProducts) {
    const category = await prisma.category.upsert({ where: { slug: item.category.toLowerCase() }, update: {}, create: { name: item.category, slug: item.category.toLowerCase() } });
    await prisma.product.upsert({
        where: { sku: item.sku },
        update: { name: item.name, sellingPrice: item.sellingPrice, mrp: item.mrp },
        create: { name: item.name, sku: item.sku, slug: item.slug, category: { connect: { id: category.id } }, mrp: item.mrp, sellingPrice: item.sellingPrice, batches: { create: { batchNumber: `${item.sku}-B1`, quantity: item.stock } } },
    });
}
await prisma.$disconnect();

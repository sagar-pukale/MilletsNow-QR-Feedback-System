import QRCode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { prisma } from '../config/prisma.js';
const include = { product: { include: { category: true } }, batch: true };
const imageFor = (code) => QRCode.toDataURL(code, { margin: 1, width: 180 });
const present = async (record) => ({ id: record.id, productId: record.productId, productName: record.product.name, category: record.product.category?.name ?? null, brand: record.product.brand ?? null, weight: record.product.weight?.toString() ?? null, unit: record.product.unit ?? null, batchId: record.batchId, batchNumber: record.batch?.batchNumber ?? null, qrToken: record.code, qrImage: await imageFor(record.code), status: record.status === 'revoked' ? 'deactivated' : record.status, scanCount: 0, createdAt: record.createdAt, updatedAt: record.updatedAt, manufacturingDate: record.batch?.manufacturingDate ?? null, expiryDate: record.batch?.expiryDate ?? null, mrp: record.product.mrp?.toString() ?? null, description: record.product.description ?? null, imageUrl: record.product.imageUrl ?? null, lastScan: null });
export const qrCodeService = {
    async list(query) { const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 10)); const status = query.status === 'deactivated' ? 'revoked' : query.status; const where = { ...(query.search ? { OR: [{ code: { contains: query.search, mode: 'insensitive' } }, { product: { name: { contains: query.search, mode: 'insensitive' } } }] } : {}), ...(query.productId ? { productId: query.productId } : {}), ...(query.batchId ? { batchId: query.batchId } : {}), ...(status ? { status: status } : {}) }; const [rows, total] = await Promise.all([prisma.qRCode.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), prisma.qRCode.count({ where })]); return { items: await Promise.all(rows.map(present)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }; },
    async get(id) { const row = await prisma.qRCode.findUnique({ where: { id }, include }); return row ? present(row) : null; },
    async findByToken(code) { const row = await prisma.qRCode.findUnique({ where: { code }, include }); return row ? present(row) : null; },
    async generate(input) { const product = await prisma.product.findUnique({ where: { id: input.productId }, include: { category: true } }); if (!product)
        throw new Error('Product not found'); const batch = input.batchId ? await prisma.productBatch.findFirst({ where: { id: input.batchId, productId: input.productId } }) : await prisma.productBatch.findFirst({ where: { productId: input.productId }, orderBy: { createdAt: 'desc' } }); const quantity = Math.min(100, Math.max(1, Number(input.quantity) || 1)); const created = []; for (let index = 0; index < quantity; index += 1) {
        const code = `MN-${product.sku}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
        created.push(await prisma.qRCode.create({ data: { productId: product.id, batchId: batch?.id, code, destinationUrl: `/scan/${code}` }, include }));
    } return Promise.all(created.map(present)); },
    async remove(id) { try {
        await prisma.qRCode.delete({ where: { id } });
        return true;
    }
    catch {
        return false;
    } },
    async setStatus(id, status) { const row = await prisma.qRCode.update({ where: { id }, data: { status: status === 'deactivated' ? 'revoked' : 'active' }, include }); return present(row); },
};

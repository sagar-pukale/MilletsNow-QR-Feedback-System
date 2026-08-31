import { prisma } from '../config/prisma.js'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { buildPublicScanUrl, configuredPublicAppUrl } from '../utils/public-app-url.js'

const shouldSeedAdmin = process.env.SEED_ADMIN !== 'false'
const publicAppUrl = configuredPublicAppUrl()
const supabaseUrl = (env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'https://pezmxujnnwarhbgvutal.supabase.co').replace(/\/+$/, '')
const milletsLadooImageUrl = `${supabaseUrl}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/Milletsladoo.jpeg`

if (shouldSeedAdmin && env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
  const adminEmail = env.ADMIN_EMAIL.toLowerCase().trim()
  const adminPassword = env.ADMIN_PASSWORD.trim()
  const passwordHash = await bcrypt.hash(adminPassword, 12)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { status: 'active', passwordHash },
    create: {
      email: adminEmail,
      fullName: 'MilletsNow Administrator',
      role: 'admin',
      status: 'active',
      passwordHash,
    },
  })
}

const category = await prisma.category.upsert({
  where: { slug: 'sweets' },
  update: {},
  create: { name: 'Sweets', slug: 'sweets', description: 'Traditional and healthy millet sweets' },
})

const existingProduct = await prisma.product.findFirst({
  where: { OR: [{ sku: 'MN-LADOO-180G-001' }, { slug: 'millets-ladoo' }] },
})

const product = existingProduct
  ? await prisma.product.update({
      where: { id: existingProduct.id },
      data: { name: 'Millets Ladoo', sku: 'MN-LADOO-180G-001', sellingPrice: 249, mrp: 299, imageUrl: milletsLadooImageUrl },
      include: { batches: true },
    })
  : await prisma.product.create({
      data: {
        name: 'Millets Ladoo',
        sku: 'MN-LADOO-180G-001',
        slug: 'millets-ladoo',
        brand: 'MilletsNow',
        unit: 'pack',
        weight: 0.18,
        description: 'Nutritious and delicious handmade Millets Ladoo made with organic millets, jaggery, and pure ghee.',
        imageUrl: milletsLadooImageUrl,
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
    })

const batch = product.batches[0]
if (batch) {
  await prisma.qRCode.upsert({
    where: { code: 'MN-LADO-00001' },
    update: { status: 'active', productId: product.id, batchId: batch.id, destinationUrl: buildPublicScanUrl(publicAppUrl, 'MN-LADO-00001') },
    create: {
      code: 'MN-LADO-00001',
      productId: product.id,
      batchId: batch.id,
      status: 'active',
      destinationUrl: buildPublicScanUrl(publicAppUrl, 'MN-LADO-00001'),
    },
  })
}

await prisma.$disconnect()

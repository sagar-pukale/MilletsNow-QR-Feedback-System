import { apiFetch, appPath, assetUrl } from '@/lib/api'

export type ProductLaunchpadRecord = {
  id: string
  name: string
  sku: string
  imageUrl?: string | null
  description?: string | null
  category?: { name?: string } | null
  _count?: { qrCodes?: number }
}

export type ProductQRCodeRecord = {
  id: string
  productId: string
  productName: string
  qrToken: string
  qrImage: string
  status: string
  batchNumber?: string | null
}

export type LaunchpadEntry = {
  product: ProductLaunchpadRecord
  qrCode: ProductQRCodeRecord | null
}

export async function loadLaunchpadEntries() {
  const [productResponse, qrResponse] = await Promise.all([
    apiFetch('/products?limit=100'),
    apiFetch('/qrcodes?limit=100'),
  ])

  if (!productResponse.ok) throw new Error('Unable to load products.')
  if (!qrResponse.ok) throw new Error('Unable to load QR codes.')

  const productBody = (await productResponse.json()) as { items: ProductLaunchpadRecord[] }
  const qrBody = (await qrResponse.json()) as { items: ProductQRCodeRecord[] }
  const qrByProductId = new Map(qrBody.items.map((item) => [item.productId, item] as const))

  return productBody.items.map((product) => ({
    product,
    qrCode: qrByProductId.get(product.id) ?? null,
  }))
}

export function productImageUrl(value?: string | null) {
  return assetUrl(value)
}

export function launchpadUrl(token?: string | null) {
  return token ? appPath(`/scan/${token}`) : ''
}

export function formUrl(token: string, type: 'feedback' | 'complaint' | 'compliment') {
  const suffix = type === 'feedback' ? '' : `?type=${type}`
  return appPath(`/scan/${token}/feedback${suffix}`)
}

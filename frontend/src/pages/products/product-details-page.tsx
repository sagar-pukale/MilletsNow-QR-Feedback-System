import { useEffect, useState } from 'react'
import { ArrowLeftIcon, BarChart3Icon, HeartIcon, MessageSquareTextIcon, PackageIcon, QrCodeIcon, ShieldAlertIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/empty-state'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { apiFetch, assetUrl } from '@/lib/api'

type ProductDetails = {
  id: string
  name: string
  sku: string
  category?: { name?: string } | null
  description?: string | null
  sellingPrice?: string | number | null
  mrp?: string | number | null
  isActive: boolean
  createdAt: string
  imageUrl?: string | null
  _count?: { qrCodes?: number }
  batches?: Array<{ quantity: number }>
}

function ProductDetailsPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<ProductDetails | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const response = await apiFetch(`/products/${id}`)
        if (!response.ok) throw new Error('Unable to load product details.')
        const body = (await response.json()) as ProductDetails
        if (active) setProduct(body)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load product details.')
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  if (!product) {
    return (
      <PageLayout className="bg-[#F7F8FA]">
        <PageContainer>
          <Link to="/products" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary">
            <ArrowLeftIcon /> Back to products
          </Link>
          <EmptyState className="mt-6" title="Product not found" description={error || 'This product is not available in the PostgreSQL catalog.'} />
        </PageContainer>
      </PageLayout>
    )
  }

  const stock = product.batches?.reduce((sum, batch) => sum + batch.quantity, 0) ?? 0
  const price = `₹${product.sellingPrice ?? product.mrp ?? '--'}`

  return (
    <PageLayout className="bg-[#F7F8FA]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <Link to="/products" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ArrowLeftIcon /> Back to products
          </Link>
          <PageHeader>
            <PageHeading>
              <PageTitle>{product.name}</PageTitle>
              <PageDescription>{product.sku} · {product.category?.name ?? 'Uncategorized'}</PageDescription>
            </PageHeading>
          </PageHeader>
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card>
              <CardContent className="flex h-full min-h-64 items-center justify-center">
                {product.imageUrl ? (
                  <img src={assetUrl(product.imageUrl)} alt={product.name} className="max-h-56 max-w-full object-contain" />
                ) : (
                  <span className="text-7xl">🌾</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Product information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Info label="SKU" value={product.sku} />
                <Info label="Price" value={price} />
                <Info label="Category" value={product.category?.name ?? 'Uncategorized'} />
                <Info label="Stock" value={stock.toLocaleString()} />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className="mt-1" variant={product.isActive ? 'success' : 'secondary'}>{product.isActive ? 'Active' : 'Archived'}</Badge>
                </div>
                <Info label="Created date" value={new Date(product.createdAt).toLocaleDateString('en-IN')} />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={PackageIcon} label="Batch details" value={`${product.batches?.length ?? 0} batch${product.batches?.length === 1 ? '' : 'es'}`} />
            <Metric icon={QrCodeIcon} label="QR count" value={String(product._count?.qrCodes ?? 0)} />
            <Metric icon={BarChart3Icon} label="Total scans" value="Live scan route" />
            <Metric icon={MessageSquareTextIcon} label="Feedback flow" value="Connected" />
            <Metric icon={ShieldAlertIcon} label="Complaints" value="Connected" />
            <Metric icon={HeartIcon} label="Compliments" value="Connected" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{product.description || 'No product description added yet.'}</CardContent>
          </Card>
        </div>
      </PageContainer>
    </PageLayout>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>
}

function Metric({ icon: Icon, label, value }: { icon: typeof PackageIcon; label: string; value: string }) {
  return <Card><CardContent className="p-5"><Icon className="size-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate font-heading text-lg font-bold">{value}</p></CardContent></Card>
}

export default ProductDetailsPage

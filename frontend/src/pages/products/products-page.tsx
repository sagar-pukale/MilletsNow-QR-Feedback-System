import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  PackagePlusIcon,
  PencilIcon,
  PrinterIcon,
  QrCodeIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react'

import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch, appPath, assetUrl } from '@/lib/api'

import type { ProductRecord } from './product-data'

type Batch = {
  id: string
  batchNumber: string
  manufacturingDate?: string | null
  expiryDate?: string | null
  quantity: number
}

type ApiProduct = {
  id: string
  name: string
  sku: string
  categoryId?: string | null
  category?: { name?: string } | null
  description?: string | null
  brand?: string | null
  mrp?: string | number | null
  sellingPrice?: string | number | null
  weight?: string | number | null
  unit?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string
  imageUrl?: string | null
  batches?: Batch[]
  _count?: { qrCodes?: number }
}

type QRItem = {
  id: string
  qrToken: string
  qrImage: string
  productName: string
  status: string
  createdAt: string
}

type ProductFormProps = {
  busy: boolean
  onOpenChange: (open: boolean) => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onUploadStateChange: (state: { busy: boolean; error: string; notice: string }) => void
  open: boolean
  product: ApiProduct | null
}

const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
const maxImageSizeBytes = 10 * 1024 * 1024

const imageUrl = (value?: string | null) => assetUrl(value)
const dateInput = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '')
const displayDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'

function validateImageFile(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error('Only PNG, JPG, JPEG, and WEBP images are allowed.')
  }
  if (file.size > maxImageSizeBytes) {
    throw new Error('Product image must be 10 MB or smaller.')
  }
}

function ProductsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [status, setStatus] = useState('All statuses')
  const [catalog, setCatalog] = useState<ProductRecord[]>([])
  const [selected, setSelected] = useState<ApiProduct | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [qr, setQr] = useState<QRItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadCatalog = async () => {
    const response = await apiFetch('/products?limit=100')
    if (!response.ok) throw new Error('Unable to load products')

    const body = (await response.json()) as { items: ApiProduct[] }
    setCatalog(
      body.items.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name ?? 'Uncategorized',
        price: `₹${product.sellingPrice ?? product.mrp ?? '--'}`,
        stock: product.batches?.reduce((sum, batch) => sum + batch.quantity, 0) ?? 0,
        status: product.isActive ? 'Active' : 'Archived',
        qrGenerated: product._count?.qrCodes ?? 0,
        createdDate: displayDate(product.createdAt),
        image: imageUrl(product.imageUrl),
      })),
    )
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalog().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Unable to load products')
    })
  }, [])

  const products = useMemo(
    () =>
      catalog.filter(
        (product) =>
          `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()) &&
          (category === 'All categories' || product.category === category) &&
          (status === 'All statuses' || product.status === status),
      ),
    [catalog, category, search, status],
  )

  const fetchProduct = async (productId: string) => {
    const response = await apiFetch(`/products/${productId}`)
    if (!response.ok) throw new Error('Unable to load product details')
    return (await response.json()) as ApiProduct
  }

  const openView = async (productId: string) => {
    setBusy(true)
    setError('')

    try {
      setSelected(await fetchProduct(productId))
      setViewOpen(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load product details')
    } finally {
      setBusy(false)
    }
  }

  const openEdit = async (productId: string) => {
    setBusy(true)
    setError('')
    setNotice('')

    try {
      setSelected(await fetchProduct(productId))
      setEditOpen(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load product')
    } finally {
      setBusy(false)
    }
  }

  const openQR = async (product: ProductRecord) => {
    setBusy(true)
    setError('')

    try {
      const response = await apiFetch(`/qrcodes?productId=${product.id}&limit=100`)
      if (!response.ok) throw new Error('Unable to load QR code')

      const body = (await response.json()) as { items: QRItem[] }
      if (!body.items[0]) throw new Error('No QR code exists for this product')

      setQr(body.items[0])
      setSelected(await fetchProduct(product.id))
      setQrOpen(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load QR code')
    } finally {
      setBusy(false)
    }
  }

  const save = async (event: FormEvent<HTMLFormElement>, productId?: string) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    const form = new FormData(event.currentTarget)
    const payload = new FormData()

    for (const [key, value] of form.entries()) {
      if (key === 'image' && value instanceof File && value.size === 0) continue
      if (key === 'imageUrl' && typeof value === 'string' && value.trim() === '') continue
      if (
        typeof value === 'string' &&
        value === '' &&
        ['batchNumber', 'manufacturingDate', 'expiryDate', 'weight', 'unit', 'brand', 'description'].includes(key)
      ) {
        continue
      }
      payload.append(key, value)
    }

    try {
      const response = await apiFetch(productId ? `/products/${productId}` : '/products', {
        method: productId ? 'PUT' : 'POST',
        body: payload,
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Unable to save product')
      }

      await loadCatalog()
      if (productId) setSelected(await fetchProduct(productId))
      setEditOpen(false)
      setNotice(productId ? 'Product updated successfully.' : 'Product created successfully.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save product')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!selected) return

    setBusy(true)
    setError('')

    try {
      const response = await apiFetch(`/products/${selected.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Unable to delete product')

      await loadCatalog()
      setDeleteOpen(false)
      setSelected(null)
      setNotice('Product deleted successfully.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete product')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageLayout className="bg-[#F7F8FA]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <PageHeader>
            <PageHeading>
              <PageTitle>Products</PageTitle>
              <PageDescription>Manage your product catalog, inventory, and traceability.</PageDescription>
            </PageHeading>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <UploadIcon /> Import CSV
              </Button>
              <Button variant="outline" size="sm">
                <DownloadIcon /> Export CSV
              </Button>
              <Dialog onOpenChange={(open) => { if (!open) setSelected(null) }}>
                <Button size="sm" onClick={() => { setSelected(null); setEditOpen(true); setError(''); setNotice('') }}>
                  <PackagePlusIcon /> Add Product
                </Button>
                <ProductForm
                  busy={busy || uploadBusy}
                  onOpenChange={setEditOpen}
                  onSave={(event) => void save(event)}
                  onUploadStateChange={({ busy: nextBusy, error: nextError, notice: nextNotice }) => {
                    setUploadBusy(nextBusy)
                    if (nextError) setError(nextError)
                    if (!nextBusy && nextNotice) setNotice(nextNotice)
                  }}
                  open={editOpen && !selected}
                  product={null}
                />
              </Dialog>
            </div>
          </PageHeader>

          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </p>
          ) : null}

          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>
                  Product catalog <span className="ml-2 text-sm font-medium text-muted-foreground">{products.length} products</span>
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <SearchIcon className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." className="w-[220px] pl-9" />
                  </div>
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 rounded-lg border bg-card px-3 text-sm">
                    <option>All categories</option>
                    <option>Sweets</option>
                    <option>Flours</option>
                    <option>Breakfast</option>
                    <option>Snacks</option>
                  </select>
                  <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border bg-card px-3 text-sm">
                    <option>All statuses</option>
                    <option>Active</option>
                    <option>Archived</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'QR Generated', 'Created', 'Actions'].map((heading) => (
                        <th key={heading} className="whitespace-nowrap px-5 py-3 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr key={product.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-xl">
                              {product.image ? <img src={product.image} alt={product.name} className="size-full object-cover" /> : '--'}
                            </span>
                            <span className="font-semibold text-foreground">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{product.sku}</td>
                        <td className="px-5 py-4 text-muted-foreground">{product.category}</td>
                        <td className="px-5 py-4 font-semibold">{product.price}</td>
                        <td className="px-5 py-4">{product.stock.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <Badge variant={product.status === 'Active' ? 'success' : 'secondary'}>{product.status}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <QrCodeIcon className="size-4" />
                            {product.qrGenerated}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{product.createdDate}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon-sm" aria-label="View product" disabled={busy || uploadBusy} onClick={() => void openView(product.id)}>
                              <EyeIcon />
                            </Button>
                            <Button variant="ghost" size="icon-sm" aria-label="Edit product" disabled={busy || uploadBusy} onClick={() => void openEdit(product.id)}>
                              <PencilIcon />
                            </Button>
                            <Button variant="ghost" size="icon-sm" aria-label="View QR code" disabled={busy || uploadBusy} onClick={() => void openQR(product)}>
                              <QrCodeIcon />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Delete product"
                              disabled={busy || uploadBusy}
                              onClick={() => {
                                setSelected({ id: product.id, name: product.name, sku: product.sku, isActive: product.status === 'Active', createdAt: product.createdDate })
                                setDeleteOpen(true)
                              }}
                              className="text-destructive"
                            >
                              <Trash2Icon />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t px-5 py-4 text-sm text-muted-foreground">
                <span>Showing {products.length} of {catalog.length}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product details</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
              <div className="flex min-h-40 items-center justify-center rounded-xl bg-brand-50">
                {selected.imageUrl ? (
                  <img src={imageUrl(selected.imageUrl)} alt={selected.name} className="max-h-40 max-w-full object-contain" />
                ) : (
                  <span className="text-6xl text-muted-foreground">--</span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Product" value={selected.name} />
                <Detail label="SKU" value={selected.sku} />
                <Detail label="Category" value={selected.category?.name ?? 'Uncategorized'} />
                <Detail label="Brand" value={selected.brand ?? '--'} />
                <Detail label="MRP" value={selected.mrp ? `₹${selected.mrp}` : '--'} />
                <Detail label="Selling price" value={selected.sellingPrice ? `₹${selected.sellingPrice}` : '--'} />
                <Detail label="Weight" value={selected.weight && selected.unit ? `${selected.weight} ${selected.unit}` : '--'} />
                <Detail label="Stock" value={String(selected.batches?.reduce((sum, batch) => sum + batch.quantity, 0) ?? 0)} />
                <Detail label="Manufacturing date" value={displayDate(selected.batches?.[0]?.manufacturingDate)} />
                <Detail label="Expiry date" value={displayDate(selected.batches?.[0]?.expiryDate)} />
                <Detail label="Batch" value={selected.batches?.[0]?.batchNumber ?? '--'} />
                <Detail label="QR generated" value={String(selected._count?.qrCodes ?? 0)} />
                <Detail label="Status" value={selected.isActive ? 'Active' : 'Archived'} />
                <Detail label="Created" value={displayDate(selected.createdAt)} />
              </div>
              <div className="sm:col-span-2">
                <Detail label="Description" value={selected.description ?? '--'} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen && Boolean(selected)} onOpenChange={setEditOpen}>
        <ProductForm
          busy={busy || uploadBusy}
          onOpenChange={setEditOpen}
          onSave={(event) => void save(event, selected?.id)}
          onUploadStateChange={({ busy: nextBusy, error: nextError, notice: nextNotice }) => {
            setUploadBusy(nextBusy)
            if (nextError) setError(nextError)
            if (!nextBusy && nextNotice) setNotice(nextNotice)
          }}
          open={editOpen && Boolean(selected)}
          product={selected}
        />
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Product QR code</DialogTitle>
          </DialogHeader>
          {qr && selected ? (
            <div className="space-y-4 text-center">
              <img src={qr.qrImage} alt={`QR code for ${selected.name}`} className="mx-auto size-56 rounded-xl border p-2" />
              <p className="font-semibold">{selected.name}</p>
              <p className="text-sm text-muted-foreground">{selected.sku}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <a href={qr.qrImage} download={`${selected.sku}-qr.png`} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium">
                  <DownloadIcon className="size-4" /> Download
                </a>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <PrinterIcon /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => void navigator.clipboard?.writeText(`${window.location.origin}/scan/${qr.qrToken}`)}>
                  <CopyIcon /> Copy link
                </Button>
                <a href={appPath(`/scan/${qr.qrToken}`)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium">
                  <ExternalLinkIcon className="size-4" /> Open scan
                </a>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selected?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">The product and its associated product data may be removed. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy || uploadBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={busy || uploadBusy}>
              {busy ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}

function ProductForm({ busy, onOpenChange, onSave, onUploadStateChange, open: _open, product }: ProductFormProps) {
  const batch = product?.batches?.[0]
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl ? imageUrl(product.imageUrl) : null)
  const [imageUrlValue, setImageUrlValue] = useState(product?.imageUrl ?? '')
  const [localImageError, setLocalImageError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(product?.imageUrl ? imageUrl(product.imageUrl) : null)
    setImageUrlValue(product?.imageUrl ?? '')
    setLocalImageError('')
    setUploadingImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [product])

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setLocalImageError('')
    onUploadStateChange({ busy: false, error: '', notice: '' })

    if (!file) return

    try {
      validateImageFile(file)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Invalid image selected.'
      setLocalImageError(message)
      onUploadStateChange({ busy: false, error: message, notice: '' })
      event.target.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    if (!product?.id) {
      setImageUrlValue('')
      onUploadStateChange({ busy: false, error: '', notice: 'Image will be uploaded when you save the new product.' })
      return
    }

    setUploadingImage(true)
    onUploadStateChange({ busy: true, error: '', notice: '' })

    try {
      const payload = new FormData()
      payload.append('image', file)

      const response = await apiFetch(`/products/${product.id}/image`, {
        method: 'POST',
        body: payload,
      })

      const body = (await response.json().catch(() => null)) as ApiProduct | { error?: string } | null
      if (!response.ok) {
        throw new Error(body && 'error' in body && body.error ? body.error : 'Unable to upload product image')
      }

      const updatedProduct = body as ApiProduct
      const nextImageUrl = updatedProduct.imageUrl ?? ''
      setImageUrlValue(nextImageUrl)
      setPreviewUrl(nextImageUrl ? imageUrl(nextImageUrl) : null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onUploadStateChange({ busy: false, error: '', notice: 'Product image uploaded successfully.' })
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to upload product image'
      setLocalImageError(message)
      setPreviewUrl(product.imageUrl ? imageUrl(product.imageUrl) : null)
      onUploadStateChange({ busy: false, error: message, notice: '' })
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <DialogContent data-open={_open} className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
      </DialogHeader>
      <form key={product?.id ?? 'new'} onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
        <Field label="Product Name" name="name" defaultValue={product?.name} required />
        <Field label="SKU" name="sku" defaultValue={product?.sku} required />
        <Field label="Category" name="categoryName" defaultValue={product?.category?.name} required />
        <Field label="Brand" name="brand" defaultValue={product?.brand ?? ''} />
        <Field label="MRP" name="mrp" type="number" defaultValue={product?.mrp ?? ''} required />
        <Field label="Selling Price" name="sellingPrice" type="number" defaultValue={product?.sellingPrice ?? ''} required />
        <Field label="Weight" name="weight" type="number" defaultValue={product?.weight ?? ''} />
        <Field label="Unit" name="unit" defaultValue={product?.unit ?? ''} placeholder="g / kg / pack" />
        <Field label="Manufacturing Date" name="manufacturingDate" type="date" defaultValue={dateInput(batch?.manufacturingDate)} />
        <Field label="Expiry Date" name="expiryDate" type="date" defaultValue={dateInput(batch?.expiryDate)} />
        <Field label="Batch Number" name="batchNumber" defaultValue={batch?.batchNumber ?? ''} />
        <Field label="Stock Quantity" name="quantity" type="number" defaultValue={batch?.quantity ?? 0} required />

        <div className="sm:col-span-2">
          <Label htmlFor="image">Product Image Upload</Label>
          <input type="hidden" name="imageUrl" value={imageUrlValue} />
          <Input
            ref={fileInputRef}
            id="image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-2"
            disabled={busy || uploadingImage}
            onChange={(event) => void handleImageChange(event)}
          />
          <p className="mt-2 text-xs text-muted-foreground">PNG, JPG, JPEG, or WEBP. Maximum size 10 MB.</p>
          {uploadingImage ? <p className="mt-2 text-sm text-muted-foreground">Uploading image to Supabase Storage...</p> : null}
          {localImageError ? <p className="mt-2 text-sm text-destructive">{localImageError}</p> : null}
          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-2xl border bg-secondary/30 p-3">
              <img src={previewUrl} alt={product?.name ?? 'Selected product preview'} className="h-40 w-full rounded-xl object-contain" />
            </div>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={product?.description ?? ''}
            className="mt-2 min-h-24 w-full rounded-lg border bg-card p-3 text-sm"
            placeholder="Describe the product..."
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="isActive">Status</Label>
          <select id="isActive" name="isActive" defaultValue={product?.isActive === false ? 'false' : 'true'} className="mt-2 h-10 w-full rounded-lg border bg-card px-3 text-sm">
            <option value="true">Active</option>
            <option value="false">Archived</option>
          </select>
        </div>

        <DialogFooter className="sm:col-span-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy || uploadingImage}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || uploadingImage}>
            {busy ? 'Saving...' : 'Save Product'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  required,
  type = 'text',
}: {
  defaultValue?: string | number | null
  label: string
  name: string
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <div>
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue ?? ''} className="mt-2" />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

export default ProductsPage

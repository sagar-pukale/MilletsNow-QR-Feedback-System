import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { DownloadIcon, ExternalLinkIcon, EyeIcon, PackagePlusIcon, PrinterIcon, QrCodeIcon, SearchIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { apiPath, appPath } from '@/lib/api'

type ProductOption = {
  id: string
  name: string
  sku: string
  batches?: Array<{ id: string; batchNumber: string }>
}

type QRItem = {
  id: string
  qrToken: string
  qrImage: string
  productName: string
  batchNumber?: string | null
  status: string
  scanCount: number
  createdAt: string
  manufacturingDate?: string | null
  expiryDate?: string | null
  lastScan?: string | null
}

function QRCodesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<QRItem[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadData = async () => {
    const [qrResponse, productResponse] = await Promise.all([
      fetch(apiPath('/qrcodes?limit=100'), { credentials: 'include' }),
      fetch(apiPath('/products?limit=100'), { credentials: 'include' }),
    ])

    if (!qrResponse.ok) throw new Error('Unable to load QR codes.')
    if (!productResponse.ok) throw new Error('Unable to load products for QR generation.')

    const qrBody = (await qrResponse.json()) as { items: QRItem[] }
    const productBody = (await productResponse.json()) as { items: ProductOption[] }
    setItems(qrBody.items)
    setProducts(productBody.items)
  }

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load QR codes.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = `${item.qrToken} ${item.productName}`.toLowerCase().includes(search.toLowerCase())
        const displayStatus = item.status === 'active' ? 'Active' : 'Deactivated'
        return matchesSearch && (status === 'All statuses' || displayStatus === status)
      }),
    [items, search, status],
  )

  const onGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    const formData = new FormData(event.currentTarget)
    const payload = {
      productId: String(formData.get('productId') ?? ''),
      batchId: String(formData.get('batchId') ?? '') || undefined,
      quantity: Number(formData.get('quantity') ?? 1),
    }

    try {
      const response = await fetch(apiPath('/qrcodes/generate'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Unable to generate QR codes.')
      }

      await loadData()
      setOpen(false)
      setNotice('QR codes generated successfully.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to generate QR codes.')
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
              <PageTitle>QR Codes</PageTitle>
              <PageDescription>Manage product QR labels and monitor their traceability activity.</PageDescription>
            </PageHeading>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" render={<Link to="/qrcodes/print" />}>
                <PrinterIcon /> Print Labels
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={<Button size="sm"><PackagePlusIcon /> Generate QR</Button>} />
                <GenerateModal products={products} busy={busy} onSubmit={onGenerate} onClose={() => setOpen(false)} />
              </Dialog>
            </div>
          </PageHeader>
          {error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}
          {notice ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>QR library <span className="ml-2 text-sm font-medium text-muted-foreground">{filteredItems.length} codes</span></CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <SearchIcon className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search QR codes..." className="w-[230px] pl-9" />
                  </div>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border bg-card px-3 text-sm">
                    <option>All statuses</option>
                    <option>Active</option>
                    <option>Deactivated</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="px-5 py-8 text-sm text-muted-foreground">Loading QR codes...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-y bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>{['QR Preview', 'QR ID', 'Product Name', 'Batch Number', 'Status', 'Total Scans', 'Created Date', 'Actions'].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-3 font-semibold">{heading}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-secondary/30">
                            <td className="px-5 py-3"><img src={item.qrImage} alt={`QR preview for ${item.qrToken}`} className="size-14 rounded-xl border bg-white p-1" /></td>
                            <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{item.qrToken}</td>
                            <td className="px-5 py-4 font-semibold">{item.productName}</td>
                            <td className="px-5 py-4 text-muted-foreground">{item.batchNumber ?? '--'}</td>
                            <td className="px-5 py-4"><Badge variant={item.status === 'active' ? 'success' : 'secondary'}>{item.status === 'active' ? 'Active' : 'Deactivated'}</Badge></td>
                            <td className="px-5 py-4 font-semibold">{item.scanCount}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-4">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon-sm" aria-label="View" render={<Link to={`/qrcodes/${item.id}`} />}><EyeIcon /></Button>
                                <a href={item.qrImage} download={`${item.qrToken}.png`} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-secondary"><DownloadIcon className="size-4" /></a>
                                <a href={appPath(`/scan/${item.qrToken}`)} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-md hover:bg-secondary" aria-label="Open scan"><ExternalLinkIcon className="size-4" /></a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t px-5 py-4 text-sm text-muted-foreground">
                    <span>Showing {filteredItems.length} of {items.length}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" disabled>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </PageLayout>
  )
}

function GenerateModal({ products, busy, onSubmit, onClose }: { products: ProductOption[]; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  const [productId, setProductId] = useState('')
  const selectedProductId = productId || products[0]?.id || ''
  const selectedProduct = products.find((product) => product.id === selectedProductId)

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Generate QR codes</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <Label>Select Product</Label>
          <select name="productId" value={selectedProductId} onChange={(event) => setProductId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-card px-3 text-sm">
            {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
          </select>
        </div>
        <div>
          <Label>Select Batch</Label>
          <select name="batchId" className="mt-2 h-10 w-full rounded-lg border bg-card px-3 text-sm" defaultValue={selectedProduct?.batches?.[0]?.id ?? ''}>
            <option value="">Latest batch</option>
            {selectedProduct?.batches?.map((batch) => <option key={batch.id} value={batch.id}>{batch.batchNumber}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Quantity</Label>
            <Input name="quantity" type="number" min="1" max="100" defaultValue="1" className="mt-2" />
          </div>
          <div>
            <Label>Flow</Label>
            <p className="mt-2 rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">Product-aware customer launchpad</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy || !products.length}><QrCodeIcon /> {busy ? 'Generating...' : 'Generate QR'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export default QRCodesPage

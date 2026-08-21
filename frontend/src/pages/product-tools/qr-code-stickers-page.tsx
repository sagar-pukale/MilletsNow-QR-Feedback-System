import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CopyIcon, DownloadIcon, Edit3Icon, PlusIcon, PrinterIcon, QrCodeIcon, SaveIcon, Trash2Icon } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiPath } from '@/lib/api'
import { cn } from '@/lib/utils'

type ProductItem = {
  id: string
  name: string
  sku: string
  imageUrl?: string | null
}

type QRItem = {
  id: string
  productId: string
  productName: string
  qrToken: string
  qrImage: string
  destinationUrl?: string
  status: string
}

type StickerTemplate = {
  id: string
  name: string
  productId: string
  productName: string
  productSku: string
  qrCodeId: string
  qrToken: string
  qrDestinationUrl: string
  labelTemplate: string
  labelTemplateName: string
  textMode: 'product_name' | 'product_name_sku' | 'sku'
  textSize: number
  qrSize: number
  stickerConfig: {
    columns: number
    rows: number
    page: string
    labelWidthInches: number
    labelHeightInches: number
  }
  qrImage: string
  displayText: string
  createdAt: string
  updatedAt: string
  product: ProductItem
}

type EditorState = {
  id?: string
  name: string
  productId: string
  qrCodeId?: string
  labelTemplate: 'avery_5160'
  textMode: 'product_name' | 'product_name_sku' | 'sku'
  textSize: number
  qrSize: number
}

const defaultEditorState: EditorState = {
  name: '',
  productId: '',
  labelTemplate: 'avery_5160',
  textMode: 'product_name_sku',
  textSize: 12,
  qrSize: 108,
}

function QrCodeStickersPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [qrCodes, setQrCodes] = useState<QRItem[]>([])
  const [templates, setTemplates] = useState<StickerTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editor, setEditor] = useState<EditorState>(defaultEditorState)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadData = async () => {
    const [templateResponse, productResponse, qrResponse] = await Promise.all([
      fetch(apiPath('/qr-sticker-templates'), { credentials: 'include' }),
      fetch(apiPath('/products?limit=100'), { credentials: 'include' }),
      fetch(apiPath('/qrcodes?limit=200'), { credentials: 'include' }),
    ])

    if (!templateResponse.ok) throw new Error('Unable to load sticker projects.')
    if (!productResponse.ok) throw new Error('Unable to load products.')
    if (!qrResponse.ok) throw new Error('Unable to load product QR codes.')

    const templateBody = (await templateResponse.json()) as { items: StickerTemplate[] }
    const productBody = (await productResponse.json()) as { items: ProductItem[] }
    const qrBody = (await qrResponse.json()) as { items: QRItem[] }

    setTemplates(templateBody.items)
    setProducts(productBody.items)
    setQrCodes(qrBody.items.filter((item) => item.status === 'active'))
  }

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      void loadData()
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : 'Unable to load QR code stickers.')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  const qrByProductId = useMemo(() => {
    return new Map(qrCodes.map((item) => [item.productId, item] as const))
  }, [qrCodes])

  const selectedProduct = products.find((product) => product.id === editor.productId) ?? null
  const selectedQr = editor.productId ? qrByProductId.get(editor.productId) ?? null : null
  const selectedDisplayText = selectedProduct
    ? editor.textMode === 'sku'
      ? selectedProduct.sku
      : editor.textMode === 'product_name'
        ? selectedProduct.name
        : `${selectedProduct.name} · ${selectedProduct.sku}`
    : 'Select a product'

  const openCreate = () => {
    setEditor({
      ...defaultEditorState,
      productId: products[0]?.id ?? '',
    })
    setDialogOpen(true)
    setError('')
  }

  const openEdit = (template: StickerTemplate) => {
    setEditor({
      id: template.id,
      name: template.name,
      productId: template.productId,
      qrCodeId: template.qrCodeId,
      labelTemplate: 'avery_5160',
      textMode: template.textMode,
      textSize: template.textSize,
      qrSize: template.qrSize,
    })
    setDialogOpen(true)
    setError('')
  }

  const saveTemplate = async (downloadAfterSave: boolean) => {
    if (!editor.name.trim()) {
      setError('Sticker Template Name is required.')
      return
    }

    if (!editor.productId) {
      setError('Select a product before saving.')
      return
    }

    if (!selectedQr) {
      setError('This product does not have an active QR code yet. Generate the product QR first.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const payload = {
        name: editor.name.trim(),
        productId: editor.productId,
        qrCodeId: selectedQr.id,
        labelTemplate: editor.labelTemplate,
        textMode: editor.textMode,
        textSize: editor.textSize,
        qrSize: editor.qrSize,
        stickerConfig: {
          columns: 3,
          rows: 10,
          page: 'letter',
          labelWidthInches: 2.625,
          labelHeightInches: 1,
          marginTopInches: 0.5,
          marginLeftInches: 0.1875,
          horizontalGapInches: 0.125,
          verticalGapInches: 0,
        },
      }

      const response = await fetch(apiPath(editor.id ? `/qr-sticker-templates/${editor.id}` : '/qr-sticker-templates'), {
        method: editor.id ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const body = (await response.json().catch(() => null)) as StickerTemplate | { error?: string } | null
      if (!response.ok) throw new Error(body && 'error' in body && body.error ? body.error : 'Unable to save sticker template.')

      const saved = body as StickerTemplate
      await loadData()
      setDialogOpen(false)
      setNotice(downloadAfterSave ? 'Sticker project saved and download prepared.' : 'Sticker project saved successfully.')

      if (downloadAfterSave) {
        window.open(apiPath(`/qr-sticker-templates/${saved.id}/download`), '_blank', 'noopener,noreferrer')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save sticker template.')
    } finally {
      setBusy(false)
    }
  }

  const duplicateTemplate = async (templateId: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(apiPath(`/qr-sticker-templates/${templateId}/duplicate`), {
        method: 'POST',
        credentials: 'include',
      })
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(body?.error ?? 'Unable to duplicate sticker project.')
      await loadData()
      setNotice('Sticker project duplicated successfully.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to duplicate sticker project.')
    } finally {
      setBusy(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Delete this sticker project?')) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(apiPath(`/qr-sticker-templates/${templateId}`), {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Unable to delete sticker project.')
      await loadData()
      setNotice('Sticker project deleted.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete sticker project.')
    } finally {
      setBusy(false)
    }
  }

  const labelPreviewCells = Array.from({ length: 30 }, (_, index) => index)

  return (
    <PageLayout className="bg-[#F7F8FA]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <PageHeader>
            <PageHeading>
              <PageTitle>QR Code Stickers</PageTitle>
              <PageDescription>Prepare QR labels for your product packaging.</PageDescription>
            </PageHeading>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button size="sm" onClick={openCreate}><PlusIcon /> Add Sticker Template</Button>} />
              <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto p-0" showCloseButton>
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle>QR Sticker Editor</DialogTitle>
                  <DialogDescription>
                    Create a saved sticker project using the existing product QR flow and production customer URL.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 px-6 pb-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                  <form
                    className="space-y-4"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault()
                      void saveTemplate(false)
                    }}
                  >
                    <div>
                      <Label htmlFor="sticker-name">Sticker Template Name</Label>
                      <Input
                        id="sticker-name"
                        value={editor.name}
                        onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Millets Ladoo Retail Sheet"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sticker-product">Select Product</Label>
                      <select
                        id="sticker-product"
                        value={editor.productId}
                        onChange={(event) => setEditor((current) => ({ ...current, productId: event.target.value, qrCodeId: qrByProductId.get(event.target.value)?.id }))}
                        className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} · {product.sku}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="qr-text">Select QR Text</Label>
                      <select
                        id="qr-text"
                        value={editor.textMode}
                        onChange={(event) => setEditor((current) => ({ ...current, textMode: event.target.value as EditorState['textMode'] }))}
                        className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                      >
                        <option value="product_name_sku">Product Name + SKU</option>
                        <option value="product_name">Product Name</option>
                        <option value="sku">SKU only</option>
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="text-size">Text Size</Label>
                        <Input
                          id="text-size"
                          type="number"
                          min="8"
                          max="24"
                          value={editor.textSize}
                          onChange={(event) => setEditor((current) => ({ ...current, textSize: Number(event.target.value) || 12 }))}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="qr-size">QR Size</Label>
                        <Input
                          id="qr-size"
                          type="number"
                          min="72"
                          max="180"
                          value={editor.qrSize}
                          onChange={(event) => setEditor((current) => ({ ...current, qrSize: Number(event.target.value) || 108 }))}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="sheet-template">Label Sheet Template</Label>
                      <select
                        id="sheet-template"
                        value={editor.labelTemplate}
                        onChange={(event) => setEditor((current) => ({ ...current, labelTemplate: event.target.value as 'avery_5160' }))}
                        className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                      >
                        <option value="avery_5160">Avery 5160 · 1&quot; × 2-5/8&quot; · 3 × 10</option>
                      </select>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Selected QR</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="rounded-xl border bg-secondary/40 px-3 py-2">
                          <div className="font-semibold text-foreground">{selectedProduct?.name ?? 'No product selected'}</div>
                          <div className="text-muted-foreground">{selectedProduct?.sku ?? 'Select a product to continue'}</div>
                        </div>
                        <div className="rounded-xl border bg-card px-3 py-2 font-mono text-xs text-muted-foreground break-all">
                          {selectedQr?.destinationUrl ?? 'QR destination URL will appear here'}
                        </div>
                        {!products.length ? (
                          <p className="text-destructive">No products are available. Create a product first.</p>
                        ) : null}
                        {editor.productId && !selectedQr ? (
                          <p className="text-destructive">No active QR code exists for the selected product.</p>
                        ) : null}
                      </CardContent>
                    </Card>

                    {error ? (
                      <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </form>

                  <div className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Live Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mx-auto flex w-full max-w-[260px] items-center gap-3 rounded-2xl border bg-white p-3 shadow-xs">
                            {selectedQr ? (
                              <img
                                src={selectedQr.qrImage}
                                alt={`QR preview for ${selectedQr.qrToken}`}
                                className="shrink-0 rounded-xl border bg-white p-1"
                                style={{ width: `${Math.min(editor.qrSize, 120)}px`, height: `${Math.min(editor.qrSize, 120)}px` }}
                              />
                            ) : (
                              <div className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
                                <QrCodeIcon className="size-6" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground" style={{ fontSize: `${Math.min(editor.textSize + 1, 15)}px` }}>
                                {selectedProduct?.name ?? 'Product name'}
                              </p>
                              <p className="mt-1 truncate text-muted-foreground" style={{ fontSize: `${Math.max(editor.textSize - 1, 9)}px` }}>
                                {selectedDisplayText}
                              </p>
                              <p className="mt-2 truncate text-[10px] text-muted-foreground">
                                {selectedQr?.qrToken ?? 'QR token'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Label Sheet Preview</CardTitle>
                          <CardDescription>Avery 5160 · 3 columns · 10 rows · 30 stickers per US Letter sheet</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-secondary/30 p-3">
                            {labelPreviewCells.map((cell) => (
                              <div key={cell} className="rounded-lg border bg-white p-2">
                                <div className="flex items-center gap-2">
                                  {selectedQr ? (
                                    <img src={selectedQr.qrImage} alt="" className="size-9 rounded-md border bg-white p-0.5" />
                                  ) : (
                                    <div className="flex size-9 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                                      <QrCodeIcon className="size-3.5" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-semibold">{selectedProduct?.name ?? 'Product'}</p>
                                    <p className="truncate text-[9px] text-muted-foreground">{selectedDisplayText}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Print Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value="The saved download generates a print-ready Avery 5160 PDF using the selected product's live customer QR URL."
                          readOnly
                          className="min-h-20 resize-none bg-secondary/30"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>Cancel</Button>
                  <Button type="button" variant="outline" onClick={() => void saveTemplate(false)} disabled={busy || !products.length}><SaveIcon /> Save</Button>
                  <Button type="button" onClick={() => void saveTemplate(true)} disabled={busy || !products.length}><DownloadIcon /> Save &amp; Download</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PageHeader>

          {notice ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}
          {error && !dialogOpen ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}

          {loading ? (
            <Card>
              <CardContent className="p-8 text-sm text-muted-foreground">Loading sticker projects...</CardContent>
            </Card>
          ) : templates.length === 0 ? (
            <EmptyState
              title="No sticker projects yet"
              description="Create your first QR sticker template for a saved product QR code."
              icon={QrCodeIcon}
              action={<Button onClick={openCreate}><PlusIcon /> Add Sticker Template</Button>}
            />
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <img src={template.qrImage} alt={`QR preview for ${template.qrToken}`} className="size-20 rounded-2xl border bg-white p-2 shadow-xs" />
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-lg font-bold">{template.name}</h3>
                          <Badge variant="secondary">{template.labelTemplateName}</Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">{template.productName} · {template.productSku}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>QR Token: <span className="font-mono">{template.qrToken}</span></span>
                          <span>Text Size: {template.textSize}px</span>
                          <span>Created: {new Date(template.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="max-w-3xl truncate text-xs text-muted-foreground">{template.qrDestinationUrl}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(template)}><Edit3Icon /> Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => void duplicateTemplate(template.id)} disabled={busy}><CopyIcon /> Duplicate</Button>
                      <a href={apiPath(`/qr-sticker-templates/${template.id}/download`)} className={cn(buttonLinkClass, 'border')}><DownloadIcon className="size-4" /> Download</a>
                      <Button variant="outline" size="sm" onClick={() => window.open(`${apiPath(`/qr-sticker-templates/${template.id}/download`)}?disposition=inline`, '_blank', 'noopener,noreferrer')}><PrinterIcon /> Print</Button>
                      <Button variant="outline" size="sm" onClick={() => void deleteTemplate(template.id)} disabled={busy}><Trash2Icon /> Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </PageLayout>
  )
}

const buttonLinkClass = 'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold'

export default QrCodeStickersPage

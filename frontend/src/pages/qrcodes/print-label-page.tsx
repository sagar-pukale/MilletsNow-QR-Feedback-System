import { useEffect, useState } from 'react'
import { PrinterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { apiFetch } from '@/lib/api'

type QRItem = {
  id: string
  qrToken: string
  qrImage: string
  productName: string
  batchNumber?: string | null
}

function PrintLabelPage() {
  const [items, setItems] = useState<QRItem[]>([])

  useEffect(() => {
    let active = true
    void apiFetch('/qrcodes?limit=24')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load QR labels.')))
      .then((body: { items: QRItem[] }) => {
        if (active) setItems(body.items)
      })
      .catch(() => {
        if (active) setItems([])
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <PageLayout className="bg-[#F7F8FA]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <PageHeader>
            <PageHeading>
              <PageTitle>Print QR labels</PageTitle>
              <PageDescription>Prepare single or batch labels for product packaging.</PageDescription>
            </PageHeading>
            <Button onClick={() => window.print()}><PrinterIcon /> Print labels</Button>
          </PageHeader>
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card>
              <CardHeader><CardTitle>Print setup</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Option label="Selection" value={items.length ? 'Live QR labels' : 'No QR labels yet'} />
                <Option label="Sheet format" value="Sticker Layout" />
                <div><p className="mb-2 text-xs font-semibold text-muted-foreground">Label count</p><p className="rounded-lg border bg-secondary/50 px-3 py-2 text-sm">{items.length} QR labels selected</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Label preview</CardTitle></CardHeader>
              <CardContent>
                <div className="grid min-h-96 grid-cols-2 gap-4 rounded-xl border border-dashed bg-secondary/30 p-6 sm:grid-cols-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col items-center justify-center rounded-lg border bg-white p-3 text-center shadow-xs">
                      <img src={item.qrImage} alt={`QR preview for ${item.qrToken}`} className="size-20 rounded-lg border bg-white p-1" />
                      <p className="mt-2 max-w-full truncate text-[10px] font-semibold">{item.productName}</p>
                      <p className="text-[9px] text-muted-foreground">{item.batchNumber ?? '--'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  )
}

function Option({ label, value }: { label: string; value: string }) {
  return <div><p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p><p className="rounded-lg border bg-card px-3 py-2 text-sm">{value}</p></div>
}

export default PrintLabelPage

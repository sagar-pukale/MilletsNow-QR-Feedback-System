import { useEffect, useState } from 'react'
import { ArrowLeftIcon, DownloadIcon, ExternalLinkIcon, PrinterIcon, QrCodeIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { apiPath, appPath } from '@/lib/api'

type QRDetails = {
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

function QRCodeDetailsPage() {
  const { id } = useParams()
  const [item, setItem] = useState<QRDetails | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const response = await fetch(apiPath(`/qrcodes/${id}`), { credentials: 'include' })
        if (!response.ok) throw new Error('Unable to load QR code details.')
        const body = (await response.json()) as QRDetails
        if (active) setItem(body)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load QR code details.')
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [id])

  if (!item) {
    return (
      <PageLayout className="bg-[#F7F8FA]">
        <PageContainer>
          <Link to="/qrcodes" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary"><ArrowLeftIcon /> Back to QR codes</Link>
          <Card className="mt-6"><CardContent className="p-8 text-sm text-destructive">{error || 'QR code not found.'}</CardContent></Card>
        </PageContainer>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="bg-[#F7F8FA]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <Link to="/qrcodes" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary"><ArrowLeftIcon /> Back to QR codes</Link>
          <PageHeader>
            <PageHeading>
              <PageTitle>QR Code details</PageTitle>
              <PageDescription>{item.qrToken}</PageDescription>
            </PageHeading>
            <div className="flex flex-wrap gap-2">
              <a href={item.qrImage} download={`${item.qrToken}.png`} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium"><DownloadIcon className="size-4" /> PNG</a>
              <Button variant="outline" size="sm" onClick={() => window.print()}><PrinterIcon /> Print</Button>
              <a href={appPath(`/scan/${item.qrToken}`)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium"><ExternalLinkIcon className="size-4" /> Open scan</a>
            </div>
          </PageHeader>
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card><CardContent className="flex min-h-80 items-center justify-center"><img src={item.qrImage} alt={`QR preview for ${item.qrToken}`} className="w-56 rounded-xl border bg-white p-2" /></CardContent></Card>
            <Card>
              <CardHeader><CardTitle>Traceability information</CardTitle></CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <Info label="QR ID" value={item.qrToken} />
                <Info label="Product" value={item.productName} />
                <Info label="Batch" value={item.batchNumber ?? '--'} />
                <Info label="Manufacturing date" value={formatDate(item.manufacturingDate)} />
                <Info label="Expiry date" value={formatDate(item.expiryDate)} />
                <Info label="Created date" value={formatDate(item.createdAt)} />
                <div><p className="text-xs text-muted-foreground">Status</p><Badge className="mt-1" variant={item.status === 'active' ? 'success' : 'secondary'}>{item.status === 'active' ? 'Active' : 'Deactivated'}</Badge></div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Metric icon={QrCodeIcon} label="Total scans" value={String(item.scanCount)} />
            <Metric icon={PrinterIcon} label="Last scan" value={item.lastScan ?? 'Not recorded'} />
            <Metric icon={QrCodeIcon} label="QR format" value="Customer launchpad" />
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  )
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div> }
function Metric({ icon: Icon, label, value }: { icon: typeof QrCodeIcon; label: string; value: string }) { return <Card><CardContent className="p-5"><Icon className="size-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate font-heading text-lg font-bold">{value}</p></CardContent></Card> }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString('en-IN') : '--' }

export default QRCodeDetailsPage

import { useEffect, useMemo, useState } from 'react'
import { ExternalLinkIcon, FileTextIcon, HeartHandshakeIcon, MessageSquareWarningIcon, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { formUrl, launchpadUrl, loadLaunchpadEntries, productImageUrl, type LaunchpadEntry } from './shared'

const formDefinitions = [
  {
    key: 'feedback',
    title: 'Feedback',
    description: 'Customers describe their experience and optional quality notes.',
    icon: StarIcon,
  },
  {
    key: 'complaint',
    title: 'Complaint',
    description: 'Customers report a problem that is stored against the scanned product and QR.',
    icon: MessageSquareWarningIcon,
  },
  {
    key: 'compliment',
    title: 'Rate & Compliment',
    description: 'Customers give a rating plus their compliment or appreciation.',
    icon: HeartHandshakeIcon,
  },
] as const

function FormsPage() {
  const [entries, setEntries] = useState<LaunchpadEntry[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void loadLaunchpadEntries()
      .then((result) => {
        if (active) setEntries(result)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load forms.')
      })
    return () => {
      active = false
    }
  }, [])

  const readyEntries = useMemo(() => entries.filter((entry) => entry.qrCode?.status === 'active'), [entries])

  return (
    <PageLayout className="bg-[#F7F8FA]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <PageHeader>
            <PageHeading>
              <PageTitle>Forms</PageTitle>
              <PageDescription>These are the live customer forms connected to your scanned product experiences.</PageDescription>
            </PageHeading>
          </PageHeader>
          {error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}
          <div className="grid gap-4 xl:grid-cols-3">
            {formDefinitions.map(({ key, title, description, icon: Icon }) => (
              <Card key={key}>
                <CardContent className="p-5">
                  <Icon className="size-5 text-primary" />
                  <p className="mt-4 font-heading text-lg font-bold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Product-linked form routes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {readyEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">Generate an active QR code for a product to activate its customer forms.</div>
              ) : (
                readyEntries.map(({ product, qrCode }) => (
                  <div key={product.id} className="rounded-2xl border bg-white p-4 shadow-xs">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-brand-50">
                          {product.imageUrl ? <img src={productImageUrl(product.imageUrl)} alt={product.name} className="size-full object-cover" /> : <FileTextIcon className="size-6 text-primary" />}
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku} · {qrCode?.qrToken}</p>
                        </div>
                      </div>
                      <a href={launchpadUrl(qrCode?.qrToken)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium">
                        <ExternalLinkIcon className="size-4" /> Open launchpad
                      </a>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <FormLink title="Feedback" href={formUrl(qrCode!.qrToken, 'feedback')} />
                      <FormLink title="Complaint" href={formUrl(qrCode!.qrToken, 'complaint')} />
                      <FormLink title="Rate & Compliment" href={formUrl(qrCode!.qrToken, 'compliment')} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </PageLayout>
  )
}

function FormLink({ title, href }: { title: string; href: string }) {
  return (
    <div className="rounded-xl border bg-secondary/20 p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">Live database-backed customer form.</p>
      <Button className="mt-3" variant="outline" size="sm" render={<a href={href} target="_blank" rel="noreferrer" />}>
        <ExternalLinkIcon /> Open form
      </Button>
    </div>
  )
}

export default FormsPage

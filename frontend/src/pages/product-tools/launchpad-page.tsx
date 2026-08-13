import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ExternalLinkIcon, HeartHandshakeIcon, MessageCircleIcon, MessageSquareWarningIcon, PlayIcon, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { socialLinks } from '@/constants/social-links'
import { formUrl, launchpadUrl, loadLaunchpadEntries, productImageUrl, type LaunchpadEntry } from './shared'

function LaunchpadPage() {
  const [entries, setEntries] = useState<LaunchpadEntry[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void loadLaunchpadEntries()
      .then((result) => {
        if (active) setEntries(result)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load launchpads.')
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
              <PageTitle>Launchpad</PageTitle>
              <PageDescription>Every active QR code opens a product-aware customer launchpad with forms and social links.</PageDescription>
            </PageHeading>
          </PageHeader>
          {error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}
          <div className="grid gap-6 xl:grid-cols-2">
            {readyEntries.map(({ product, qrCode }) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex size-24 items-center justify-center overflow-hidden rounded-2xl bg-brand-50">
                      {product.imageUrl ? <img src={productImageUrl(product.imageUrl)} alt={product.name} className="size-full object-cover" /> : <PlayIcon className="size-8 text-primary" />}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                      <p className="text-sm text-muted-foreground">{product.category?.name ?? 'Uncategorized'} · {qrCode?.qrToken}</p>
                      <a href={launchpadUrl(qrCode?.qrToken)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium">
                        <ExternalLinkIcon className="size-4" /> Open customer launchpad
                      </a>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <LaunchButton title="Feedback" href={formUrl(qrCode!.qrToken, 'feedback')} icon={StarIcon} />
                    <LaunchButton title="Complaint" href={formUrl(qrCode!.qrToken, 'complaint')} icon={MessageSquareWarningIcon} />
                    <LaunchButton title="Rate & Compliment" href={formUrl(qrCode!.qrToken, 'compliment')} icon={HeartHandshakeIcon} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SocialLink label="Instagram" href={socialLinks.instagram} icon={<span className="text-sm font-bold">IG</span>} />
                    <SocialLink label="Facebook" href={socialLinks.facebook} icon={<span className="text-sm font-bold">f</span>} />
                    <SocialLink label="YouTube" href={socialLinks.youtube} icon={<PlayIcon className="size-4" />} />
                    <SocialLink label="WhatsApp" href={socialLinks.whatsapp} icon={<MessageCircleIcon className="size-4" />} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {!readyEntries.length && !error ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Generate an active QR code for a product and it will appear here automatically as a customer launchpad.</CardContent></Card>
          ) : null}
        </div>
      </PageContainer>
    </PageLayout>
  )
}

function LaunchButton({ title, href, icon: Icon }: { title: string; href: string; icon: typeof StarIcon }) {
  return (
    <Button variant="outline" className="h-auto justify-start rounded-2xl px-4 py-4" render={<a href={href} target="_blank" rel="noreferrer" />}>
      <Icon className="size-4" />
      <span className="ml-2">{title}</span>
    </Button>
  )
}

function SocialLink({ label, href, icon }: { label: string; href: string; icon: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl border bg-secondary/20 text-sm font-medium hover:border-primary/20 hover:text-primary">
      {icon}
      <span>{label}</span>
    </a>
  )
}

export default LaunchpadPage

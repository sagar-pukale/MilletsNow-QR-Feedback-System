import { useEffect, useState } from 'react'
import { AlertTriangleIcon, ChevronRightIcon, HeartHandshakeIcon, MessageSquareWarningIcon, StarIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { apiPath } from '@/lib/api'
import { BrandHeader, CustomerPageShell, FollowUs, ProductHero, type ScanPayload } from './scan-shared'

const actions = [
  {
    key: 'feedback',
    title: 'Feedback',
    description: 'Share your experience',
    href: 'feedback',
    icon: StarIcon,
    tone: 'from-brand-700 to-brand-600 text-white',
  },
  {
    key: 'complaint',
    title: 'Complaint',
    description: 'Report an issue',
    href: 'feedback?type=complaint',
    icon: MessageSquareWarningIcon,
    tone: 'from-amber-500 to-orange-500 text-white',
  },
  {
    key: 'compliment',
    title: 'Rate & Compliment',
    description: 'Rate the product and share your thoughts',
    href: 'feedback?type=compliment',
    icon: HeartHandshakeIcon,
    tone: 'from-rose-500 to-pink-500 text-white',
  },
] as const

function ScanPage() {
  const { qrToken = '' } = useParams()
  const [payload, setPayload] = useState<ScanPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetch(apiPath(`/scan/${encodeURIComponent(qrToken)}`))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'This product QR is invalid or no longer active.'
              : 'We could not load this product right now.',
          )
        }

        return response.json() as Promise<ScanPayload>
      })
      .then((body) => {
        if (active) setPayload(body)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'We could not load this product right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [qrToken])

  if (loading) {
    return (
      <CustomerPageShell>
        <BrandHeader />
        <div className="rounded-[2rem] border border-border/70 bg-white px-6 py-14 text-center shadow-card">
          <p className="text-sm text-muted-foreground">Loading product details...</p>
        </div>
      </CustomerPageShell>
    )
  }

  if (!payload || error) {
    return (
      <CustomerPageShell>
        <BrandHeader />
        <div className="rounded-[2rem] border border-border/70 bg-white px-6 py-12 text-center shadow-card">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangleIcon className="size-7" />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-bold">Product unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error || 'This product QR is invalid or no longer active.'}
          </p>
        </div>
      </CustomerPageShell>
    )
  }

  return (
    <CustomerPageShell>
      <BrandHeader />
      <ProductHero product={payload.product} subtitle="Your feedback helps us improve." />
      <section className="mt-6">
        <div className="mb-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight">Choose an option</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select how you want to connect with MilletsNow.</p>
        </div>
        <div className="space-y-3">
          {actions.map(({ key, title, description, href, icon: Icon, tone }) => (
            <Link
              key={key}
              to={`/scan/${qrToken}/${href}`}
              className={`group flex min-h-24 items-center justify-between rounded-[1.75rem] bg-gradient-to-r px-5 py-4 shadow-card transition-transform hover:-translate-y-0.5 ${tone}`}
            >
              <div className="flex items-center gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white/18">
                  <Icon className="size-6" />
                </span>
                <div>
                  <p className="text-base font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-white/88">{description}</p>
                </div>
              </div>
              <ChevronRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
      <FollowUs className="mt-6" />
    </CustomerPageShell>
  )
}

export default ScanPage

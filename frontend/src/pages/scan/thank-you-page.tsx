import { useMemo } from 'react'
import { CheckCircle2Icon } from 'lucide-react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { BrandHeader, CustomerPageShell, FollowUs } from './scan-shared'

function CustomerThankYouPage() {
  const { qrToken = '' } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') ?? 'feedback'
  const productName = (location.state as { productName?: string } | null)?.productName ?? 'MilletsNow product'

  const subtitle = useMemo(() => {
    if (type === 'complaint') return 'Your complaint has been submitted successfully.'
    if (type === 'compliment') return 'Your rating and compliment have been submitted successfully.'
    return 'Your response has been submitted successfully.'
  }, [type])

  return (
    <CustomerPageShell>
      <BrandHeader />
      <section className="rounded-[2rem] border border-border/70 bg-white px-6 py-12 text-center shadow-card">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
          <CheckCircle2Icon className="size-8" />
        </div>
        <h1 className="mt-5 font-heading text-3xl font-bold">Thank You!</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your feedback helps MilletsNow improve and serve you better.
        </p>
        <p className="mt-5 text-sm font-semibold text-primary">{productName}</p>
        <a
          href={`/scan/${qrToken}`}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white shadow-soft"
        >
          Back to product page
        </a>
      </section>
      <FollowUs className="mt-6" />
    </CustomerPageShell>
  )
}

export default CustomerThankYouPage

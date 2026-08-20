import { useEffect, useMemo, useState } from 'react'
import { MessageSquareIcon, QrCodeIcon, StarIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageLayout,
  PageTitle,
} from '@/components/layout/page-layout'
import { apiPath } from '@/lib/api'

type Message = {
  id: string
  rating: number | null
  message: string | null
  status: string
  submittedAt: string
  productName: string | null
  source: string
  sourceLabel: string | null
  type: string
}

function MessagesPage() {
  const [items, setItems] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let refreshTimer: number | undefined

    const fetchFeedback = async () => {
      try {
        const response = await fetch(apiPath('/feedback?limit=100'), { credentials: 'include' })
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Your session has expired. Please sign in again.'
              : 'Unable to load feedback.',
          )
        }

        const body = (await response.json()) as { items: Message[] }
        if (active) setItems(body.items)
      } catch (reason: unknown) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load feedback.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchFeedback()
    refreshTimer = window.setInterval(() => {
      void fetchFeedback()
    }, 30000)

    return () => {
      active = false
      if (refreshTimer) window.clearInterval(refreshTimer)
    }
  }, [])

  const summary = useMemo(() => {
    const ratedItems = items.filter((item) => item.rating != null)
    const averageRating = ratedItems.length
      ? (ratedItems.reduce((total, item) => total + (item.rating ?? 0), 0) / ratedItems.length).toFixed(1)
      : null

    return {
      total: items.length,
      rated: ratedItems.length,
      commonQr: items.filter((item) => item.source === 'common_qr').length,
      averageRating,
    }
  }, [items])

  const metrics = [
    ['Total Feedback', summary.total, MessageSquareIcon],
    ['Average Rating', summary.averageRating ? `${summary.averageRating} / 5` : 'Unavailable', StarIcon],
    ['Rated Responses', summary.rated, StarIcon],
    ['Common QR Entries', summary.commonQr, QrCodeIcon],
  ] as const

  return (
    <PageLayout className="bg-[linear-gradient(180deg,#eef8fb_0%,#f8fdfe_34%,#f6fbfd_100%)]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <PageHeader>
            <PageHeading>
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#2e9bb8] uppercase">Feedback</p>
              <PageTitle className="text-[#20323a]">Customer Feedback</PageTitle>
              <PageDescription className="max-w-3xl text-base text-[#61757d]">
                Review real feedback submissions, ratings, and common QR responses from the live MilletsNow system.
              </PageDescription>
            </PageHeading>
          </PageHeader>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(([label, value, Icon]) => (
              <Card key={label} className="border-[#d8ebf0] bg-white shadow-[0_18px_40px_rgba(18,74,88,0.06)]">
                <CardContent className="p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#edf8fb] text-[#2e9bb8]">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-[#688089] uppercase">{label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[#20323a]">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {loading ? (
            <Card className="border-[#d8ebf0] bg-white shadow-[0_18px_40px_rgba(18,74,88,0.06)]">
              <CardContent className="p-8 text-center text-sm text-[#6a8088]">Loading feedback...</CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-white">
              <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
            </Card>
          ) : items.length === 0 ? (
            <EmptyState
              title="No feedback yet"
              description="Customer feedback will appear here once the common MilletsNow QR starts receiving responses."
              icon={MessageSquareIcon}
            />
          ) : (
            <Card className="border-[#d8ebf0] bg-white shadow-[0_18px_40px_rgba(18,74,88,0.06)]">
              <CardContent className="divide-y p-0">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#20323a]">
                        {item.message?.trim() || 'No written feedback was submitted.'}
                      </p>
                      <p className="mt-1 text-xs text-[#6c8189]">
                        {item.rating != null ? `Rating ${item.rating}/5 · ` : ''}
                        {item.source === 'common_qr' ? 'Common QR' : item.sourceLabel ?? item.productName ?? 'Feedback'}
                        {' · '}
                        {new Date(item.submittedAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#edf8fb] px-2.5 py-1 text-xs font-semibold capitalize text-[#2e9bb8]">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </PageLayout>
  )
}

export default MessagesPage

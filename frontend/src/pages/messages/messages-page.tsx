import { useEffect, useMemo, useState } from 'react'
import { DownloadIcon, MessageSquareIcon, QrCodeIcon, StarIcon } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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
import { apiFetch } from '@/lib/api'

type Message = {
  id: string
  name: string | null
  email: string | null
  rating: number | null
  message: string | null
  status: string
  submittedAt: string
  latitude: number | null
  longitude: number | null
  locationAccuracy: number | null
  locationLabel: string | null
  locationLocality: string | null
  locationDistrict: string | null
  locationState: string | null
  locationAddress: string | null
  userAgent: string | null
  deviceType: string | null
  operatingSystem: string | null
  browser: string | null
  productName: string | null
  source: string
  sourceLabel: string | null
  type: string
}

type FeedbackSummary = {
  total: number
  totalRatings: number
  commonQrTotal: number
  withLocation: number
  withoutLocation: number
  todayTotal: number
  averageRating: number | null
  ratingDistribution: Array<{
    rating: number
    count: number
  }>
}

type ActiveMetric = 'all' | 'total' | 'average' | 'rated' | 'common_qr'

function normalizedFeedbackText(value: string | null) {
  const text = value?.trim()
  if (!text) return null

  const isUrl = /^https?:\/\//i.test(text)
  const isHostname = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(text)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
  const isQrToken = /^[A-Z0-9]+(?:-[A-Z0-9]+){2,}$/i.test(text)
  const isNumericId = /^[0-9]{8,}$/.test(text)
  const isMachineSlug =
    /^[a-z0-9]+(?:-[a-z0-9]+){1,}$/i.test(text) &&
    (/(^|[-_])(host|hostname|render|vercel|repeat|token|qr|test)([-_]|$)/i.test(text) || /-\d{6,}$/.test(text))

  if (isUrl || isHostname || isUuid || isQrToken || isNumericId || isMachineSlug) {
    return null
  }

  return text
}

function mapLocationHref(item: Message) {
  if (item.latitude == null || item.longitude == null) return null
  return `https://www.google.com/maps?q=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`
}

function preferredLocationLabel(item: Message) {
  return item.locationLabel ?? item.locationAddress
}

function messageAuthorLabel(item: Message) {
  return item.name?.trim() || item.email?.trim() || `Feedback ${item.id.slice(0, 8)}`
}

function MessagesPage() {
  const location = useLocation()
  const [items, setItems] = useState<Message[]>([])
  const [summary, setSummary] = useState<FeedbackSummary>({
    total: 0,
    totalRatings: 0,
    commonQrTotal: 0,
    withLocation: 0,
    withoutLocation: 0,
    todayTotal: 0,
    averageRating: null,
    ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 })),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('all')
  const [exportBusy, setExportBusy] = useState(false)

  useEffect(() => {
    let active = true

    const fetchFeedback = async () => {
      try {
        const response = await apiFetch(`/feedback?limit=1000&_=${Date.now()}`)
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Your session has expired. Please sign in again.'
              : 'Unable to load feedback.',
          )
        }

        const body = (await response.json()) as { items: Message[]; summary: FeedbackSummary }
        if (active) {
          setItems(body.items)
          setSummary(body.summary)
          setError('')
        }
      } catch (reason: unknown) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load feedback.')
      } finally {
        if (active) setLoading(false)
      }
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchFeedback()
      }
    }

    void fetchFeedback()
    const refreshTimer = window.setInterval(() => {
      void fetchFeedback()
    }, 30000)

    window.addEventListener('focus', refreshIfVisible)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      active = false
      window.clearInterval(refreshTimer)
      window.removeEventListener('focus', refreshIfVisible)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [location.key, location.pathname])

  const filteredItems = useMemo(() => {
    if (activeMetric === 'rated' || activeMetric === 'average') {
      return items.filter((item) => item.rating != null)
    }
    if (activeMetric === 'common_qr') {
      return items.filter((item) => item.source === 'common_qr')
    }
    return items
  }, [activeMetric, items])

  const metrics = [
    ['total', 'Total Feedback', summary.total, MessageSquareIcon],
    ['average', 'Average Rating', summary.averageRating ? `${summary.averageRating} / 5` : 'Unavailable', StarIcon],
    ['rated', 'Rated Responses', summary.totalRatings, StarIcon],
    ['common_qr', 'Common QR Entries', summary.commonQrTotal, QrCodeIcon],
  ] as const

  const activeSummaryTitle = useMemo(() => {
    if (activeMetric === 'all') return 'Show All'
    if (activeMetric === 'total') return 'Total Feedback'
    if (activeMetric === 'average') return 'Average Rating'
    if (activeMetric === 'rated') return 'Rated Responses'
    if (activeMetric === 'common_qr') return 'Common QR Entries'
    return 'Show All'
  }, [activeMetric])

  const downloadExcel = async () => {
    if (summary.total === 0) {
      setError('No feedback records available to export.')
      return
    }

    setExportBusy(true)
    setError('')

    try {
      const response = await apiFetch('/feedback/export.xlsx')
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Unable to export feedback to Excel.')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const reportDate = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())

      link.href = downloadUrl
      link.download = `QR_Feedback_Report_${reportDate}.xlsx`
      document.body.append(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Unable to export feedback to Excel.')
    } finally {
      setExportBusy(false)
    }
  }

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
            <Button type="button" variant="outline" disabled={loading || exportBusy} onClick={() => void downloadExcel()}>
              <DownloadIcon className="size-4" />
              {exportBusy ? 'Preparing Excel...' : 'Download Excel'}
            </Button>
          </PageHeader>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(([metric, label, value, Icon]) => {
              const selected = activeMetric === metric
              return (
                <Card
                  key={label}
                  className={`cursor-pointer border bg-white shadow-[0_18px_40px_rgba(18,74,88,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(18,74,88,0.1)] ${
                    selected ? 'border-[#2e9bb8] bg-[#f2fbfd] ring-2 ring-[#bfe6ef]' : 'border-[#d8ebf0]'
                  }`}
                  onClick={() => setActiveMetric(metric)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setActiveMetric(metric)
                    }
                  }}
                >
                  <CardContent className="p-5">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        selected ? 'bg-[#d8f1f6] text-[#1e88a4]' : 'bg-[#edf8fb] text-[#2e9bb8]'
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-[#688089] uppercase">{label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-[#20323a]">{value}</p>
                    <p
                      className={`mt-2 text-xs font-semibold ${
                        selected ? 'text-[#2e9bb8]' : 'text-[#8aa0a8]'
                      }`}
                    >
                      {selected ? 'Active selection' : 'Click to filter'}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {!loading && !error ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] border border-[#d8ebf0] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(18,74,88,0.05)]">
              <p className="text-sm font-semibold text-[#20323a]">
                Showing: <span className="text-[#2e9bb8]">{activeSummaryTitle}</span>
                <span className="ml-2 text-[#6c8189]">({filteredItems.length} visible)</span>
              </p>
              {activeMetric !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setActiveMetric('all')}
                  className="rounded-full border border-[#d1e8ee] bg-[#f5fbfd] px-3 py-1.5 text-xs font-semibold text-[#2e9bb8] transition hover:border-[#a9d8e3] hover:bg-[#edf8fb]"
                >
                  Show All
                </button>
              ) : null}
            </div>
          ) : null}

          {!loading && !error && activeMetric === 'average' ? (
            <Card className="border-[#d8ebf0] bg-white shadow-[0_18px_40px_rgba(18,74,88,0.06)]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#688089] uppercase">Average Rating</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-[#20323a]">
                      {summary.averageRating ? `${summary.averageRating} / 5` : 'Unavailable'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#6c8189]">{summary.totalRatings} rated responses</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {summary.ratingDistribution.map((entry) => (
                    <div
                      key={entry.rating}
                      className="rounded-[1rem] border border-[#dcecf0] bg-[#fbfeff] px-4 py-3"
                    >
                      <p className="text-xs font-semibold tracking-[0.14em] text-[#688089] uppercase">
                        {entry.rating}-Star
                      </p>
                      <p className="mt-1 text-xl font-bold text-[#20323a]">{entry.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {loading ? (
            <Card className="border-[#d8ebf0] bg-white shadow-[0_18px_40px_rgba(18,74,88,0.06)]">
              <CardContent className="p-8 text-center text-sm text-[#6a8088]">Loading feedback...</CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-white">
              <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title={activeMetric === 'all' ? 'No feedback yet' : `No ${activeSummaryTitle.toLowerCase()} found`}
              description={
                activeMetric === 'all'
                  ? 'Customer feedback will appear here once the common MilletsNow QR starts receiving responses.'
                  : 'Try Show All to return to the complete feedback list.'
              }
              icon={MessageSquareIcon}
              action={
                activeMetric !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setActiveMetric('all')}
                    className="rounded-full border border-[#d1e8ee] bg-[#f5fbfd] px-4 py-2 text-sm font-semibold text-[#2e9bb8] transition hover:border-[#a9d8e3] hover:bg-[#edf8fb]"
                  >
                    Show All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <Card className="border-[#d8ebf0] bg-white shadow-[0_18px_40px_rgba(18,74,88,0.06)]">
              <CardContent className="divide-y p-0">
                {filteredItems.map((item) => {
                  const message = normalizedFeedbackText(item.message) ?? 'No written feedback'
                  const authorLabel = messageAuthorLabel(item)
                  const showTextOnly = activeMetric === 'total'
                  const showTypeBadge = activeMetric === 'all'
                  const showContextDetails =
                    activeMetric === 'all' ||
                    activeMetric === 'average' ||
                    activeMetric === 'rated' ||
                    activeMetric === 'common_qr'
                  const metaParts = [
                    activeMetric !== 'total' && item.rating != null ? `Rating ${item.rating}/5` : null,
                    showContextDetails
                      ? item.source === 'common_qr'
                        ? 'Common QR'
                        : item.sourceLabel ?? item.productName ?? 'Feedback'
                      : null,
                    showContextDetails ? new Date(item.submittedAt).toLocaleString('en-IN') : null,
                  ].filter(Boolean)
                  const mapHref = mapLocationHref(item)
                  const locationLabel = preferredLocationLabel(item)
                  const deviceLabel = [item.browser, item.deviceType, item.operatingSystem].filter(Boolean).join(' · ')

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="max-w-4xl">
                        <p className="text-sm font-semibold text-[#20323a]">{authorLabel}</p>
                        {(item.name && item.email) ? (
                          <p className="mt-1 text-xs font-medium text-[#425861]">{item.email}</p>
                        ) : null}
                        {!showTextOnly && metaParts.length > 0 ? (
                          <p className="mt-1 text-xs text-[#6c8189]">{metaParts.join(' · ')}</p>
                        ) : null}
                        <div className="mt-3 rounded-[1rem] border border-[#dcecf0] bg-[#f9fdfe] px-4 py-3">
                          <p className="text-[11px] font-bold tracking-[0.14em] text-[#688089] uppercase">Feedback</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#20323a]">{message}</p>
                        </div>
                        {(locationLabel || item.latitude != null || item.longitude != null || item.locationAccuracy != null || deviceLabel || mapHref) ? (
                          <div className="mt-2 space-y-1 text-xs text-[#6c8189]">
                            {locationLabel ? <p>Location: {locationLabel}</p> : null}
                            {item.locationAccuracy != null ? <p>Accuracy: {Math.round(item.locationAccuracy)} m</p> : null}
                            {deviceLabel ? <p>Device: {deviceLabel}</p> : null}
                            {item.latitude != null && item.longitude != null ? (
                              <p>
                                Coordinates: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                              </p>
                            ) : null}
                            {mapHref ? (
                              <p>
                                <a
                                  href={mapHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-[#2e9bb8] hover:text-[#1e88a4]"
                                >
                                  View Location
                                </a>
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      {showTypeBadge ? (
                        <span className="rounded-full bg-[#edf8fb] px-2.5 py-1 text-xs font-semibold capitalize text-[#2e9bb8]">
                          {item.type.replace('_', ' ')}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </PageLayout>
  )
}

export default MessagesPage

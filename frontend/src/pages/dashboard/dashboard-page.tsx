import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPinIcon, MessageSquareTextIcon, RefreshCwIcon, StarIcon } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageLayout,
  PageTitle,
} from '@/components/layout/page-layout'
import { apiFetch } from '@/lib/api'

type FeedbackSummaryResponse = {
  summary: {
    total: number
    totalRatings: number
    withLocation: number
    withoutLocation: number
    todayTotal: number
    averageRating: number | null
  }
}

type DashboardAnalyticsResponse = {
  summary: {
    totalMessages: number
  }
  ratings: {
    total: number
    average: number | null
  }
}

function formatIstDateValue(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatVisibleDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1))

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(utcDate)
}

function DashboardPage() {
  const refreshIntervalMs = 5_000
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [overallSummary, setOverallSummary] = useState<FeedbackSummaryResponse['summary'] | null>(null)
  const [selectedDateSummary, setSelectedDateSummary] = useState<DashboardAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const activeRequestRef = useRef(0)
  const selectedDate = searchParams.get('date') || formatIstDateValue(new Date())
  const selectedDateLabel = formatVisibleDate(selectedDate)

  const loadDashboard = async (mode: 'initial' | 'refresh' = 'initial') => {
    const requestId = activeRequestRef.current + 1
    activeRequestRef.current = requestId
    const requestTime = Date.now()

    if (mode === 'initial') setLoading(true)
    if (mode === 'refresh') setRefreshing(true)
    setError('')

    try {
      const [overallResponse, selectedDateResponse] = await Promise.all([
        apiFetch(`/feedback?limit=1&page=1&_=${requestTime}`),
        apiFetch(`/analytics/dashboard?startDate=${selectedDate}&endDate=${selectedDate}&timeZoneOffsetMinutes=-330&_=${requestTime}`),
      ])

      if (!overallResponse.ok || !selectedDateResponse.ok) {
        throw new Error('Unable to load dashboard metrics.')
      }

      const overallPayload = (await overallResponse.json()) as FeedbackSummaryResponse
      const selectedDatePayload = (await selectedDateResponse.json()) as DashboardAnalyticsResponse
      if (activeRequestRef.current !== requestId) return

      setOverallSummary(overallPayload.summary)
      setSelectedDateSummary(selectedDatePayload)
    } catch (reason) {
      if (activeRequestRef.current !== requestId) return
      setError(reason instanceof Error ? reason.message : 'Unable to load dashboard metrics.')
    } finally {
      if (activeRequestRef.current !== requestId) return
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadDashboard('refresh')
      }
    }

    const timer = window.setTimeout(() => {
      void loadDashboard('initial')
    }, 0)
    const intervalId = window.setInterval(() => {
      void loadDashboard('refresh')
    }, refreshIntervalMs)

    window.addEventListener('focus', refreshIfVisible)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      activeRequestRef.current += 1
      window.clearTimeout(timer)
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshIfVisible)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [location.key, location.pathname, selectedDate, refreshIntervalMs])

  const summaryCards = useMemo(
    () => [
      {
        title: 'Total Feedback',
        value: overallSummary?.total ?? '-',
        note: 'Overall total feedback received',
        icon: MessageSquareTextIcon,
      },
      {
        title: 'With Location',
        value: overallSummary?.withLocation ?? '-',
        note: 'Feedback entries with shared coordinates',
        icon: MapPinIcon,
      },
      {
        title: 'Without Location',
        value: overallSummary?.withoutLocation ?? '-',
        note: 'Feedback entries submitted without location',
        icon: StarIcon,
      },
      {
        title: 'Received Today',
        value: overallSummary?.todayTotal ?? '-',
        note: 'Feedback received today in IST',
        icon: MessageSquareTextIcon,
      },
    ],
    [overallSummary],
  )

  return (
    <PageLayout className="bg-[linear-gradient(180deg,#eef8fb_0%,#f8fdfe_34%,#f5fbfd_100%)]">
      <PageContainer className="pb-18">
        <div className="mx-auto max-w-6xl space-y-8">
          <PageHeader className="items-start gap-5">
            <PageHeading className="space-y-2">
              <PageTitle className="text-[#20323a]">Dashboard</PageTitle>
              <PageDescription className="text-base text-[#61757d]">
                Monitor your feedback and ratings at a glance.
              </PageDescription>
            </PageHeading>

            <Button
              variant="outline"
              type="button"
              disabled={refreshing}
              onClick={() => void loadDashboard('refresh')}
            >
              <RefreshCwIcon className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </PageHeader>

          {error ? (
            <div className="rounded-[1.35rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => {
              const Icon = item.icon

              return (
                <Card
                  key={item.title}
                  className="border-[#d8ebf0] bg-white shadow-[0_20px_44px_rgba(18,74,88,0.07)]"
                >
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tracking-[0.01em] text-[#5a727a]">
                          {item.title}
                        </p>
                        <p className="mt-4 text-4xl font-bold tracking-tight text-[#20323a] sm:text-[2.35rem]">
                          {loading ? '-' : item.value}
                        </p>
                        <p className="mt-3 text-sm text-[#70858d]">{item.note}</p>
                      </div>

                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#ebf8fb] text-[#2e9bb8]">
                        <Icon className="size-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <Card
            data-testid="selected-date-summary"
            className="border-[#d8ebf0] bg-white shadow-[0_16px_36px_rgba(18,74,88,0.06)]"
          >
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-[0.16em] text-[#2e9bb8] uppercase">Selected Date</p>
                <p className="text-lg font-semibold text-[#20323a]">{selectedDateLabel}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: 'Feedback',
                    value: loading ? '-' : selectedDateSummary?.summary.totalMessages ?? 0,
                  },
                  {
                    label: 'Average Rating',
                    value: loading
                      ? '-'
                      : selectedDateSummary?.ratings.average != null
                        ? `${selectedDateSummary.ratings.average} / 5`
                        : '—',
                  },
                  {
                    label: 'Ratings',
                    value: loading ? '-' : selectedDateSummary?.ratings.total ?? 0,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.15rem] border border-[#dbecef] bg-[#f9fdfe] px-4 py-4"
                  >
                    <p className="text-xs font-semibold tracking-[0.04em] text-[#6b8189]">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[#20323a]">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </PageLayout>
  )
}

export default DashboardPage

import { useEffect, useMemo, useState } from 'react'
import { MessageSquareTextIcon, RefreshCwIcon, StarIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
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
import { apiPath } from '@/lib/api'

type FeedbackResponse = {
  items: Array<{
    id: string
    rating: number | null
    submittedAt: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    total: number
    totalRatings: number
    averageRating: number | null
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

function istDayKey(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value)
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
  const [searchParams] = useSearchParams()
  const [feedbackData, setFeedbackData] = useState<FeedbackResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const selectedDate = searchParams.get('date') || formatIstDateValue(new Date())
  const selectedDateLabel = formatVisibleDate(selectedDate)

  const loadDashboard = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true)
    if (mode === 'refresh') setRefreshing(true)
    setError('')

    try {
      const pageSize = 100
      const firstResponse = await fetch(apiPath(`/feedback?limit=${pageSize}&page=1`), { credentials: 'include' })
      if (!firstResponse.ok) throw new Error('Unable to load dashboard metrics.')

      const firstPage = (await firstResponse.json()) as FeedbackResponse
      const items = [...firstPage.items]

      for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
        const nextResponse = await fetch(apiPath(`/feedback?limit=${pageSize}&page=${page}`), { credentials: 'include' })
        if (!nextResponse.ok) throw new Error('Unable to load dashboard metrics.')
        const nextPage = (await nextResponse.json()) as FeedbackResponse
        items.push(...nextPage.items)
      }

      setFeedbackData({
        ...firstPage,
        items,
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load dashboard metrics.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadDashboard('initial')
  }, [])

  const filteredSummary = useMemo(() => {
    const selectedItems = feedbackData?.items.filter((item) => istDayKey(item.submittedAt) === selectedDate) ?? []
    const ratings = selectedItems
      .map((item) => item.rating)
      .filter((value): value is number => typeof value === 'number')
    const totalRatings = ratings.length
    const averageRating =
      totalRatings > 0 ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / totalRatings) * 10) / 10 : null

    return {
      totalFeedback: selectedItems.length,
      totalRatings,
      averageRating,
    }
  }, [feedbackData?.items, selectedDate])

  const overallSummary = useMemo(
    () => ({
      totalFeedback: feedbackData?.summary.total ?? '-',
      totalRatings: feedbackData?.summary.totalRatings ?? '-',
      averageRating:
        feedbackData?.summary.averageRating != null ? `${feedbackData.summary.averageRating} / 5` : '—',
    }),
    [feedbackData],
  )

  const summaryCards = useMemo(
    () => [
      {
        title: 'Feedback',
        value: overallSummary.totalFeedback,
        note: 'Overall total feedback received',
        icon: MessageSquareTextIcon,
      },
      {
        title: 'Average Rating',
        value: overallSummary.averageRating,
        note: 'Overall average customer rating',
        icon: StarIcon,
      },
      {
        title: 'Total Ratings',
        value: overallSummary.totalRatings,
        note: 'Total ratings received',
        icon: StarIcon,
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

          <section className="grid gap-5 lg:grid-cols-3">
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
                    value: loading ? '-' : filteredSummary.totalFeedback,
                  },
                  {
                    label: 'Average Rating',
                    value: loading
                      ? '-'
                      : filteredSummary.averageRating != null
                        ? `${filteredSummary.averageRating} / 5`
                        : '—',
                  },
                  {
                    label: 'Ratings',
                    value: loading ? '-' : filteredSummary.totalRatings,
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

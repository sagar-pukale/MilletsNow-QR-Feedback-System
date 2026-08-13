import { BarChart3Icon, HeartIcon, LoaderCircleIcon, MessageSquareTextIcon, MoreHorizontalIcon, PackageSearchIcon, RefreshCwIcon, ShieldAlertIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { StatCard } from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { PageContainer, PageDescription, PageHeader, PageHeading, PageLayout, PageTitle } from '@/components/layout/page-layout'
import { apiPath } from '@/lib/api'
import { cn } from '@/lib/utils'

const analyticsTabs = [
  'Message Analytics',
  'Launchpad Analytics',
  'Business Feedback Analytics',
] as const

const metricOptions = [
  { key: 'feedback', label: 'Feedback' },
  { key: 'compliments', label: 'Compliments' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'totalMessages', label: 'Total Messages' },
  { key: 'customers', label: 'Customers' },
  { key: 'scans', label: 'Scans' },
] as const

type MetricKey = (typeof metricOptions)[number]['key']

type AnalyticsResponse = {
  filters: {
    startDate: string
    endDate: string
    productId: string | null
  }
  cards: {
    feedback: number
    compliments: number
    complaints: number
  }
  summary: {
    totalMessages: number
    activeCustomers: number
    averageResponseTimeHours: number | null
    scans: number
  }
  charts: Array<Record<MetricKey | 'day', number | string>>
  productsByMessages: Array<{ name: string; value: number; messages: string; color: string }>
  productOptions: Array<{ id: string; name: string; sku: string }>
}

const chartConfig = {
  feedback: { label: 'Feedback', color: '#6A1634' },
  compliments: { label: 'Compliments', color: '#16A34A' },
  complaints: { label: 'Complaints', color: '#F59E0B' },
  totalMessages: { label: 'Total Messages', color: '#A855F7' },
  customers: { label: 'Customers', color: '#0F766E' },
  scans: { label: 'Scans', color: '#DB2777' },
} satisfies ChartConfig

const emptyStateSubtitle = 'Customer activity will appear here once QR codes are scanned.'

function EmptyAnalyticsState({ icon: Icon, className }: { icon: typeof BarChart3Icon; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', className)}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-secondary text-muted-foreground shadow-xs">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">No Data Available</p>
      <p className="mt-1 max-w-[240px] text-xs leading-5 text-muted-foreground">{emptyStateSubtitle}</p>
    </div>
  )
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftLocalDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function buildDateRange() {
  const today = new Date()
  return {
    startDate: formatLocalDate(shiftLocalDays(today, -29)),
    endDate: formatLocalDate(today),
  }
}

function metricTotal(charts: AnalyticsResponse['charts'], metric: MetricKey) {
  return charts.reduce((sum, row) => sum + Number(row[metric] ?? 0), 0)
}

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<(typeof analyticsTabs)[number]>('Message Analytics')
  const [activeMetric, setActiveMetric] = useState<MetricKey>('feedback')
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const hasLoadedRef = useRef(false)

  const activeMetricLabel = chartConfig[activeMetric].label
  const activeMetricColor = chartConfig[activeMetric].color ?? '#6A1634'
  const { startDate, endDate } = useMemo(() => buildDateRange(), [])

  useEffect(() => {
    let active = true

    const loadAnalytics = async () => {
      const firstLoad = !hasLoadedRef.current
      setError('')
      setLoading(firstLoad)
      setRefreshing(!firstLoad)

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          timeZoneOffsetMinutes: String(new Date().getTimezoneOffset()),
        })

        const response = await fetch(`${apiPath('/analytics/dashboard')}?${params.toString()}`, {
          credentials: 'include',
        })
        const contentType = response.headers.get('content-type') ?? ''

        if (!contentType.includes('application/json')) {
          throw new Error('Analytics endpoint returned a non-JSON response.')
        }

        const body = (await response.json()) as AnalyticsResponse | { error?: string }
        if (!response.ok) {
          throw new Error('error' in body && body.error ? body.error : 'Unable to load dashboard analytics.')
        }

        if (active) {
          setAnalytics(body as AnalyticsResponse)
          hasLoadedRef.current = true
        }
      } catch (reason: unknown) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load dashboard analytics.')
      } finally {
        if (active) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadAnalytics()
    return () => {
      active = false
    }
  }, [endDate, refreshKey, startDate])

  const stats = useMemo(() => ([
    {
      label: 'Feedback',
      value: analytics ? String(analytics.cards.feedback) : '—',
      trend: '',
      trendLabel: loading ? 'Loading...' : error ? 'Unavailable' : 'Last 30 days',
      positive: true,
      icon: MessageSquareTextIcon,
      tone: 'brand' as const,
    },
    {
      label: 'Compliments',
      value: analytics ? String(analytics.cards.compliments) : '—',
      trend: '',
      trendLabel: loading ? 'Loading...' : error ? 'Unavailable' : 'Last 30 days',
      positive: true,
      icon: HeartIcon,
      tone: 'green' as const,
    },
    {
      label: 'Complaints',
      value: analytics ? String(analytics.cards.complaints) : '—',
      trend: '',
      trendLabel: loading ? 'Loading...' : error ? 'Unavailable' : 'Last 30 days',
      positive: true,
      icon: ShieldAlertIcon,
      tone: 'rose' as const,
    },
  ]), [analytics, error, loading])

  const summaryMetrics = useMemo(() => ([
    {
      label: 'Total Messages',
      value: analytics ? String(analytics.summary.totalMessages) : '—',
    },
    {
      label: 'Active Customers',
      value: analytics ? String(analytics.summary.activeCustomers) : '—',
    },
    {
      label: 'Avg. Response Time',
      value: analytics?.summary.averageResponseTimeHours != null ? `${analytics.summary.averageResponseTimeHours}h` : loading ? 'Loading...' : '--',
    },
    {
      label: 'Scans',
      value: analytics ? String(analytics.summary.scans) : '—',
    },
  ]), [analytics, loading])

  const chartData = analytics?.charts ?? []
  const activeMetricTotal = analytics ? metricTotal(chartData, activeMetric) : 0
  const yAxisMax = Math.max(1, ...chartData.map((row) => Number(row[activeMetric] ?? 0)))
  const showEmptyChart = !loading && !error && activeMetricTotal === 0

  return (
    <PageLayout className="bg-[#F7F8FA]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <PageHeader className="mb-1">
            <PageHeading>
              <p className="text-[10px] font-bold tracking-[0.16em] text-primary uppercase">
                Workspace overview
              </p>
              <PageTitle>Dashboard</PageTitle>
              <PageDescription>
                A clear view of your customer messages, product activity, and feedback performance.
              </PageDescription>
            </PageHeading>
            <div className="hidden items-center gap-2 sm:flex">
              <Badge variant="success" className="h-8">
                <span className={cn('size-1.5 rounded-full bg-success', refreshing ? 'animate-pulse' : '')} />
                Live data
              </Badge>
              <Button type="button" variant="outline" size="sm" onClick={() => setRefreshKey((value) => value + 1)}>
                <RefreshCwIcon aria-hidden="true" className={cn(refreshing ? 'animate-spin' : '')} />
                Refresh
              </Button>
            </div>
          </PageHeader>

          {error ? (
            <Card className="border-destructive/30">
              <CardContent className="flex items-center gap-2 p-5 text-sm text-destructive">
                <ShieldAlertIcon className="size-4" />
                {error}
              </CardContent>
            </Card>
          ) : null}

          <section aria-label="Message metrics" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          <div role="tablist" aria-label="Analytics views" className="flex gap-1 overflow-x-auto border-b border-border">
            {analyticsTabs.map((tab) => {
              const selected = activeTab === tab

              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative shrink-0 px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:px-4',
                    selected && 'text-primary',
                  )}
                >
                  {tab}
                  {selected ? <span className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-primary sm:right-4 sm:left-4" /> : null}
                </button>
              )
            })}
          </div>

          <section aria-label={`${activeTab} chart`} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="min-w-0">
              <CardHeader className="gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{activeTab}</CardTitle>
                    <CardDescription className="mt-1">
                      Trends across your workspace for the selected time period.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="More analytics options">
                    <MoreHorizontalIcon aria-hidden="true" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 rounded-xl bg-secondary p-1">
                  {metricOptions.map((metric) => {
                    const selected = activeMetric === metric.key

                    return (
                      <button
                        key={metric.key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setActiveMetric(metric.key)}
                        className={cn(
                          'rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground sm:px-3',
                          selected && 'bg-card text-primary shadow-xs',
                        )}
                      >
                        {metric.label}
                      </button>
                    )
                  })}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-bold tracking-tight text-foreground">
                    {loading ? '—' : activeMetricTotal}
                  </span>
                  <span className="text-xs text-muted-foreground">{activeMetricLabel} in the last 30 days</span>
                </div>
                <div className="relative">
                  <ChartContainer config={chartConfig} className="h-[310px] w-full aspect-auto">
                    <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} />
                      <YAxis domain={[0, yAxisMax]} tickLine={false} axisLine={false} width={42} tickMargin={8} allowDecimals={false} />
                      <ChartTooltip cursor={{ stroke: activeMetricColor, strokeOpacity: 0.14 }} content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey={activeMetric} stroke={activeMetricColor} strokeWidth={3} dot={false} activeDot={{ r: 5, fill: activeMetricColor, stroke: '#fff', strokeWidth: 3 }} />
                    </LineChart>
                  </ChartContainer>
                  {loading ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-card/95 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                        <LoaderCircleIcon className="size-4 animate-spin" />
                        Loading analytics...
                      </div>
                    </div>
                  ) : null}
                  {showEmptyChart ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <EmptyAnalyticsState icon={BarChart3Icon} />
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>High level summary</CardTitle>
                  <CardDescription className="mt-1">A snapshot of business health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summaryMetrics.map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-muted-foreground">{metric.label}</p>
                        <p className="mt-1 font-heading text-lg font-bold text-foreground">{metric.value}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Products by messages</CardTitle>
                  <CardDescription className="mt-1">Highest engagement this period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(analytics?.productsByMessages.length ?? 0) > 0 ? analytics!.productsByMessages.map((product) => (
                    <div key={product.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-semibold text-foreground">{product.name}</span>
                        <span className="shrink-0 font-bold text-muted-foreground">{product.messages}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className={cn('h-full rounded-full transition-all', product.color)} style={{ width: `${product.value}%` }} />
                      </div>
                    </div>
                  )) : loading ? (
                    <div className="flex min-h-[176px] items-center justify-center text-sm text-muted-foreground">
                      Loading products...
                    </div>
                  ) : (
                    <EmptyAnalyticsState icon={PackageSearchIcon} className="min-h-[176px]" />
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </PageContainer>
    </PageLayout>
  )
}

export default DashboardPage

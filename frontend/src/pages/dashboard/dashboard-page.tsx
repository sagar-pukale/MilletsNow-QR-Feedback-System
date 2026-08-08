import { BarChart3Icon, MoreHorizontalIcon, PackageSearchIcon } from 'lucide-react'
import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

import { StatCard } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageLayout,
  PageTitle,
} from '@/components/layout/page-layout'
import { cn } from '@/lib/utils'

import {
  dashboardStats,
  messageAnalyticsData,
  productsByMessages,
  summaryMetrics,
} from './dashboard-data'

const analyticsTabs = [
  'Message Analytics',
  'Launchpad Analytics',
  'Business Feedback Analytics',
] as const

const metricOptions = [
  { key: 'feedback', label: 'Feedback' },
  { key: 'questions', label: 'Questions' },
  { key: 'compliments', label: 'Compliments' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'totalMessages', label: 'Total Messages' },
  { key: 'customers', label: 'Customers' },
  { key: 'scans', label: 'Scans' },
] as const

type MetricKey = (typeof metricOptions)[number]['key']

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

const chartConfig = {
  feedback: { label: 'Feedback', color: '#6A1634' },
  questions: { label: 'Questions', color: '#2563EB' },
  compliments: { label: 'Compliments', color: '#16A34A' },
  complaints: { label: 'Complaints', color: '#F59E0B' },
  totalMessages: { label: 'Total Messages', color: '#A855F7' },
  customers: { label: 'Customers', color: '#0F766E' },
  scans: { label: 'Scans', color: '#DB2777' },
} satisfies ChartConfig

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<(typeof analyticsTabs)[number]>('Message Analytics')
  const [activeMetric, setActiveMetric] = useState<MetricKey>('feedback')
  const activeMetricLabel = chartConfig[activeMetric].label
  const activeMetricColor = chartConfig[activeMetric].color ?? '#6A1634'

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
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                Live data preview
              </Badge>
              <Button type="button" variant="outline" size="sm">
                <MoreHorizontalIcon aria-hidden="true" />
                More actions
              </Button>
            </div>
          </PageHeader>

          <section aria-label="Message metrics" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((stat) => (
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
                    0
                  </span>
                  <span className="text-xs text-muted-foreground">{activeMetricLabel} over 14 days</span>
                </div>
                <div className="relative">
                  <ChartContainer config={chartConfig} className="h-[310px] w-full aspect-auto">
                  <LineChart data={messageAnalyticsData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="day" ticks={['01 May', '07 May', '14 May']} tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} />
                    <YAxis domain={[0, 1]} ticks={[0, 1]} tickLine={false} axisLine={false} width={42} tickMargin={8} />
                    <ChartTooltip cursor={{ stroke: activeMetricColor, strokeOpacity: 0.14 }} content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey={activeMetric} stroke={activeMetricColor} strokeWidth={3} dot={false} activeDot={{ r: 5, fill: activeMetricColor, stroke: '#fff', strokeWidth: 3 }} />
                  </LineChart>
                  </ChartContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <EmptyAnalyticsState icon={BarChart3Icon} />
                  </div>
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
                      {metric.detail ? <span className="text-xs font-bold text-success">{metric.detail}</span> : null}
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Goal completion</span>
                      <span className="text-primary">0%</span>
                    </div>
                    <Progress value={0} className="h-1.5 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-track]]:h-1.5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Products by messages</CardTitle>
                  <CardDescription className="mt-1">Highest engagement this period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {productsByMessages.length ? productsByMessages.map((product) => (
                    <div key={product.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-semibold text-foreground">{product.name}</span>
                        <span className="shrink-0 font-bold text-muted-foreground">{product.messages}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className={cn('h-full rounded-full transition-all', product.color)} style={{ width: `${product.value}%` }} />
                      </div>
                    </div>
                  )) : <EmptyAnalyticsState icon={PackageSearchIcon} className="min-h-[176px]" />}
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

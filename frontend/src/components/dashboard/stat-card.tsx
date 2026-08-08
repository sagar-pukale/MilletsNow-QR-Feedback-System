import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  type LucideIcon,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatCardTone = 'brand' | 'green' | 'amber' | 'blue' | 'rose'

interface StatCardProps {
  label: string
  value: string
  trend: string
  trendLabel: string
  positive: boolean
  icon: LucideIcon
  tone: StatCardTone
}

const toneStyles: Record<StatCardTone, { icon: string; ring: string }> = {
  brand: { icon: 'bg-brand-100 text-brand-700', ring: 'ring-brand-700/10' },
  green: { icon: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-600/10' },
  amber: { icon: 'bg-amber-100 text-amber-700', ring: 'ring-amber-600/10' },
  blue: { icon: 'bg-blue-100 text-blue-700', ring: 'ring-blue-600/10' },
  rose: { icon: 'bg-rose-100 text-rose-700', ring: 'ring-rose-600/10' },
}

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  positive,
  icon: Icon,
  tone,
}: StatCardProps) {
  const TrendIcon = trend.startsWith('-') ? ArrowDownRightIcon : ArrowUpRightIcon

  return (
    <Card size="sm" className="min-w-0 transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xs font-semibold tracking-normal text-muted-foreground">
            {label}
          </CardTitle>
          <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl ring-4', toneStyles[tone].icon, toneStyles[tone].ring)}>
            <Icon aria-hidden="true" className="size-[18px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="font-heading text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {trend ? (
            <span className={cn('inline-flex items-center gap-0.5 font-bold', positive ? 'text-success' : 'text-destructive')}>
              <TrendIcon aria-hidden="true" className="size-3.5" />
              {trend}
            </span>
          ) : null}
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export { StatCard }
export type { StatCardProps }

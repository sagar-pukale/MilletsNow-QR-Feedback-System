import {
  BellRingIcon,
  MessageCircleHeartIcon,
  PackageCheckIcon,
  ScanLineIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ActivityItem = {
  type: string
  title: string
  detail: string
  time: string
}

interface ActivityTimelineProps {
  items: ActivityItem[]
}

const activityStyles: Record<string, { icon: typeof ScanLineIcon; color: string }> = {
  scan: { icon: ScanLineIcon, color: 'bg-brand-100 text-brand-700' },
  feedback: { icon: MessageCircleHeartIcon, color: 'bg-emerald-100 text-emerald-700' },
  complaint: { icon: BellRingIcon, color: 'bg-amber-100 text-amber-700' },
  product: { icon: PackageCheckIcon, color: 'bg-blue-100 text-blue-700' },
}

function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">Live feed</p>
          <CardTitle className="mt-1.5 text-base">Latest activity</CardTitle>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          Live
        </span>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-border">
          {items.map((item) => {
            const style = activityStyles[item.type] ?? activityStyles.scan
            const Icon = style.icon

            return (
              <div key={`${item.title}-${item.time}`} className="relative flex gap-3">
                <div className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card', style.color)}>
                  <Icon aria-hidden="true" className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export { ActivityTimeline }
export type { ActivityTimelineProps }

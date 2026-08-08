import { StarIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface InsightCardProps {
  eyebrow: string
  title: string
  initials: string
  name: string
  time: string
  message: string
  product: string
  badge: string
  tone: 'feedback' | 'complaint' | 'suggestion'
  rating?: string
}

const toneStyles = {
  feedback: {
    icon: 'bg-emerald-100 text-emerald-700',
    badge: 'success' as const,
  },
  complaint: {
    icon: 'bg-rose-100 text-rose-700',
    badge: 'destructive' as const,
  },
  suggestion: {
    icon: 'bg-blue-100 text-blue-700',
    badge: 'info' as const,
  },
}

function InsightCard({
  eyebrow,
  title,
  initials,
  name,
  time,
  message,
  product,
  badge,
  tone,
  rating,
}: InsightCardProps) {
  const styles = toneStyles[tone]

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
            <CardTitle className="mt-1.5 text-base">{title}</CardTitle>
          </div>
          <Badge variant={styles.badge}>{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2.5">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${styles.icon}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
          {rating ? (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-bold text-amber-600">
              <StarIcon aria-hidden="true" className="size-3.5 fill-current" />
              {rating}
            </span>
          ) : null}
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">“{message}”</p>
        <p className="mt-4 truncate text-xs font-semibold text-primary">{product}</p>
      </CardContent>
    </Card>
  )
}

export { InsightCard }
export type { InsightCardProps }

import { InboxIcon, type LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps extends ComponentProps<'div'> {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}

function EmptyState({
  className,
  title,
  description,
  icon: Icon = InboxIcon,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center shadow-soft',
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon aria-hidden="true" className="size-6" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }

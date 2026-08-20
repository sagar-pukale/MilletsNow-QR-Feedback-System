import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusVariants = cva('border-transparent', {
  variants: {
    tone: {
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/15 text-amber-800 dark:text-warning',
      danger: 'bg-danger/10 text-danger',
      info: 'bg-info/10 text-info',
      neutral: 'bg-muted text-muted-foreground',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
})

const statusDotVariants = cva('size-1.5 rounded-full', {
  variants: {
    tone: {
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info',
      neutral: 'bg-muted-foreground',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
})

type StatusProps = Omit<ComponentProps<typeof Badge>, 'variant'> &
  VariantProps<typeof statusVariants>

function Status({ className, tone, children, ...props }: StatusProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusVariants({ tone }), className)}
      {...props}
    >
      <span aria-hidden="true" className={statusDotVariants({ tone })} />
      {children}
    </Badge>
  )
}

export { Status }
export type { StatusProps }

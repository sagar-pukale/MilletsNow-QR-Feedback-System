import type { ComponentProps } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const loadingVariants = {
  inline: 'inline-flex items-center gap-2 text-sm text-muted-foreground',
  panel:
    'flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-soft',
  page: 'flex min-h-[50dvh] w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground',
} as const

const spinnerSizes = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
} as const

interface LoadingProps extends ComponentProps<'div'> {
  label?: string
  variant?: keyof typeof loadingVariants
  size?: keyof typeof spinnerSizes
}

function Loading({
  className,
  label = 'Loading',
  variant = 'inline',
  size = 'md',
  ...props
}: LoadingProps) {
  return (
    <div
      aria-live="polite"
      className={cn(loadingVariants[variant], className)}
      {...props}
    >
      <Spinner className={spinnerSizes[size]} />
      <span>{label}</span>
    </div>
  )
}

interface LoadingSkeletonProps extends ComponentProps<'div'> {
  rows?: number
}

function LoadingSkeleton({
  className,
  rows = 3,
  ...props
}: LoadingSkeletonProps) {
  return (
    <div
      aria-label="Loading content"
      aria-live="polite"
      className={cn('space-y-3', className)}
      {...props}
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4 w-full', index === rows - 1 && 'w-2/3')}
        />
      ))}
    </div>
  )
}

export { Loading, LoadingSkeleton }
export type { LoadingProps, LoadingSkeletonProps }

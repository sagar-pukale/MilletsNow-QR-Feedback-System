import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function PageLayout({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      className={cn('min-w-0 flex-1 px-5 py-7 sm:px-8 sm:py-9 lg:px-10 xl:px-12', className)}
      {...props}
    />
  )
}

function PageContainer({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-(--content-max-width)', className)}
      {...props}
    />
  )
}

function PageHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
      {...props}
    />
  )
}

function PageHeading({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-w-0 space-y-1.5', className)} {...props} />
}

function PageTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn('text-h3 text-foreground sm:text-h2', className)}
      {...props}
    />
  )
}

function PageDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('max-w-3xl text-sm leading-6 text-muted-foreground', className)}
      {...props}
    />
  )
}

function PageActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}
      {...props}
    />
  )
}

function PageContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-w-0 space-y-6', className)} {...props} />
}

export {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeading,
  PageLayout,
  PageTitle,
}

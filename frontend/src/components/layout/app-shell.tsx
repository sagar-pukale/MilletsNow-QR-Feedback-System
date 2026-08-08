import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface AppShellProps extends ComponentProps<'div'> {
  sidebar: ReactNode
  navbar: ReactNode
}

function AppShell({
  className,
  sidebar,
  navbar,
  children,
  ...props
}: AppShellProps) {
  return (
    <div
      className={cn(
        'min-h-dvh bg-background lg:grid lg:grid-cols-[auto_minmax(0,1fr)]',
        className,
      )}
      {...props}
    >
      {sidebar}
      <div className="flex min-h-dvh min-w-0 flex-col">
        {navbar}
        {children}
      </div>
    </div>
  )
}

export { AppShell }
export type { AppShellProps }

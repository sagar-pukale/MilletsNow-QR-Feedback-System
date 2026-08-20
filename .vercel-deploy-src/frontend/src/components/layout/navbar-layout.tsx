import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface NavbarLayoutProps extends ComponentProps<'header'> {
  leading?: ReactNode
  actions?: ReactNode
}

function NavbarLayout({
  className,
  leading,
  children,
  actions,
  ...props
}: NavbarLayoutProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-(--navbar-height) min-h-(--navbar-height) w-full shrink-0 items-center border-b border-border/80 bg-card/95 px-4 shadow-xs backdrop-blur-md sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    >
      {leading ? <div className="mr-3 flex items-center lg:hidden">{leading}</div> : null}
      <div className="min-w-0 flex-1">{children}</div>
      {actions ? <div className="ml-4 flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export { NavbarLayout }
export type { NavbarLayoutProps }

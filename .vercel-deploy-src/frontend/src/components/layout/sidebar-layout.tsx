import type { ComponentProps, ReactElement, ReactNode } from 'react'

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface SidebarLayoutProps extends ComponentProps<'aside'> {
  brand?: ReactNode
  footer?: ReactNode
}

function SidebarLayout({
  className,
  brand,
  children,
  footer,
  ...props
}: SidebarLayoutProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh w-(--sidebar-width) shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex',
        className,
      )}
      {...props}
    >
      {brand ? (
        <div className="flex min-h-(--navbar-height) items-center border-b border-sidebar-border px-5">
          {brand}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col px-3 py-4">{children}</div>
      {footer ? (
        <div className="mt-auto border-t border-sidebar-border p-4">{footer}</div>
      ) : null}
    </aside>
  )
}

interface MobileSidebarProps
  extends Omit<ComponentProps<typeof Sheet>, 'children'> {
  title: string
  trigger: ReactElement
  children: ReactNode
  brand?: ReactNode
  footer?: ReactNode
}

function MobileSidebar({
  title,
  trigger,
  children,
  brand,
  footer,
  ...props
}: MobileSidebarProps) {
  return (
    <Sheet {...props}>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="left"
        className="w-[min(88vw,var(--sidebar-width))] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-(--sidebar-width) lg:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {brand ? (
          <div className="flex min-h-(--navbar-height) items-center border-b border-sidebar-border px-5">
            {brand}
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
          {children}
        </div>
        {footer ? (
          <SheetFooter className="border-t border-sidebar-border p-4">
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export { MobileSidebar, SidebarLayout }
export type { MobileSidebarProps, SidebarLayoutProps }

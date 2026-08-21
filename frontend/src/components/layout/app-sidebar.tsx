import { MenuIcon, XIcon } from 'lucide-react'
import { useMemo, useState, type ComponentProps } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import milletsNowLogo from '@/assets/milletsnow-logo.jpeg'
import {
  platformNavigation,
  supportNavigation,
  type SidebarItemId,
  type SidebarNavigationItem,
} from './sidebar-navigation'

const sidebarDestinations: Record<Exclude<SidebarItemId, 'logout'>, string> = {
  dashboard: '/dashboard',
  messages: '/messages',
  qrcodes: '/qrcodes',
}

function getActiveSidebarItem(pathname: string): SidebarItemId {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/messages')) return 'messages'
  if (pathname.startsWith('/qrcodes')) return 'qrcodes'
  return 'dashboard'
}

interface AppSidebarProps extends ComponentProps<'aside'> {
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

function AppSidebar({ className, mobileOpen: mobileOpenProp, onMobileOpenChange, ...props }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [internalMobileOpen, setInternalMobileOpen] = useState(false)

  const mobileOpen = mobileOpenProp ?? internalMobileOpen
  const activeItem = useMemo(() => getActiveSidebarItem(location.pathname), [location.pathname])

  const setMobileOpen = (nextOpen: boolean) => {
    if (mobileOpenProp === undefined) setInternalMobileOpen(nextOpen)
    onMobileOpenChange?.(nextOpen)
  }

  const handleNavigation = (item: SidebarNavigationItem) => {
    if (item.id === 'logout') {
      void logout().then(() => navigate('/login', { replace: true }))
      return
    }

    navigate(sidebarDestinations[item.id])
  }

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Open navigation menu"
              className="fixed left-4 top-4 z-50 rounded-xl border-[#d4e6eb] bg-white shadow-[0_14px_30px_rgba(14,75,89,0.12)] lg:hidden"
            >
              <MenuIcon className="size-5" />
            </Button>
          }
        />
        <SheetContent
          side="left"
          className="w-[min(86vw,310px)] border-r-0 bg-transparent p-0 shadow-none lg:hidden [&_[data-slot=sheet-close]]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>MilletsNow navigation</SheetTitle>
          </SheetHeader>
          <SidebarPanel
            className="h-full rounded-r-[2rem]"
            activeItem={activeItem}
            onClose={() => setMobileOpen(false)}
            onItemSelect={(item) => {
              handleNavigation(item)
              setMobileOpen(false)
            }}
            mobile
          />
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          'hidden h-dvh w-[290px] shrink-0 border-r border-[#d8ebf0] bg-[linear-gradient(180deg,#f9fdfe_0%,#f3fafc_100%)] lg:block',
          className,
        )}
        {...props}
      >
        <SidebarPanel activeItem={activeItem} onItemSelect={handleNavigation} />
      </aside>
    </>
  )
}

function SidebarPanel({
  activeItem,
  onItemSelect,
  onClose,
  mobile = false,
  className,
}: {
  activeItem: SidebarItemId
  onItemSelect: (item: SidebarNavigationItem) => void
  onClose?: () => void
  mobile?: boolean
  className?: string
}) {
  const groups = [
    { title: 'Workspace', items: platformNavigation },
    { title: 'Account', items: supportNavigation },
  ] as const

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-[#d8ebf0] bg-[radial-gradient(circle_at_top_left,rgba(46,155,184,0.14),transparent_26%),linear-gradient(180deg,#f8fdfe_0%,#edf8fb_100%)]',
        className,
      )}
    >
      <div className="border-b border-[#d8ebf0] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-[1.2rem] border border-[#d6eaf0] bg-white shadow-[0_12px_28px_rgba(22,84,96,0.08)]">
              <img src={milletsNowLogo} alt="MilletsNow" className="h-auto w-11 object-contain" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-[#20323a]">MilletsNow</p>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#5f7881] uppercase">QR Feedback Platform</p>
            </div>
          </div>
          {mobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-xl text-[#4d6770]"
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {groups.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="mb-3 px-2 text-[11px] font-bold tracking-[0.18em] text-[#7a9199] uppercase">{group.title}</p>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const active = activeItem === item.id
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItemSelect(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[1rem] border px-3.5 py-3 text-left text-sm font-semibold transition',
                      active
                        ? 'border-[#2e9bb8] bg-[#ecf8fb] text-[#20323a] shadow-[0_12px_26px_rgba(46,155,184,0.12)]'
                        : 'border-transparent bg-transparent text-[#567078] hover:border-[#d8eaef] hover:bg-white',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl',
                        active ? 'bg-white text-[#2e9bb8]' : 'bg-[#f3fafc] text-[#688089]',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}

export { AppSidebar }
export type { AppSidebarProps }

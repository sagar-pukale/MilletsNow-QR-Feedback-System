import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  WheatIcon,
} from 'lucide-react'
import {
  useState,
  type ComponentProps,
  type ReactElement,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'

import {
  platformNavigation,
  productToolsItem,
  productToolsNavigation,
  supportNavigation,
  type SidebarItemId,
  type SidebarNavigationItem,
} from './sidebar-navigation'

const sidebarDestinations: Partial<Record<SidebarItemId, string>> = {
  dashboard: '/dashboard',
  messages: '/messages',
  products: '/products',
  launchpad: '/product-tools/launchpad',
  forms: '/product-tools/forms',
  campaigns: '/product-tools/campaigns',
  'qr-code-stickers': '/product-tools/qr-code-stickers',
  'business-feedback': '/business-feedback',
  'account-management': '/account-management',
  logout: '/login',
}

function getActiveSidebarItem(pathname: string): SidebarItemId {
  if (pathname === '/dashboard' || pathname === '/') return 'dashboard'
  const match = Object.entries(sidebarDestinations).find(([, path]) => path === pathname)
  if (!match && pathname.startsWith('/products/')) return 'products'
  return (match?.[0] as SidebarItemId | undefined) ?? 'dashboard'
}

interface AppSidebarProps extends Omit<ComponentProps<'aside'>, 'onSelect'> {
  activeItem?: SidebarItemId
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  mobileOpen?: boolean
  defaultMobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  onItemSelect?: (item: SidebarNavigationItem) => void
  mobileTrigger?: ReactElement
}

function AppSidebar({
  className,
  activeItem: activeItemProp,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  mobileOpen: mobileOpenProp,
  defaultMobileOpen = false,
  onMobileOpenChange,
  onItemSelect,
  mobileTrigger,
  ...props
}: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const activeItem = activeItemProp ?? getActiveSidebarItem(location.pathname)
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const [internalMobileOpen, setInternalMobileOpen] = useState(defaultMobileOpen)

  const collapsed = collapsedProp ?? internalCollapsed
  const mobileOpen = mobileOpenProp ?? internalMobileOpen

  const setCollapsed = (nextCollapsed: boolean) => {
    if (collapsedProp === undefined) {
      setInternalCollapsed(nextCollapsed)
    }
    onCollapsedChange?.(nextCollapsed)
  }

  const setMobileOpen = (nextOpen: boolean) => {
    if (mobileOpenProp === undefined) {
      setInternalMobileOpen(nextOpen)
    }
    onMobileOpenChange?.(nextOpen)
  }

  const handleMobileSelect = (item: SidebarNavigationItem) => {
    handleNavigation(item)
    setMobileOpen(false)
  }

  const handleNavigation = (item: SidebarNavigationItem) => {
    onItemSelect?.(item)
    if (item.id === 'logout') { window.localStorage.removeItem('milletsnow-session'); void logout().then(() => navigate('/login', { replace: true })); return }
    const destination = sidebarDestinations[item.id]
    if (destination) navigate(destination)
  }

  return (
    <TooltipProvider delay={250}>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            mobileTrigger ?? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="fixed top-3 left-4 z-40 bg-card shadow-soft lg:hidden"
              >
                <MenuIcon aria-hidden="true" />
              </Button>
            )
          }
        />
        <SheetContent
          side="left"
          className="w-[min(88vw,280px)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-floating sm:max-w-[280px] lg:hidden [&_[data-slot=sheet-close]]:text-sidebar-foreground [&_[data-slot=sheet-close]]:hover:bg-white/10"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>MilletsNow navigation</SheetTitle>
          </SheetHeader>
          <SidebarPanel
            activeItem={activeItem}
            collapsed={false}
            mobile
            onItemSelect={handleMobileSelect}
          />
        </SheetContent>
      </Sheet>

      <aside
        data-collapsed={collapsed}
        className={cn(
          'sticky top-0 hidden h-dvh w-[280px] shrink-0 overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-soft transition-[width] duration-300 ease-out lg:block data-[collapsed=true]:w-20',
          className,
        )}
        {...props}
      >
        <SidebarPanel
          activeItem={activeItem}
          collapsed={collapsed}
          onCollapsedChange={() => setCollapsed(!collapsed)}
          onItemSelect={handleNavigation}
        />
      </aside>
    </TooltipProvider>
  )
}

interface SidebarPanelProps {
  activeItem: SidebarItemId
  collapsed: boolean
  mobile?: boolean
  onCollapsedChange?: () => void
  onItemSelect?: (item: SidebarNavigationItem) => void
}

function SidebarPanel({
  activeItem,
  collapsed,
  mobile = false,
  onCollapsedChange,
  onItemSelect,
}: SidebarPanelProps) {
  const [productToolsExpanded, setProductToolsExpanded] = useState(true)

  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_32%)]">
      <SidebarBrand collapsed={collapsed} />

      {!mobile ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onCollapsedChange}
          className="absolute top-[4.55rem] -right-3 z-20 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-soft hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? (
            <ChevronRightIcon aria-hidden="true" />
          ) : (
            <ChevronLeftIcon aria-hidden="true" />
          )}
        </Button>
      ) : null}

      <nav
        aria-label="Primary navigation"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]"
      >
        <SidebarSectionLabel collapsed={collapsed}>Menu</SidebarSectionLabel>
        <div className="space-y-1">
          {platformNavigation.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              active={activeItem === item.id}
              collapsed={collapsed}
              onSelect={onItemSelect}
            />
          ))}
          <SidebarNavItem
            item={productToolsItem}
            active={productToolsNavigation.some((item) => item.id === activeItem)}
            collapsed={collapsed}
            expandable
            expanded={productToolsExpanded}
            onExpand={() => setProductToolsExpanded((expanded) => !expanded)}
            onSelect={onItemSelect}
          />
          {!collapsed && productToolsExpanded ? (
            <div className="ml-4 space-y-1 border-l border-white/12 pl-3">
              {productToolsNavigation.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  active={activeItem === item.id}
                  collapsed={false}
                  subItem
                  onSelect={onItemSelect}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-auto border-t border-white/10 pt-4">
          <SidebarSectionLabel collapsed={collapsed}>Bottom menu</SidebarSectionLabel>
          <div className="space-y-1">
            {supportNavigation.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                active={activeItem === item.id}
                collapsed={collapsed}
                danger={item.id === 'logout'}
                onSelect={onItemSelect}
              />
            ))}
          </div>
        </div>
      </nav>

      <SidebarFooter
        collapsed={collapsed}
      />
    </div>
  )
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        'flex h-(--navbar-height) min-h-(--navbar-height) shrink-0 items-center border-b border-sidebar-border px-4 transition-all duration-300',
        collapsed && 'justify-center px-3',
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-soft ring-1 ring-white/50">
        <WheatIcon aria-hidden="true" className="size-6" />
      </div>
      <div
        aria-hidden={collapsed}
        className={cn(
          'ml-3 min-w-0 overflow-hidden whitespace-nowrap transition-[width,opacity,transform] duration-200',
          collapsed
            ? 'ml-0 w-0 -translate-x-2 opacity-0'
            : 'w-[180px] translate-x-0 opacity-100',
        )}
      >
        <p className="font-heading text-lg leading-tight font-bold tracking-tight text-white">
          MilletsNow
        </p>
        <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-white/55">
          QR Feedback Platform
        </p>
      </div>
    </div>
  )
}

interface SidebarSectionLabelProps extends ComponentProps<'p'> {
  collapsed: boolean
}

function SidebarSectionLabel({
  collapsed,
  className,
  children,
  ...props
}: SidebarSectionLabelProps) {
  return (
    <p
      aria-hidden={collapsed}
      className={cn(
        'mb-2 h-4 overflow-hidden px-3 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap text-white/35 uppercase transition-[height,opacity] duration-200',
        collapsed && 'mb-1 h-0 opacity-0',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  )
}

interface SidebarNavItemProps {
  item: SidebarNavigationItem
  active: boolean
  collapsed: boolean
  danger?: boolean
  expandable?: boolean
  expanded?: boolean
  subItem?: boolean
  onExpand?: () => void
  onSelect?: (item: SidebarNavigationItem) => void
}

function SidebarNavItem({
  item,
  active,
  collapsed,
  danger = false,
  expandable = false,
  expanded = false,
  subItem = false,
  onExpand,
  onSelect,
}: SidebarNavItemProps) {
  const Icon = item.icon
  const navButton = (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      onClick={() => {
        onSelect?.(item)
        onExpand?.()
      }}
      className={cn(
        'group relative flex h-10 w-full items-center gap-3 overflow-hidden rounded-xl px-3 text-left text-sm font-semibold text-white/68 transition-[color,background-color,box-shadow,transform] duration-200 outline-none hover:translate-x-0.5 hover:bg-white/9 hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring/70',
        active &&
          'bg-white text-primary shadow-soft hover:translate-x-0 hover:bg-white hover:text-primary',
        danger && !active && 'hover:bg-danger/20 hover:text-red-100',
        collapsed && 'justify-center px-0 hover:translate-x-0',
        subItem && 'h-9 text-xs font-medium text-white/55',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105',
          active && 'text-primary',
        )}
      />
      <span
        className={cn(
          'min-w-0 truncate transition-[width,opacity,transform] duration-200',
          collapsed
            ? 'w-0 -translate-x-2 opacity-0'
            : 'w-auto translate-x-0 opacity-100',
        )}
      >
        {item.label}
      </span>
      {expandable && !collapsed ? (
        <ChevronDownIcon
          aria-hidden="true"
          className={cn(
            'ml-auto size-4 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      ) : active && !collapsed ? (
        <span
          aria-hidden="true"
          className="ml-auto size-1.5 shrink-0 rounded-full bg-primary"
        />
      ) : null}
    </button>
  )

  if (!collapsed) {
    return navButton
  }

  return (
    <Tooltip>
      <TooltipTrigger render={navButton} />
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

interface SidebarFooterProps {
  collapsed: boolean
}

function SidebarFooter({ collapsed }: SidebarFooterProps) {
  if (collapsed) {
    return (
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                role="status"
                aria-label="MilletsNow QR Feedback Platform — Ready to Use"
                className="flex h-10 items-center justify-center rounded-xl bg-white/8 text-emerald-400"
              >
                <span className="size-2 rounded-full bg-emerald-400" />
              </div>
            }
          />
          <TooltipContent side="right" sideOffset={10}>
            MilletsNow QR Feedback Platform · Ready to Use
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-sidebar-border px-4 py-5 text-center">
      <p className="text-xs font-semibold tracking-tight text-white">MilletsNow QR Feedback Platform</p>
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium text-white/60">
        <span>Workspace Status</span>
        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
        <span className="text-emerald-300">Ready to Use</span>
      </div>
    </div>
  )
}

export { AppSidebar }
export type { AppSidebarProps }

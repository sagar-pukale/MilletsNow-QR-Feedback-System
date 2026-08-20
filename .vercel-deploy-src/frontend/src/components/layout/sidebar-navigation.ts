import {
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  QrCodeIcon,
  type LucideIcon,
} from 'lucide-react'

type SidebarItemId =
  | 'dashboard'
  | 'messages'
  | 'qrcodes'
  | 'logout'

interface SidebarNavigationItem {
  id: SidebarItemId
  label: string
  icon: LucideIcon
}

const platformNavigation: readonly SidebarNavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { id: 'messages', label: 'Feedback', icon: MessageSquareIcon },
  { id: 'qrcodes', label: 'QR Code', icon: QrCodeIcon },
]

const supportNavigation: readonly SidebarNavigationItem[] = [
  { id: 'logout', label: 'Logout', icon: LogOutIcon },
]

export {
  platformNavigation,
  supportNavigation,
}
export type { SidebarItemId, SidebarNavigationItem }

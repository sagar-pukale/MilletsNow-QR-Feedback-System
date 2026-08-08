import {
  BriefcaseBusinessIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  PackageIcon,
  PanelsTopLeftIcon,
  QrCodeIcon,
  UsersRoundIcon,
  WrenchIcon,
  type LucideIcon,
} from 'lucide-react'

type SidebarItemId =
  | 'dashboard'
  | 'messages'
  | 'products'
  | 'product-tools'
  | 'launchpad'
  | 'forms'
  | 'campaigns'
  | 'qr-code-stickers'
  | 'business-feedback'
  | 'account-management'
  | 'logout'

interface SidebarNavigationItem {
  id: SidebarItemId
  label: string
  icon: LucideIcon
}

const platformNavigation: readonly SidebarNavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { id: 'messages', label: 'Messages', icon: MessageSquareIcon },
  { id: 'products', label: 'Products', icon: PackageIcon },
]

const productToolsItem: SidebarNavigationItem = {
  id: 'product-tools',
  label: 'Product Tools',
  icon: WrenchIcon,
}

const productToolsNavigation: readonly SidebarNavigationItem[] = [
  { id: 'launchpad', label: 'Launchpad', icon: PanelsTopLeftIcon },
  { id: 'forms', label: 'Forms', icon: FileTextIcon },
  { id: 'campaigns', label: 'Campaigns', icon: BriefcaseBusinessIcon },
  { id: 'qr-code-stickers', label: 'QR Code Stickers', icon: QrCodeIcon },
]

const supportNavigation: readonly SidebarNavigationItem[] = [
  { id: 'business-feedback', label: 'Business Feedback', icon: MessageSquareIcon },
  { id: 'account-management', label: 'Account Management', icon: UsersRoundIcon },
  { id: 'logout', label: 'Logout', icon: LogOutIcon },
]

export {
  platformNavigation,
  productToolsItem,
  productToolsNavigation,
  supportNavigation,
}
export type { SidebarItemId, SidebarNavigationItem }

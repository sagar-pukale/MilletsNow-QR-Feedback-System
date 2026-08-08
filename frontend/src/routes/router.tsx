import { createBrowserRouter } from 'react-router-dom'

import App from '@/App'
import DashboardPage from '@/pages/dashboard/dashboard-page'
import ProductsPage from '@/pages/products/products-page'
import ProductDetailsPage from '@/pages/products/product-details-page'
import QRCodesPage from '@/pages/qrcodes/qrcodes-page'
import QRCodeDetailsPage from '@/pages/qrcodes/qrcode-details-page'
import PrintLabelPage from '@/pages/qrcodes/print-label-page'
import ScanPage from '@/pages/scan/scan-page'
import FeedbackPage from '@/pages/scan/feedback-page'
import MessagesPage from '@/pages/messages/messages-page'
import ModulePlaceholderPage from '@/pages/common/module-placeholder-page'
import LoginPage from '@/pages/auth/login-page'
import { RocketIcon, FileTextIcon, BriefcaseBusinessIcon, QrCodeIcon, MessageSquareIcon, UsersRoundIcon } from 'lucide-react'

export const router = createBrowserRouter([
  { path: '/scan/:qrToken/feedback', Component: FeedbackPage },
  { path: '/scan/:qrToken', Component: ScanPage },
  { path: '/login', Component: LoginPage },
  {
    path: '/',
    Component: App,
    children: [
      {
        path: 'dashboard',
        Component: DashboardPage,
      },
      { index: true, Component: DashboardPage },
      { path: 'messages', Component: MessagesPage },
      { path: 'products', Component: ProductsPage },
      { path: 'products/:id', Component: ProductDetailsPage },
      { path: 'qrcodes', Component: QRCodesPage },
      { path: 'qrcodes/:id', Component: QRCodeDetailsPage },
      { path: 'qrcodes/print', Component: PrintLabelPage },
      { path: 'product-tools/launchpad', element: <ModulePlaceholderPage title="Launchpad" description="Create and organize product launch experiences." emptyTitle="No launchpads yet" icon={RocketIcon} /> },
      { path: 'product-tools/forms', element: <ModulePlaceholderPage title="Forms" description="Build customer forms for your product experiences." emptyTitle="No forms yet" icon={FileTextIcon} /> },
      { path: 'product-tools/campaigns', element: <ModulePlaceholderPage title="Campaigns" description="Plan and monitor customer engagement campaigns." emptyTitle="No campaigns yet" icon={BriefcaseBusinessIcon} /> },
      { path: 'product-tools/qr-code-stickers', element: <ModulePlaceholderPage title="QR Code Stickers" description="Prepare QR labels for your product packaging." emptyTitle="No sticker projects yet" icon={QrCodeIcon} /> },
      { path: 'business-feedback', element: <ModulePlaceholderPage title="Business Feedback" description="Understand feedback about your business experience." emptyTitle="No business feedback yet" icon={MessageSquareIcon} /> },
      { path: 'account-management', element: <ModulePlaceholderPage title="Account Management" description="Manage workspace preferences and account details." emptyTitle="Account setup is ready" icon={UsersRoundIcon} /> },
    ],
  },
])

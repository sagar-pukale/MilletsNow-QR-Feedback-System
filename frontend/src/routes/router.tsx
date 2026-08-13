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
import CustomerThankYouPage from '@/pages/scan/thank-you-page'
import MessagesPage from '@/pages/messages/messages-page'
import FormsPage from '@/pages/product-tools/forms-page'
import LaunchpadPage from '@/pages/product-tools/launchpad-page'
import QRCodeStickersPage from '@/pages/product-tools/qr-code-stickers-page'
import ModulePlaceholderPage from '@/pages/common/module-placeholder-page'
import LoginPage from '@/pages/auth/login-page'
import { BriefcaseBusinessIcon, MessageSquareIcon, UsersRoundIcon } from 'lucide-react'

export const router = createBrowserRouter([
  { path: '/scan/:qrToken/thank-you', Component: CustomerThankYouPage },
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
      { path: 'product-tools/launchpad', Component: LaunchpadPage },
      { path: 'product-tools/forms', Component: FormsPage },
      { path: 'product-tools/campaigns', element: <ModulePlaceholderPage title="Campaigns" description="Plan and monitor customer engagement campaigns." emptyTitle="No campaigns yet" icon={BriefcaseBusinessIcon} /> },
      { path: 'product-tools/qr-code-stickers', Component: QRCodeStickersPage },
      { path: 'business-feedback', element: <ModulePlaceholderPage title="Business Feedback" description="Understand feedback about your business experience." emptyTitle="No business feedback yet" icon={MessageSquareIcon} /> },
      { path: 'account-management', element: <ModulePlaceholderPage title="Account Management" description="Manage workspace preferences and account details." emptyTitle="Account setup is ready" icon={UsersRoundIcon} /> },
    ],
  },
])

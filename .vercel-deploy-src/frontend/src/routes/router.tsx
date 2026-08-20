import { Settings2Icon } from 'lucide-react'
import { createBrowserRouter } from 'react-router-dom'

import App from '@/App'
import DashboardPage from '@/pages/dashboard/dashboard-page'
import QRCodesPage from '@/pages/qrcodes/qrcodes-page'
import ScanPage from '@/pages/scan/scan-page'
import CommonFeedbackPage from '@/pages/scan/common-feedback-page'
import FeedbackPage from '@/pages/scan/feedback-page'
import CustomerThankYouPage from '@/pages/scan/thank-you-page'
import MessagesPage from '@/pages/messages/messages-page'
import ModulePlaceholderPage from '@/pages/common/module-placeholder-page'
import LoginPage from '@/pages/auth/login-page'

export const router = createBrowserRouter([
  { path: '/scan/thank-you', Component: CustomerThankYouPage },
  { path: '/scan', Component: CommonFeedbackPage },
  { path: '/scan/:qrToken/thank-you', Component: CustomerThankYouPage },
  { path: '/scan/:qrToken/feedback', Component: FeedbackPage },
  { path: '/scan/:qrToken', Component: ScanPage },
  { path: '/', Component: LoginPage },
  { path: '/login', Component: LoginPage },
  {
    path: '/',
    Component: App,
    children: [
      {
        path: 'dashboard',
        Component: DashboardPage,
      },
      { path: 'messages', Component: MessagesPage },
      { path: 'qrcodes', Component: QRCodesPage },
      {
        path: 'settings',
        element: (
          <ModulePlaceholderPage
            title="Settings"
            description="Manage admin preferences for the MilletsNow QR feedback workspace."
            emptyTitle="Settings are ready"
            icon={Settings2Icon}
          />
        ),
      },
    ],
  },
])

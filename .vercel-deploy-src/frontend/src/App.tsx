import { Outlet } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { DashboardNavbar } from '@/components/layout/dashboard-navbar'
import { AuthGate } from '@/context/auth-context'

function App() {
  return <AuthGate><AppShell sidebar={<AppSidebar />} navbar={<DashboardNavbar />}><Outlet /></AppShell></AuthGate>
}

export default App

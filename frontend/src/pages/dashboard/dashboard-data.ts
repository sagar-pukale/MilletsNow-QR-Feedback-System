import type { LucideIcon } from 'lucide-react'
import {
  HelpCircleIcon,
  HeartIcon,
  MessageSquareTextIcon,
  ShieldAlertIcon,
} from 'lucide-react'

export type DashboardStat = {
  label: string
  value: string
  trend: string
  trendLabel: string
  positive: boolean
  icon: LucideIcon
  tone: 'brand' | 'green' | 'amber' | 'blue' | 'rose'
}

export const dashboardStats: DashboardStat[] = [
  {
    label: 'Feedback',
    value: '0',
    trend: '',
    trendLabel: 'No activity yet',
    positive: true,
    icon: MessageSquareTextIcon,
    tone: 'brand',
  },
  {
    label: 'Questions',
    value: '0',
    trend: '',
    trendLabel: 'No activity yet',
    positive: true,
    icon: HelpCircleIcon,
    tone: 'blue',
  },
  {
    label: 'Compliments',
    value: '0',
    trend: '',
    trendLabel: 'No activity yet',
    positive: true,
    icon: HeartIcon,
    tone: 'green',
  },
  {
    label: 'Complaints',
    value: '0',
    trend: '',
    trendLabel: 'No activity yet',
    positive: true,
    icon: ShieldAlertIcon,
    tone: 'rose',
  },
]

export const messageAnalyticsData: Array<Record<string, number | string>> = []

export const productsByMessages: Array<{ name: string; value: number; messages: string; color: string }> = []

export const summaryMetrics = [
  { label: 'Total Messages', value: '0', detail: '', positive: true },
  { label: 'Active Customers', value: '0', detail: '', positive: true },
  { label: 'Avg. Response Time', value: '--', detail: '', positive: true },
  { label: 'Resolution Rate', value: '--', detail: '', positive: true },
]

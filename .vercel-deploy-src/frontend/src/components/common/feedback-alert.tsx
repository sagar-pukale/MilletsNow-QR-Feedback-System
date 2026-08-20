import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

const alertIcons = {
  default: InfoIcon,
  info: InfoIcon,
  success: CheckCircle2Icon,
  warning: TriangleAlertIcon,
  destructive: AlertCircleIcon,
} as const

type FeedbackAlertTone = keyof typeof alertIcons

interface FeedbackAlertProps
  extends Omit<ComponentProps<typeof Alert>, 'title' | 'variant'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: FeedbackAlertTone
}

function FeedbackAlert({
  title,
  description,
  action,
  tone = 'default',
  ...props
}: FeedbackAlertProps) {
  const Icon = alertIcons[tone]

  return (
    <Alert variant={tone} {...props}>
      <Icon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      {description ? <AlertDescription>{description}</AlertDescription> : null}
      {action ? <AlertAction>{action}</AlertAction> : null}
    </Alert>
  )
}

export { FeedbackAlert }
export type { FeedbackAlertProps, FeedbackAlertTone }

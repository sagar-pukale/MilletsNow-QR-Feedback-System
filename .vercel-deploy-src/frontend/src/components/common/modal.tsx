import type { ComponentProps, ReactElement, ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const modalSizes = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
} as const

interface ModalProps extends Omit<ComponentProps<typeof Dialog>, 'children'> {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  trigger?: ReactElement
  size?: keyof typeof modalSizes
  contentClassName?: string
  showCloseButton?: boolean
}

function Modal({
  title,
  description,
  children,
  footer,
  trigger,
  size = 'md',
  contentClassName,
  showCloseButton = true,
  ...props
}: ModalProps) {
  return (
    <Dialog {...props}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          'max-h-[calc(100dvh-2rem)] overflow-y-auto',
          modalSizes[size],
          contentClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div>{children}</div>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}

export { Modal }
export type { ModalProps }

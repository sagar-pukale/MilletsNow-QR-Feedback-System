import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ElementType } from 'react'

import { cn } from '@/lib/utils'

const headingVariants = cva('font-heading font-bold tracking-tight text-foreground', {
  variants: {
    size: {
      display: 'text-display',
      h1: 'text-h1',
      h2: 'text-h2',
      h3: 'text-h3',
      h4: 'text-h4',
    },
  },
  defaultVariants: {
    size: 'h2',
  },
})

interface HeadingProps
  extends Omit<ComponentProps<'h2'>, 'children'>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children?: ComponentProps<'h2'>['children']
}

function Heading({
  as = 'h2',
  size,
  className,
  ...props
}: HeadingProps) {
  const Component: ElementType = as

  return (
    <Component className={cn(headingVariants({ size }), className)} {...props} />
  )
}

const textVariants = cva('text-foreground', {
  variants: {
    size: {
      large: 'text-base leading-relaxed',
      default: 'text-[0.9375rem] leading-6',
      small: 'text-sm leading-5',
      caption: 'text-xs leading-4 font-semibold',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-amber-800 dark:text-warning',
      danger: 'text-danger',
    },
  },
  defaultVariants: {
    size: 'default',
    tone: 'default',
  },
})

interface TextProps
  extends Omit<ComponentProps<'p'>, 'children'>,
    VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div'
  children?: ComponentProps<'p'>['children']
}

function Text({ as = 'p', size, tone, className, ...props }: TextProps) {
  const Component: ElementType = as

  return (
    <Component className={cn(textVariants({ size, tone }), className)} {...props} />
  )
}

export { Heading, Text }
export type { HeadingProps, TextProps }

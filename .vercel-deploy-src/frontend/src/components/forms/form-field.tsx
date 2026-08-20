import {
  cloneElement,
  useId,
  type ComponentProps,
  type ReactElement,
} from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: string
  children: ReactElement<{
    id?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    required?: boolean
  }>
  description?: string
  error?: string
  required?: boolean
}

function FormField({
  className,
  label,
  children,
  description,
  error,
  required,
  ...props
}: FormFieldProps) {
  const generatedId = useId()
  const inputId = children.props.id ?? generatedId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [
    children.props['aria-describedby'],
    descriptionId,
    errorId,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cn('grid gap-2', className)} {...props}>
      <Label htmlFor={inputId}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {cloneElement(children, {
        id: inputId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': Boolean(error),
        required: required || children.props.required,
      })}
      {description ? (
        <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { FormField }
export type { FormFieldProps }

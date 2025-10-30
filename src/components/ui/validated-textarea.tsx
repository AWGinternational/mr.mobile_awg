"use client"

import React from 'react'
import { Label } from './label'
import { cn } from '@/lib/utils'

// Textarea component (if not already exists)
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

interface ValidatedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onBlur' | 'onChange'> {
  label: string
  error?: string[]
  touched?: boolean
  onValueChange?: (value: string) => void
  onBlur?: () => void
  helpText?: string
  required?: boolean
}

export function ValidatedTextarea({
  label,
  error,
  touched,
  onValueChange,
  onBlur,
  helpText,
  required,
  className,
  ...props
}: ValidatedTextareaProps) {
  const hasError = touched && error && error.length > 0
  const isValid = touched && !hasError

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange?.(e.target.value)
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    onBlur?.()
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        <Textarea
          {...props}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            className,
            hasError && "border-red-500 focus:border-red-500 focus:ring-red-500",
            isValid && "border-green-500 focus:border-green-500 focus:ring-green-500"
          )}
        />

        {/* Success indicator */}
        {isValid && (
          <div className="absolute top-2 right-2">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && !hasError && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {/* Error messages */}
      {hasError && (
        <div className="space-y-1">
          {error.map((errorMsg, index) => (
            <p key={index} className="text-xs text-red-600 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errorMsg}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
"use client"

import React from 'react'
import { Input } from './input'
import { Label } from './label'
import { cn } from '@/lib/utils'

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onBlur' | 'onChange'> {
  label: string
  error?: string[]
  touched?: boolean
  onValueChange?: (value: string) => void
  onBlur?: () => void
  helpText?: string
  required?: boolean
  loading?: boolean
  loadingText?: string
}

export function ValidatedInput({
  label,
  error,
  touched,
  onValueChange,
  onBlur,
  helpText,
  required,
  loading = false,
  loadingText,
  className,
  ...props
}: ValidatedInputProps) {
  const hasError = touched && error && error.length > 0
  const isValid = touched && !hasError

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.()
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          {...props}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading || props.disabled}
          className={cn(
            className,
            hasError && "border-red-500 focus:border-red-500 focus:ring-red-500",
            isValid && "border-green-500 focus:border-green-500 focus:ring-green-500",
            loading && "opacity-50 cursor-not-allowed"
          )}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-4 w-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {/* Success indicator */}
        {!loading && isValid && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Loading text */}
      {loading && loadingText && (
        <p className="text-xs text-blue-600 flex items-center gap-1">
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </p>
      )}
      
      {/* Help text */}
      {!loading && helpText && !hasError && (
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
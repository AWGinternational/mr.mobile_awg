"use client"

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Label } from './label'
import { cn } from '@/lib/utils'

interface ValidatedSelectProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  error?: string[]
  touched?: boolean
  helpText?: string
  required?: boolean
  placeholder?: string
  options: { value: string; label: string }[]
  className?: string
  disabled?: boolean
  loading?: boolean
  loadingText?: string
}

export function ValidatedSelect({
  label,
  value,
  onValueChange,
  onBlur,
  error,
  touched,
  helpText,
  required,
  placeholder,
  options,
  className,
  disabled,
  loading = false,
  loadingText
}: ValidatedSelectProps) {
  const hasError = touched && error && error.length > 0
  const isValid = touched && !hasError && value

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Select 
          value={value} 
          onValueChange={onValueChange}
          disabled={loading || disabled}
        >
          <SelectTrigger 
            className={cn(
              className,
              hasError && "border-red-500 focus:border-red-500 focus:ring-red-500",
              isValid && "border-green-500 focus:border-green-500 focus:ring-green-500",
              loading && "opacity-50 cursor-not-allowed"
            )}
            onBlur={onBlur}
          >
            <SelectValue placeholder={loading ? "Loading..." : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="__loading__" disabled>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading options...
                </div>
              </SelectItem>
            ) : (
              options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-8 flex items-center pr-3 pointer-events-none">
            <svg className="h-4 w-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {/* Success indicator */}
        {!loading && isValid && (
          <div className="absolute inset-y-0 right-8 flex items-center pr-3 pointer-events-none">
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
"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  className?: string
  children: React.ReactNode
}

export function LoadingOverlay({ 
  isLoading, 
  message = "Loading...", 
  className,
  children 
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-md">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface FormLoadingStateProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
}

export function FormLoadingState({ 
  isLoading, 
  message = "Processing...", 
  children 
}: FormLoadingStateProps) {
  return (
    <div className="relative">
      <div className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-50 pointer-events-none"
      )}>
        {children}
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-md">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-700 font-medium">{message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
            index < currentStep 
              ? "bg-green-500 text-white" 
              : index === currentStep 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200 text-gray-500"
          )}>
            {index < currentStep ? "✓" : index + 1}
          </div>
          <span className={cn(
            "ml-2 text-sm font-medium transition-colors",
            index <= currentStep ? "text-gray-900" : "text-gray-500"
          )}>
            {step}
          </span>
          {index < steps.length - 1 && (
            <div className={cn(
              "w-12 h-0.5 mx-4 transition-colors",
              index < currentStep ? "bg-green-500" : "bg-gray-200"
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

interface ButtonLoadingStateProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
}

export function ButtonLoadingState({ 
  isLoading, 
  loadingText = "Loading...", 
  children, 
  variant = 'primary',
  className,
  ...props 
}: ButtonLoadingStateProps) {
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white", 
    danger: "bg-red-600 hover:bg-red-700 text-white"
  }

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

interface DataLoadingStateProps {
  isLoading: boolean
  error?: string | null
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
  className?: string
}

export function DataLoadingState({ 
  isLoading, 
  error, 
  isEmpty = false,
  emptyMessage = "No data available",
  children, 
  className 
}: DataLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 font-medium">Error loading data</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return <div className={className}>{children}</div>
}
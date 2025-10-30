"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'

interface FormProgressProps {
  steps: {
    id: string
    title: string
    description?: string
  }[]
  currentStep: number
  completedSteps?: number[]
  className?: string
}

export function FormProgress({ steps, currentStep, completedSteps = [], className }: FormProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index)
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <div key={step.id} className="flex items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isCurrent && "bg-blue-500 border-blue-500 text-white",
                    isUpcoming && "bg-gray-100 border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Step title and description */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isCompleted && "text-green-600",
                      isCurrent && "text-blue-600",
                      isUpcoming && "text-gray-400"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1 max-w-24">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors duration-200",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface OptimisticUpdateProps {
  isUpdating: boolean
  children: React.ReactNode
  updateMessage?: string
  className?: string
}

export function OptimisticUpdate({ 
  isUpdating, 
  children, 
  updateMessage = "Updating...",
  className 
}: OptimisticUpdateProps) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "transition-all duration-200",
        isUpdating && "opacity-75"
      )}>
        {children}
      </div>
      
      {isUpdating && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            {updateMessage}
          </div>
        </div>
      )}
    </div>
  )
}

interface FormFieldLockProps {
  isLocked: boolean
  children: React.ReactNode
  lockMessage?: string
}

export function FormFieldLock({ isLocked, children, lockMessage = "Form is being processed..." }: FormFieldLockProps) {
  return (
    <div className="relative">
      <div className={cn(
        "transition-all duration-200",
        isLocked && "opacity-50 pointer-events-none"
      )}>
        {children}
      </div>
      
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-md">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            {lockMessage}
          </div>
        </div>
      )}
    </div>
  )
}

interface SubmitButtonWithLoadingProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function SubmitButtonWithLoading({ 
  isLoading, 
  loadingText = "Processing...", 
  children, 
  className,
  ...props 
}: SubmitButtonWithLoadingProps) {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
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
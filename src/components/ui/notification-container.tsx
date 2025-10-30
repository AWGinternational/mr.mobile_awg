"use client"

import React from 'react'
import { useNotifications } from '@/contexts/notification-context'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from './button'

// Notification item component
interface NotificationItemProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  onDismiss: (id: string) => void
}

function NotificationItem({ id, type, title, message, onDismiss }: NotificationItemProps) {
  // Icon mapping
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }

  // Color mapping
  const colorMap = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  // Icon color mapping
  const iconColorMap = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  }

  const Icon = iconMap[type]

  return (
    <div
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${colorMap[type]}
        animate-in slide-in-from-right-full duration-300
        max-w-sm w-full
      `}
    >
      {/* Icon */}
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColorMap[type]}`} />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        {message && (
          <p className="mt-1 text-sm opacity-90">{message}</p>
        )}
      </div>
      
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-black/10"
        onClick={() => onDismiss(id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Main notification container component
export function NotificationContainer() {
  const { notifications, hideNotification } = useNotifications()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onDismiss={hideNotification}
          />
        ))}
      </div>
    </div>
  )
}
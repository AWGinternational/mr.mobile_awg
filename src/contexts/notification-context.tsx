"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Notification data interface
export interface NotificationData {
  id?: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

// Internal notification interface with required id
interface Notification extends Required<Omit<NotificationData, 'id'>> {
  id: string
  timestamp: Date
  dismissed: boolean
}

// Context interface
interface NotificationContextType {
  notifications: Notification[]
  showNotification: (notification: NotificationData) => string
  hideNotification: (id: string) => void
  clearAllNotifications: () => void
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Provider props
interface NotificationProviderProps {
  children: ReactNode
}

// Generate unique ID for notifications
const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Notification Provider Component
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Show notification function
  const showNotification = useCallback((notificationData: NotificationData): string => {
    const id = notificationData.id || generateId()
    
    const notification: Notification = {
      id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message || '',
      duration: notificationData.duration || 5000, // Default 5 seconds
      persistent: notificationData.persistent || false,
      timestamp: new Date(),
      dismissed: false
    }

    setNotifications(prev => [...prev, notification])

    // Auto-dismiss if not persistent
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        hideNotification(id)
      }, notification.duration)
    }

    return id
  }, [])

  // Hide notification function
  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const value: NotificationContextType = {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Convenience hook for easy notification usage
export function useNotify() {
  const { showNotification } = useNotifications()
  
  return {
    success: (title: string, message?: string) => 
      showNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      showNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) => 
      showNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) => 
      showNotification({ type: 'info', title, message }),
    custom: (notification: NotificationData) => 
      showNotification(notification)
  }
}
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { NotificationContextType, NotificationOptions, NotificationType } from '@/types'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Duplicate prevention system
const DUPLICATE_TIMEOUT = 3000 // 3 seconds
const DUPLICATE_THRESHOLD = 2 // After 2 duplicates, start grouping

interface RecentNotification {
  timestamp: number
  count: number
}

const recentNotifications = new Map<string, RecentNotification>()

function checkDuplicateNotification(key: string): {
  isDuplicate: boolean
  count: number
  shouldGroup: boolean
} {
  const now = Date.now()
  const existing = recentNotifications.get(key)
  
  if (existing && (now - existing.timestamp) < DUPLICATE_TIMEOUT) {
    existing.count += 1
    existing.timestamp = now
    
    return {
      isDuplicate: true,
      count: existing.count,
      shouldGroup: existing.count >= DUPLICATE_THRESHOLD
    }
  }
  
  recentNotifications.set(key, { timestamp: now, count: 1 })
  return { isDuplicate: false, count: 1, shouldGroup: false }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [activeToasts] = useState(new Set<string>())

  const notify = useCallback((
    title: string, 
    message?: string, 
    type: NotificationType = NotificationType.INFO,
    options: NotificationOptions = {}
  ) => {
    // Create a unique key for duplicate detection
    const notificationKey = `${type}:${title}:${message || ''}`
    const duplicateCheck = checkDuplicateNotification(notificationKey)
    
    let displayTitle = title
    let displayMessage = message
    
    if (duplicateCheck.shouldGroup) {
      displayTitle = `${title} (${duplicateCheck.count}x)`
      displayMessage = message ? `${message} - This message has appeared ${duplicateCheck.count} times` : `This notification has appeared ${duplicateCheck.count} times`
    } else if (duplicateCheck.isDuplicate && duplicateCheck.count === 2) {
      // First duplicate, just add count
      displayTitle = `${title} (2x)`
    }

    const toastId = options.id || `${Date.now()}-${Math.random()}`
    
    const toastOptions = {
      id: toastId,
      duration: options.duration || 4000,
      dismissible: options.dismissible !== false,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      onDismiss: () => {
        activeToasts.delete(toastId)
        options.onDismiss?.()
      }
    }

    activeToasts.add(toastId)

    switch (type) {
      case NotificationType.SUCCESS:
        toast.success(displayTitle, {
          description: displayMessage,
          ...toastOptions
        })
        break
      case NotificationType.ERROR:
        toast.error(displayTitle, {
          description: displayMessage,
          ...toastOptions
        })
        break
      case NotificationType.WARNING:
        toast.warning(displayTitle, {
          description: displayMessage,
          ...toastOptions
        })
        break
      case NotificationType.INFO:
      default:
        toast.info(displayTitle, {
          description: displayMessage,
          ...toastOptions
        })
        break
    }
    
    return toastId
  }, [activeToasts])

  const success = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return notify(title, message, NotificationType.SUCCESS, options)
  }, [notify])

  const error = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return notify(title, message, NotificationType.ERROR, options)
  }, [notify])

  const warning = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return notify(title, message, NotificationType.WARNING, options)
  }, [notify])

  const info = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return notify(title, message, NotificationType.INFO, options)
  }, [notify])

  const dismiss = useCallback((toastId: string) => {
    toast.dismiss(toastId)
    activeToasts.delete(toastId)
  }, [activeToasts])

  const dismissAll = useCallback(() => {
    toast.dismiss()
    activeToasts.clear()
  }, [activeToasts])

  const value: NotificationContextType = {
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
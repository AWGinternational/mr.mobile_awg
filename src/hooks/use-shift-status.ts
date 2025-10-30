'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface ShiftStatus {
  isActive: boolean
  startTime: string | null
  duration: number // in minutes
}

export function useShiftStatus() {
  const router = useRouter()
  const { toast } = useToast()
  const [shiftActive, setShiftActive] = useState(false)
  const [shiftStartTime, setShiftStartTime] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)

  // Load shift status from localStorage on mount
  useEffect(() => {
    const savedShiftActive = localStorage.getItem('shiftActive') === 'true'
    const savedShiftStartTime = localStorage.getItem('shiftStartTime')
    
    if (savedShiftActive && savedShiftStartTime) {
      setShiftActive(true)
      setShiftStartTime(savedShiftStartTime)
    }
  }, [])

  // Update duration every minute when shift is active
  useEffect(() => {
    if (shiftActive && shiftStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(shiftStartTime).getTime()) / (1000 * 60))
        setDuration(elapsed)
      }, 1000) // Update every second for real-time display

      return () => clearInterval(interval)
    }
  }, [shiftActive, shiftStartTime])

  const startShift = () => {
    const now = new Date().toISOString()
    setShiftActive(true)
    setShiftStartTime(now)
    localStorage.setItem('shiftActive', 'true')
    localStorage.setItem('shiftStartTime', now)
    toast({
      title: 'Shift started successfully! ✅',
      description: `Started at ${new Date(now).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    })
  }

  const endShift = () => {
    if (shiftStartTime) {
      const durationInMinutes = Math.floor((Date.now() - new Date(shiftStartTime).getTime()) / (1000 * 60))
      const hours = Math.floor(durationInMinutes / 60)
      const minutes = durationInMinutes % 60
      
      toast({
        title: 'Shift ended successfully! 👋',
        description: `Total time: ${hours}h ${minutes}m`
      })
    }
    
    setShiftActive(false)
    setShiftStartTime(null)
    setDuration(0)
    localStorage.removeItem('shiftActive')
    localStorage.removeItem('shiftStartTime')
  }

  const requireShift = (featureName: string = 'this feature') => {
    if (!shiftActive) {
      toast({
        title: '🔒 Shift Required',
        description: `Please start your shift to access ${featureName}`,
        variant: 'destructive'
      })
      return false
    }
    return true
  }

  return {
    shiftActive,
    shiftStartTime,
    duration,
    startShift,
    endShift,
    requireShift
  }
}

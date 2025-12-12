'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotify } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  ShoppingCart,
  Wallet,
  Calculator
} from 'lucide-react'
import { formatUserRole } from '@/utils/user-formatting'

interface TopNavigationProps {
  onMenuClick?: () => void
}

export function TopNavigation({ onMenuClick }: TopNavigationProps = {}) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { success } = useNotify()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
      setTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (typeof window !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
    applyTheme(newTheme)
    success(`Switched to ${newTheme} mode`)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleAccountSettings = () => {
    router.push('/account/settings')
  }

  if (!mounted) {
    return null // Avoid hydration mismatch
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Hamburger menu for mobile + Quick Actions */}
          <div className="flex-1 flex items-center gap-2 sm:gap-4">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Toggle menu"
              >
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </Button>
            )}
            
            {/* Quick Actions - Always visible for easy access */}
            {user && (user.role === 'SHOP_OWNER' || user.role === 'SHOP_WORKER') && (
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/pos')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-sm h-8 px-2 sm:px-3"
                >
                  <ShoppingCart className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">POS</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/mobile-services')}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700 shadow-sm h-8 px-2 sm:px-3"
                >
                  <Wallet className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Service</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/daily-closing')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 hover:from-purple-600 hover:to-purple-700 shadow-sm h-8 px-2 sm:px-3"
                >
                  <Calculator className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Closing</span>
                </Button>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
            </Button>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full px-2 sm:px-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-white">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatUserRole(user.role)}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 dark:bg-gray-800 dark:border-gray-700">
                  <DropdownMenuLabel className="dark:text-white">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-gray-700" />
                  <DropdownMenuItem
                    onClick={handleAccountSettings}
                    className="cursor-pointer dark:hover:bg-gray-700 dark:text-white"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-gray-700" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


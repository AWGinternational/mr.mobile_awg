'use client'

import React from 'react'

interface FooterProps {
  variant?: 'minimal' | 'standard' | 'sidebar'
  className?: string
}

export function Footer({ variant = 'minimal', className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  if (variant === 'sidebar') {
    return (
      <footer className={`px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
        <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
          © {currentYear} AWG International
        </p>
        <p className="text-[9px] text-center text-gray-400 dark:text-gray-500">
          All Rights Reserved
        </p>
      </footer>
    )
  }

  if (variant === 'minimal') {
    return (
      <footer className={`text-center text-xs text-gray-500 dark:text-gray-400 py-4 ${className}`}>
        © {currentYear} AWG International. All Rights Reserved.
      </footer>
    )
  }

  // Standard variant
  return (
    <footer className={`text-center text-sm text-gray-600 dark:text-gray-300 py-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      <p>© {currentYear} AWG International. All Rights Reserved.</p>
    </footer>
  )
}


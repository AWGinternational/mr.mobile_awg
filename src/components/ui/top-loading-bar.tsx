'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Top Loading Bar - Shows during page navigation
 * Provides instant feedback when clicking navigation links
 */
export function TopLoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Create loading bar element if it doesn't exist
    let loadingBar = document.getElementById('top-loading-bar')
    
    if (!loadingBar) {
      loadingBar = document.createElement('div')
      loadingBar.id = 'top-loading-bar'
      loadingBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
        z-index: 9999;
        transition: width 0.3s ease;
        width: 0%;
      `
      document.body.appendChild(loadingBar)
    }

    // Animate loading bar
    const animateLoading = () => {
      if (loadingBar) {
        loadingBar.style.width = '70%'
        setTimeout(() => {
          if (loadingBar) {
            loadingBar.style.width = '100%'
            setTimeout(() => {
              if (loadingBar) {
                loadingBar.style.opacity = '0'
                setTimeout(() => {
                  if (loadingBar) {
                    loadingBar.style.width = '0%'
                    loadingBar.style.opacity = '1'
                  }
                }, 300)
              }
            }, 200)
          }
        }, 300)
      }
    }

    animateLoading()
  }, [pathname, searchParams])

  return null
}

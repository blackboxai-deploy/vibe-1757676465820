'use client'

import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkIsMobile = () => {
      const width = window.innerWidth
      setIsMobile(width < MOBILE_BREAKPOINT)
    }

    // Initial check
    checkIsMobile()
    setIsLoading(false)

    // Add event listener
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  return { isMobile, isLoading }
}

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop' | 'large'>('desktop')

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < 768) {
        setBreakpoint('mobile')
      } else if (width < 1024) {
        setBreakpoint('tablet')
      } else if (width < 1280) {
        setBreakpoint('desktop')
      } else {
        setBreakpoint('large')
      }
    }

    // Initial check
    checkBreakpoint()

    // Add event listener
    window.addEventListener('resize', checkBreakpoint)
    
    return () => {
      window.removeEventListener('resize', checkBreakpoint)
    }
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isLarge: breakpoint === 'large'
  }
}
'use client'

import { useEffect, useState } from 'react'
import { SplashScreen } from './splash-screen'

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Simulate page load - splash shows for 1 second
    const loadTimer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(loadTimer)
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen isLoading={isLoading} onLoadingComplete={handleSplashComplete} />}
      {children}
    </>
  )
}

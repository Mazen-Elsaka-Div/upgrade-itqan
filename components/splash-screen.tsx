'use client'

import { useEffect, useState } from 'react'
import { MisbahaLoader } from './misbaha-loader'

interface SplashScreenProps {
  isLoading: boolean
  onLoadingComplete: () => void
}

export function SplashScreen({ isLoading, onLoadingComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      // Wait 1 second before hiding splash screen
      const timer = setTimeout(() => {
        setShow(false)
        onLoadingComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, onLoadingComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#f5f1e6] to-[#ebe4d3] dark:from-[#0a0a0a] dark:to-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1B5E3B" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Misbaha animation */}
        <div className="w-64 h-80 flex items-center justify-center">
          <MisbahaLoader />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h1
            className="text-3xl md:text-4xl font-bold text-[#1B5E3B] dark:text-[#2D8659]"
            style={{ fontFamily: 'var(--font-cairo)' }}
          >
            منصة إتقان
          </h1>
          <p
            className="text-sm text-[#5a5a5a] dark:text-[#b0b0b0]"
            style={{ fontFamily: 'var(--font-cairo)' }}
          >
            جاري تحميل المنصة...
          </p>
        </div>
      </div>

      {/* Ornamental bottom */}
      <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-[#1B5E3B]/5 to-transparent dark:from-[#2D8659]/10" />
    </div>
  )
}

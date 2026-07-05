'use client'

import { useEffect, useRef } from 'react'

export function MisbahaLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 500

    // Animation parameters
    const beadCount = 10 // عدد الخرزات الظاهرة
    const beadRadius = 16
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    let startTime: number | null = null
    const totalDuration = 1000 // ثانية واحدة كاملة

    // Colors - أخضر ذي المنصة
    const primaryColor = '#1B5E3B' // الأخضر الغامق
    const lightColor = '#2D8659' // أخضر أفتح
    const accentColor = '#F5DEB3' // لون الخيط

    const animate = (timestamp: number) => {
      // Set start time on first frame
      if (startTime === null) {
        startTime = timestamp
      }

      // Clear canvas
      ctx.fillStyle = 'transparent'
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate progress (0 to 1)
      const elapsed = (timestamp - startTime) % totalDuration
      const progress = elapsed / totalDuration

      // Draw the beads in circular motion
      for (let i = 0; i < beadCount; i++) {
        // الزاوية لكل خرزة
        const angle = (i / beadCount) * Math.PI * 2 + progress * Math.PI * 2
        
        // حساب أي خرزة نشطة (الخرزة التي في الأمام)
        const normalizedProgress = (progress * beadCount) % beadCount
        const activeIndex = Math.floor(normalizedProgress)
        const nextIndex = (activeIndex + 1) % beadCount
        const distToActive = Math.abs(normalizedProgress - i)
        
        let scale = 0.8
        // الخرزة النشطة تكبر
        if (i === activeIndex) {
          const pulse = (normalizedProgress % 1)
          scale = 0.8 + pulse * 0.35
        } else if (i === nextIndex && distToActive < 1.5) {
          scale = 0.8 + (1 - (normalizedProgress % 1)) * 0.2
        }

        // موقع الخرزة
        const radius = 75
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        // رسم الخرزة - كروية جميلة
        const actualRadius = beadRadius * scale

        // Gradient للخرزة لتبدو ثلاثية الأبعاد
        const grad = ctx.createRadialGradient(
          x - actualRadius * 0.35,
          y - actualRadius * 0.35,
          0,
          x,
          y,
          actualRadius
        )

        if (i === activeIndex) {
          grad.addColorStop(0, '#5FD99F')
          grad.addColorStop(0.4, lightColor)
          grad.addColorStop(0.8, primaryColor)
          grad.addColorStop(1, '#0F3D24')
        } else {
          grad.addColorStop(0, '#25a055')
          grad.addColorStop(0.5, primaryColor)
          grad.addColorStop(1, '#0F2819')
        }

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, actualRadius, 0, Math.PI * 2)
        ctx.fill()

        // Border للخرزة
        ctx.strokeStyle = 'rgba(15, 61, 36, 0.6)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // رسم الخيط والطرف (خرزتان في الأسفل)
      const taperAngle = Math.PI * 1.5 // أسفل
      const taper1Radius = 95
      const taper1X = centerX + Math.cos(taperAngle) * taper1Radius
      const taper1Y = centerY + Math.sin(taperAngle) * taper1Radius

      const taper2Radius = 115
      const taper2X = centerX + Math.cos(taperAngle) * taper2Radius
      const taper2Y = centerY + Math.sin(taperAngle) * taper2Radius

      // الخرزة الأولى الطرفية
      const taper1Grad = ctx.createRadialGradient(
        taper1X - 9,
        taper1Y - 9,
        0,
        taper1X,
        taper1Y,
        11
      )
      taper1Grad.addColorStop(0, '#5FD99F')
      taper1Grad.addColorStop(0.4, lightColor)
      taper1Grad.addColorStop(0.8, primaryColor)
      taper1Grad.addColorStop(1, '#0F3D24')

      ctx.fillStyle = taper1Grad
      ctx.beginPath()
      ctx.arc(taper1X, taper1Y, 11, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(15, 61, 36, 0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // الخرزة الثانية الطرفية (أصغر قليلاً)
      const taper2Grad = ctx.createRadialGradient(
        taper2X - 7,
        taper2Y - 7,
        0,
        taper2X,
        taper2Y,
        8
      )
      taper2Grad.addColorStop(0, '#5FD99F')
      taper2Grad.addColorStop(0.4, lightColor)
      taper2Grad.addColorStop(0.8, primaryColor)
      taper2Grad.addColorStop(1, '#0F3D24')

      ctx.fillStyle = taper2Grad
      ctx.beginPath()
      ctx.arc(taper2X, taper2Y, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(15, 61, 36, 0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // رسم الخيط من الخرزة الثانية للأعلى
      ctx.strokeStyle = accentColor
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(taper2X, taper2Y - 8)
      ctx.lineTo(taper2X, taper2Y - 55)
      ctx.stroke()

      // Continue animation
      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ maxWidth: '300px', maxHeight: '400px', margin: '0 auto' }}
    />
  )
}

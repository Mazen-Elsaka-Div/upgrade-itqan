'use client'

import { useEffect, useRef } from 'react'

export function MisbahaLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = window.devicePixelRatio || 1
    const W = 280
    const H = 390
    canvas.width = W * DPR
    canvas.height = H * DPR
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(DPR, DPR)

    // ── إعدادات المسبحة ──────────────────────────────────────
    const BEAD_COUNT = 10        // عدد الخرزات في الدائرة
    const RING_R     = 88        // نصف قطر الدائرة
    const BEAD_R     = 14        // نصف قطر الخرزة الأساسية
    const CX         = W / 2
    const CY         = H / 2 - 20
    const CYCLE_MS   = 3200      // كل دورة كاملة تاخد 3.2 ثانية (هادئة)

    // ── ألوان الخرزة الخشبية البنية ───────────────────────────
    // بني خشبي دافئ
    const BEAD_HI    = '#C68B4A'   // أعلى الخرزة (ضوء)
    const BEAD_MID   = '#8B5E2E'   // منتصف
    const BEAD_DARK  = '#4A2E10'   // أسفل الخرزة (ظل)
    const BEAD_EDGE  = '#3A2008'   // حافة

    // ── ألوان الخيط ────────────────────────────────────────────
    const THREAD     = '#4A7C59'   // أخضر زيتي داكن يناسب المنصة
    const THREAD_HI  = '#6BAF7A'   // أخضر أفتح للخيط

    // ── ألوان النحاس (تيبيليك) ─────────────────────────────────
    const BRASS_HI   = '#D4A843'
    const BRASS_MID  = '#A07828'
    const BRASS_DARK = '#6B4F10'

    let startTime: number | null = null
    let rafId = 0

    // ── رسم خرزة واحدة ─────────────────────────────────────────
    function drawBead(
      x: number, y: number, r: number,
      isActive: boolean, activeFraction: number
    ) {
      // توهج ناعم حول الخرزة النشطة
      if (isActive) {
        const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.2)
        glow.addColorStop(0, `rgba(198,139,74,${0.35 * activeFraction})`)
        glow.addColorStop(1, 'rgba(198,139,74,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, r * 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // جسم الخرزة بـ radial gradient يعطيها شكل كروي
      const grad = ctx.createRadialGradient(
        x - r * 0.3, y - r * 0.35, r * 0.05,
        x,           y,             r
      )
      if (isActive) {
        grad.addColorStop(0.00, '#E8B060')
        grad.addColorStop(0.30, BEAD_HI)
        grad.addColorStop(0.65, BEAD_MID)
        grad.addColorStop(0.88, BEAD_DARK)
        grad.addColorStop(1.00, BEAD_EDGE)
      } else {
        grad.addColorStop(0.00, '#C8902A')
        grad.addColorStop(0.35, BEAD_MID)
        grad.addColorStop(0.75, BEAD_DARK)
        grad.addColorStop(1.00, BEAD_EDGE)
      }

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()

      // حافة خفيفة
      ctx.strokeStyle = `rgba(58,32,8,0.55)`
      ctx.lineWidth = 0.8
      ctx.stroke()

      // انعكاس ضوء صغير فوق اليسار
      const shine = ctx.createRadialGradient(
        x - r * 0.32, y - r * 0.36, 0,
        x - r * 0.32, y - r * 0.36, r * 0.42
      )
      shine.addColorStop(0,   `rgba(255,235,190,${isActive ? 0.7 : 0.45})`)
      shine.addColorStop(0.6, `rgba(255,235,190,0.08)`)
      shine.addColorStop(1,   'rgba(255,235,190,0)')
      ctx.fillStyle = shine
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // ── رسم قطعة النحاس (تيبيليك) ──────────────────────────────
    function drawBrassConnector(cx: number, topY: number) {
      const capW = 9
      const capH = 18

      // جسم النحاس
      const brassGrad = ctx.createLinearGradient(cx - capW, topY, cx + capW, topY)
      brassGrad.addColorStop(0,    BRASS_DARK)
      brassGrad.addColorStop(0.25, BRASS_MID)
      brassGrad.addColorStop(0.5,  BRASS_HI)
      brassGrad.addColorStop(0.75, BRASS_MID)
      brassGrad.addColorStop(1,    BRASS_DARK)

      ctx.fillStyle = brassGrad
      // شكل مستطيل مع زوايا مدورة قليلاً للنحاسة
      const r = 3
      const x = cx - capW
      const y = topY
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + capW * 2 - r, y)
      ctx.quadraticCurveTo(x + capW * 2, y, x + capW * 2, y + r)
      ctx.lineTo(x + capW * 2, y + capH - r)
      ctx.quadraticCurveTo(x + capW * 2, y + capH, x + capW * 2 - r, y + capH)
      ctx.lineTo(x + r, y + capH)
      ctx.quadraticCurveTo(x, y + capH, x, y + capH - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.fill()

      // حواف النحاس
      ctx.strokeStyle = BRASS_DARK
      ctx.lineWidth = 1
      ctx.stroke()

      // خط أفقي زينة في النحاس
      ctx.strokeStyle = `rgba(212,168,67,0.6)`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx - capW + 2, topY + capH * 0.4)
      ctx.lineTo(cx + capW - 2, topY + capH * 0.4)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - capW + 2, topY + capH * 0.65)
      ctx.lineTo(cx + capW - 2, topY + capH * 0.65)
      ctx.stroke()
    }

    // ── رسم الشراشيب (tassel) ───────────────────────────────────
    function drawTassel(cx: number, startY: number) {
      const strands = 9
      const tasselLen = 38
      const spread = 10

      for (let i = 0; i < strands; i++) {
        const t = (i / (strands - 1)) - 0.5        // -0.5 → 0.5
        const endX = cx + t * spread * 2
        const endY = startY + tasselLen + Math.abs(t) * 6  // القصيرة في الوسط

        // تذبذب خفيف للشراشيب بناءً على الوقت
        const elapsed = (startTime !== null)
          ? (performance.now() - startTime) / 1000 : 0
        const wobble = Math.sin(elapsed * 1.5 + i * 0.7) * 1.2

        const alpha = i === 0 || i === strands - 1 ? 0.4 : 0.85

        ctx.strokeStyle = `rgba(74,124,89,${alpha})`
        ctx.lineWidth = 1.2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx + wobble * 0.3, startY)
        ctx.quadraticCurveTo(
          endX + wobble,
          startY + tasselLen * 0.5,
          endX + wobble,
          endY
        )
        ctx.stroke()
      }
    }

    // ── رسم الخيط بين الخرزات ──────────────────────────────────
    function drawThread(progress: number) {
      ctx.save()
      ctx.globalAlpha = 0.6
      ctx.strokeStyle = THREAD
      ctx.lineWidth = 1.8
      ctx.lineCap = 'round'
      ctx.beginPath()

      for (let i = 0; i <= BEAD_COUNT; i++) {
        const angle = ((i % BEAD_COUNT) / BEAD_COUNT) * Math.PI * 2 + progress * Math.PI * 2
        const x = CX + Math.cos(angle) * RING_R
        const y = CY + Math.sin(angle) * RING_R
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }

    // ── الخرزتان في الطرف (imam beads) ─────────────────────────
    function drawTailBeads(imamX: number, imamY: number) {
      // خط رابط من الدائرة لأسفل
      ctx.strokeStyle = THREAD
      ctx.lineWidth = 1.8
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(imamX, imamY + BEAD_R)
      ctx.lineTo(imamX, imamY + BEAD_R + 14)
      ctx.stroke()

      // الخرزة الأولى (imam / alif)
      const b1Y = imamY + BEAD_R + 14 + 13
      drawBead(imamX, b1Y, 13, false, 0)

      // رابط قصير
      ctx.strokeStyle = THREAD
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(imamX, b1Y + 13)
      ctx.lineTo(imamX, b1Y + 13 + 9)
      ctx.stroke()

      // الخرزة الثانية (أصغر)
      const b2Y = b1Y + 13 + 9 + 9
      drawBead(imamX, b2Y, 9, false, 0)

      // رابط للنحاس
      ctx.strokeStyle = THREAD
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(imamX, b2Y + 9)
      ctx.lineTo(imamX, b2Y + 9 + 8)
      ctx.stroke()

      // النحاس (تيبيليك)
      drawBrassConnector(imamX, b2Y + 9 + 8)

      // الشراشيب
      drawTassel(imamX, b2Y + 9 + 8 + 18)
    }

    // ── حلقة الرسم الرئيسية ────────────────────────────────────
    const animate = (ts: number) => {
      if (startTime === null) startTime = ts

      ctx.clearRect(0, 0, W, H)

      const elapsed = (ts - startTime) % CYCLE_MS
      const progress = elapsed / CYCLE_MS  // 0 → 1

      // أي خرزة تنمو الآن؟
      const floatIdx = (progress * BEAD_COUNT) % BEAD_COUNT
      const activeIdx = Math.floor(floatIdx)
      const frac = floatIdx - activeIdx  // 0 → 1 (مدى تقدم الخرزة)

      // ── رسم الخيط أولاً (خلف الخرزات)
      drawThread(progress)

      // ── رسم الخرزات
      for (let i = 0; i < BEAD_COUNT; i++) {
        const angle = (i / BEAD_COUNT) * Math.PI * 2 + progress * Math.PI * 2

        const isActive = i === activeIdx
        let r = BEAD_R

        if (isActive) {
          // تكبير سلس من 1.0 → 1.28 → 1.0 خلال الثلث الأول ثم يهبط
          const upPhase   = Math.min(frac / 0.35, 1)
          const downPhase = frac > 0.35 ? (frac - 0.35) / 0.65 : 0
          const scalePeak = 0.28
          const scaleAdd  = upPhase < 1
            ? upPhase * scalePeak
            : scalePeak * (1 - downPhase)
          r = BEAD_R * (1 + scaleAdd)
        }

        const bx = CX + Math.cos(angle) * RING_R
        const by = CY + Math.sin(angle) * RING_R
        drawBead(bx, by, r, isActive, isActive ? Math.sin(frac * Math.PI) : 0)
      }

      // ── رسم ذيل المسبحة عند الزاوية السفلية الثابتة
      // نقطة الالتقاء الثابتة في الأسفل (الخرزة التي لا تدور)
      const tailAngle = -Math.PI / 2 // أعلى الدائرة في البداية نحدد ثابت
      const tailX = CX
      const tailY = CY + RING_R  // أسفل الدائرة مباشرة
      drawTailBeads(tailX, tailY)

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', margin: '0 auto' }}
      aria-label="مسبحة صلاة متحركة"
    />
  )
}

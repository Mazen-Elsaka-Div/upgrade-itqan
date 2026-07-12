'use client'

import { useEffect, useState } from 'react'
import HeaderNavClient from './homepage-header-client'

type SessionUser = {
  role: string
  name?: string
  has_academy_access?: boolean
  has_quran_access?: boolean
}

function getDashboardLink(user: SessionUser): { link: string; text: string } | null {
  const role = user.role
  if (role === 'admin' || role === 'super_admin' || role === 'maqraa_admin') {
    return { link: '/admin', text: 'لوحة التحكم' }
  }
  if (role === 'academy_admin') return { link: '/academy/admin', text: 'لوحة التحكم' }
  if (role === 'student_supervisor' || role === 'reciter_supervisor') {
    return { link: '/admin', text: 'لوحة التحكم' }
  }
  if (role === 'teacher') return { link: '/academy/teacher', text: 'الأكاديمية' }
  if (role === 'reader') return { link: '/reader', text: 'المقرأة' }
  if (role === 'parent') return { link: '/academy/parent', text: 'الأكاديمية' }
  if (role === 'supervisor') return { link: '/academy/supervisor', text: 'الأكاديمية' }
  if (role === 'student') {
    const hasAcademy = user.has_academy_access !== false
    const hasQuran = user.has_quran_access !== false
    if (hasAcademy && !hasQuran) return { link: '/academy/student', text: 'الأكاديمية' }
    if (!hasAcademy && hasQuran) return { link: '/student', text: 'المقرأة' }
    return { link: '/academy/student', text: 'حسابي' }
  }
  return { link: '/student', text: 'حسابي' }
}

export default function HomepageHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dashboardLink, setDashboardLink] = useState<string | null>(null)
  const [dashboardText, setDashboardText] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (data?.user && !cancelled) {
          const user: SessionUser = data.user
          const dest = getDashboardLink(user)
          setIsLoggedIn(true)
          setDashboardLink(dest?.link ?? null)
          setDashboardText(dest?.text ?? null)
          setUserName(user.name ?? null)
        }
      } catch {
        // Not logged in or network error — stay as guest
      }
    }
    checkSession()
    return () => { cancelled = true }
  }, [])

  return (
    <HeaderNavClient
      isLoggedIn={isLoggedIn}
      dashboardLink={dashboardLink}
      dashboardText={dashboardText}
      userName={userName}
    />
  )
}

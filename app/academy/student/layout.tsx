import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { resolveStudentDashboardRedirect } from '@/lib/academy/access'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function AcademyStudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guard against session lookups failing for any reason (cookie store error,
  // jose import error, etc.). Without this try/catch a thrown exception would
  // bubble up as a 500 with no UI ("This page couldn't load" in the browser).
  let session
  try {
    session = await getSession()
  } catch (err) {
    console.error('[academy/student/layout] getSession failed:', err)
    redirect('/login')
  }

  if (!session) {
    redirect('/login')
  }

  // Server-side role enforcement (defense-in-depth). The middleware/proxy is the
  // first line of defense, but it can be bypassed if it isn't running (stale
  // deployment, demo mode, matcher gaps). Enforce the student role here too so a
  // non-student authenticated user (admin, teacher, supervisor) is never shown
  // the student UI — they are redirected to their own dashboard instead.
  // The decision lives in resolveStudentDashboardRedirect() so it stays a single,
  // unit-tested source of truth and can't drift from the middleware.
  const redirectTarget = resolveStudentDashboardRedirect(session)
  if (redirectTarget) {
    redirect(redirectTarget)
  }

  // Determine if user has library access
  const libraryRole = ['student', 'reader'].includes(session.role)
    ? (session.role as 'student' | 'reader')
    : null

  return (
    <AcademyDashboardShell
      role="academy_student"
      showModeSwitcher={!!libraryRole}
      libraryRole={libraryRole}
    >
      {children}
    </AcademyDashboardShell>
  )
}

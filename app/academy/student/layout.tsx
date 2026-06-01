import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
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
  const supervisorRoles = [
    'supervisor',
    'content_supervisor',
    'fiqh_supervisor',
    'quality_supervisor',
    'student_supervisor',
    'reciter_supervisor',
    'academy_admin',
  ]
  const academyRoles = session.academy_roles || []
  const isStudentLike =
    session.role === 'student' ||
    session.role === 'parent' ||
    academyRoles.includes('student') ||
    academyRoles.includes('parent')

  if (!isStudentLike) {
    if (session.role === 'admin') {
      redirect('/academy/admin')
    }
    if (session.role === 'teacher' || academyRoles.includes('teacher')) {
      redirect('/academy/teacher')
    }
    if (
      supervisorRoles.includes(session.role) ||
      academyRoles.some((r) => supervisorRoles.includes(r))
    ) {
      redirect('/academy/supervisor')
    }
    // Any other authenticated-but-unauthorized role: send to academy root.
    redirect('/academy')
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

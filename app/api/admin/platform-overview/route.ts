import { NextResponse } from "next/server"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { query } from "@/lib/db"

// Small helper so one failing aggregate never blanks the whole dashboard.
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    console.error("[platform-overview] aggregate error:", e)
    return fallback
  }
}

// GET /api/admin/platform-overview — cross-cutting platform metrics for the
// Super Admin: total members, role distribution, and academy vs maqraa volumes.
export async function GET() {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const [users, roleRows, academy, maqraa] = await Promise.all([
    safe(
      () =>
        query<{ total: string; active: string; new_30: string }>(
          `SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE is_active)::int AS active,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_30
           FROM users`
        ),
      [] as any[]
    ),
    safe(
      () =>
        query<{ role: string; count: string }>(
          `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY count DESC`
        ),
      [] as any[]
    ),
    safe(
      () =>
        query<{ courses: string; lessons: string; enrollments: string }>(
          `SELECT
             (SELECT COUNT(*)::int FROM courses) AS courses,
             (SELECT COUNT(*)::int FROM lessons) AS lessons,
             (SELECT COUNT(*)::int FROM enrollments) AS enrollments`
        ),
      [] as any[]
    ),
    safe(
      () =>
        query<{ recitations: string; pending: string; reviewed_7: string }>(
          `SELECT
             COUNT(*)::int AS recitations,
             COUNT(*) FILTER (WHERE status IN ('pending', 'in_review'))::int AS pending,
             COUNT(*) FILTER (WHERE status = 'approved' AND updated_at >= NOW() - INTERVAL '7 days')::int AS reviewed_7
           FROM recitations`
        ),
      [] as any[]
    ),
  ])

  return NextResponse.json({
    users: users[0] ?? { total: 0, active: 0, new_30: 0 },
    roleDistribution: roleRows,
    academy: academy[0] ?? { courses: 0, lessons: 0, enrollments: 0 },
    maqraa: maqraa[0] ?? { recitations: 0, pending: 0, reviewed_7: 0 },
  })
}

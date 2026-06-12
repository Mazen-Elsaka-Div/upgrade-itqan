import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { logAdminAction } from "@/lib/activity-log"

// GET /api/admin/supervisors
// Lists all supervisors with their assignment counts.
export async function GET() {
  try {
    const session = await getSession()
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const supervisors = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              (SELECT COUNT(*) FROM supervisor_assignments sa
                 WHERE sa.supervisor_id = u.id AND sa.is_active = true) AS assignment_count
       FROM users u
       WHERE u.role IN ('student_supervisor', 'reciter_supervisor')
       ORDER BY u.created_at DESC`
    )

    return NextResponse.json({ supervisors })
  } catch (error) {
    console.error("Admin supervisors list error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

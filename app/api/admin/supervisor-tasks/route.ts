import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { resolveSupervisorScope } from "@/lib/supervisor-scope"

// GET /api/admin/supervisor-tasks
// Aggregated "needs action" items for the current supervisor, respecting scope.
export async function GET() {
  try {
    const session = await getSession()
    const allowed: ("admin" | "student_supervisor" | "reciter_supervisor")[] = [
      "admin",
      "student_supervisor",
      "reciter_supervisor",
    ]
    if (!requireRole(session, allowed)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const role = session!.role
    const scope = await resolveSupervisorScope(session!)
    const scopedIds = scope.kind === "ids" ? scope.ids : null

    // Helper to build a scope clause for a given column.
    const tasks: {
      key: string
      label: string
      count: number
      href: string
      icon: string
    }[] = []

    // ---- Pending recitations ----
    if (role === "student_supervisor" || role === "admin") {
      const params: unknown[] = []
      let scopeClause = ""
      if (scopedIds) {
        params.push(scopedIds)
        scopeClause = ` AND r.student_id = ANY($${params.length}::uuid[])`
      }
      const rows = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM recitations r
         WHERE r.status = 'pending'${scopeClause}`,
        params
      )
      tasks.push({
        key: "pending_recitations",
        label: "تلاوات بانتظار المراجعة",
        count: parseInt(rows[0]?.count || "0"),
        href: "/admin/recitations?status=pending",
        icon: "FileText",
      })
    }

    if (role === "reciter_supervisor" || role === "admin") {
      const params: unknown[] = []
      let scopeClause = ""
      if (scopedIds) {
        params.push(scopedIds)
        scopeClause = ` AND r.assigned_reader_id = ANY($${params.length}::uuid[])`
      }
      const rows = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM recitations r
         WHERE r.assigned_reader_id IS NULL AND r.status = 'pending'${scopeClause}`,
        params
      )
      tasks.push({
        key: "unassigned_recitations",
        label: "تلاوات بدون مقرئ",
        count: parseInt(rows[0]?.count || "0"),
        href: "/admin/recitations?unassigned=true",
        icon: "UserPlus",
      })
    }

    // ---- Reader applications (reciter supervisor / admin) ----
    if (role === "reciter_supervisor" || role === "admin") {
      const rows = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM reader_applications WHERE status = 'pending'`
      )
      tasks.push({
        key: "reader_applications",
        label: "طلبات انضمام المقرئين",
        count: parseInt(rows[0]?.count || "0"),
        href: "/admin/reader-applications",
        icon: "UserCheck",
      })
    }

    // ---- Open ticket conversations assigned to / unassigned ----
    {
      const params: unknown[] = []
      let assignClause = ""
      // Supervisors see tickets assigned to them or unassigned.
      if (role !== "admin") {
        params.push(session!.sub)
        assignClause = ` AND (c.assigned_supervisor_id = $${params.length} OR c.assigned_supervisor_id IS NULL)`
      }
      const rows = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM conversations c
         WHERE c.is_ticket = true AND c.ticket_status = 'open'${assignClause}`,
        params
      ).catch(() => [{ count: "0" }])
      tasks.push({
        key: "open_tickets",
        label: "محادثات/تذاكر مفتوحة",
        count: parseInt(rows[0]?.count || "0"),
        href: "/admin/conversations",
        icon: "MessagesSquare",
      })
    }

    const total = tasks.reduce((sum, t) => sum + t.count, 0)

    return NextResponse.json({ tasks, total })
  } catch (error) {
    console.error("Supervisor tasks error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

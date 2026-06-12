import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { logAdminAction } from "@/lib/activity-log"
import { supervisorBaseRole } from "@/lib/supervisor-scope"

// GET /api/admin/supervisors/[id]/assignments
// Returns the supervisor + their assigned users + the pool of assignable users.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { id } = await params

    const supRows = await query<{ id: string; name: string; email: string; role: string }>(
      `SELECT id, name, email, role FROM users WHERE id = $1`,
      [id]
    )
    const supervisor = supRows[0]
    if (!supervisor) {
      return NextResponse.json({ error: "المشرف غير موجود" }, { status: 404 })
    }

    const baseRole = supervisorBaseRole(supervisor.role)
    if (!baseRole) {
      return NextResponse.json({ error: "هذا المستخدم ليس مشرفاً" }, { status: 400 })
    }

    // Currently assigned user ids
    const assignedRows = await query<{ scope_value: string }>(
      `SELECT scope_value FROM supervisor_assignments
       WHERE supervisor_id = $1 AND scope_type = $2 AND is_active = true`,
      [id, baseRole]
    )
    const assignedIds = assignedRows.map((r) => r.scope_value)

    // Pool of assignable users (all users of the base role)
    const pool = await query(
      `SELECT id, name, email, is_active FROM users
       WHERE role = $1
       ORDER BY name ASC`,
      [baseRole]
    )

    return NextResponse.json({
      supervisor: { ...supervisor, baseRole },
      assignedIds,
      pool,
    })
  } catch (error) {
    console.error("Admin supervisor assignments GET error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PUT /api/admin/supervisors/[id]/assignments
// Replaces the supervisor's assignment set with the provided user ids.
// Body: { userIds: string[] }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { id } = await params
    const { userIds } = await req.json()

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "userIds مطلوب كمصفوفة" }, { status: 400 })
    }

    const supRows = await query<{ role: string }>(
      `SELECT role FROM users WHERE id = $1`,
      [id]
    )
    const supervisor = supRows[0]
    if (!supervisor) {
      return NextResponse.json({ error: "المشرف غير موجود" }, { status: 404 })
    }

    const baseRole = supervisorBaseRole(supervisor.role)
    if (!baseRole) {
      return NextResponse.json({ error: "هذا المستخدم ليس مشرفاً" }, { status: 400 })
    }

    // Validate that all provided ids belong to the correct base role.
    let validIds: string[] = []
    if (userIds.length > 0) {
      const valid = await query<{ id: string }>(
        `SELECT id FROM users WHERE role = $1 AND id = ANY($2::uuid[])`,
        [baseRole, userIds]
      )
      validIds = valid.map((r) => r.id)
    }

    // Replace assignment set: deactivate existing, then upsert active rows.
    await query(
      `DELETE FROM supervisor_assignments WHERE supervisor_id = $1 AND scope_type = $2`,
      [id, baseRole]
    )

    for (const uid of validIds) {
      await query(
        `INSERT INTO supervisor_assignments (supervisor_id, scope_type, scope_value, is_active, assigned_by, assigned_at)
         VALUES ($1, $2, $3, true, $4, NOW())`,
        [id, baseRole, uid, session!.sub]
      )
    }

    await logAdminAction({
      userId: session!.sub,
      action: "supervisor_assignments_updated",
      entityType: "user",
      entityId: id,
      description: `Updated supervisor ${id} assignments to ${validIds.length} ${baseRole}(s)`,
    })

    return NextResponse.json({ success: true, count: validIds.length })
  } catch (error) {
    console.error("Admin supervisor assignments PUT error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

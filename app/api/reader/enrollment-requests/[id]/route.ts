import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// PATCH /api/reader/enrollment-requests/[id]
// Body: { path_type: 'tajweed' | 'memorization', action: 'approve' | 'reject' }
// Approves (seeds progress + sets active) or rejects a pending enrollment request
// for a path owned by the current reader.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !requireRole(session, ["reader", "admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const { id: enrollmentId } = await ctx.params
    const { path_type, action } = (await req.json()) as {
      path_type: "tajweed" | "memorization"
      action: "approve" | "reject"
    }
    const readerId = session.sub

    if (!["tajweed", "memorization"].includes(path_type) || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 })
    }

    if (path_type === "tajweed") {
      // Verify ownership + pending status
      const rows = (await query<any>(
        `
        SELECT tpe.id, tpe.path_id, tpe.student_id, tpe.status
        FROM tajweed_path_enrollments tpe
        JOIN tajweed_paths tp ON tp.id = tpe.path_id
        WHERE tpe.id = $1 AND tp.created_by = $2 AND tpe.status = 'pending'
        LIMIT 1
        `,
        [enrollmentId, readerId],
      )) as any[]
      const enrollment = rows[0]
      if (!enrollment) {
        return NextResponse.json({ error: "الطلب غير موجود أو لا تملك صلاحيته" }, { status: 404 })
      }

      if (action === "reject") {
        await query(
          `UPDATE tajweed_path_enrollments
             SET status = 'rejected', reviewed_by = $2, reviewed_at = NOW()
           WHERE id = $1`,
          [enrollmentId, readerId],
        )
        return NextResponse.json({ success: true, status: "rejected" })
      }

      // Approve: seed progress + activate
      const stages = (await query<any>(
        `SELECT id FROM tajweed_path_stages WHERE path_id = $1 ORDER BY position ASC`,
        [enrollment.path_id],
      )) as any[]
      if (stages.length === 0) {
        return NextResponse.json({ error: "لا توجد مراحل في هذا المسار" }, { status: 400 })
      }

      const values: any[] = []
      const placeholders: string[] = []
      let i = 1
      stages.forEach((s: any, idx: number) => {
        placeholders.push(`($${i++}, $${i++}, $${i++})`)
        values.push(enrollmentId, s.id, idx === 0 ? "unlocked" : "locked")
      })
      await query(
        `INSERT INTO tajweed_path_progress (enrollment_id, stage_id, status)
           VALUES ${placeholders.join(", ")}
         ON CONFLICT (enrollment_id, stage_id) DO NOTHING`,
        values,
      )
      await query(
        `UPDATE tajweed_path_enrollments
           SET status = 'active', current_stage_id = $2, reviewed_by = $3,
               reviewed_at = NOW(), last_activity_at = NOW()
         WHERE id = $1`,
        [enrollmentId, stages[0].id, readerId],
      )
      return NextResponse.json({ success: true, status: "active" })
    }

    // memorization
    const rows = (await query<any>(
      `
      SELECT mpe.id, mpe.path_id, mpe.student_id, mpe.status
      FROM memorization_path_enrollments mpe
      JOIN memorization_paths mp ON mp.id = mpe.path_id
      WHERE mpe.id = $1 AND mp.created_by = $2 AND mpe.status = 'pending'
      LIMIT 1
      `,
      [enrollmentId, readerId],
    )) as any[]
    const enrollment = rows[0]
    if (!enrollment) {
      return NextResponse.json({ error: "الطلب غير موجود أو لا تملك صلاحيته" }, { status: 404 })
    }

    if (action === "reject") {
      await query(
        `UPDATE memorization_path_enrollments
           SET status = 'rejected', reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $1`,
        [enrollmentId, readerId],
      )
      return NextResponse.json({ success: true, status: "rejected" })
    }

    // Approve: seed progress + activate
    const units = (await query<any>(
      `SELECT id, position FROM memorization_path_units WHERE path_id = $1 ORDER BY position ASC`,
      [enrollment.path_id],
    )) as any[]
    if (units.length === 0) {
      return NextResponse.json({ error: "لا توجد وحدات في هذا المسار" }, { status: 400 })
    }

    const values: any[] = []
    const placeholders: string[] = []
    let i = 1
    units.forEach((u: any) => {
      placeholders.push(`($${i++}, $${i++}, $${i++})`)
      values.push(enrollmentId, u.id, u.position === 1 ? "unlocked" : "locked")
    })
    await query(
      `INSERT INTO memorization_path_progress (enrollment_id, unit_id, status)
         VALUES ${placeholders.join(", ")}
       ON CONFLICT (enrollment_id, unit_id) DO NOTHING`,
      values,
    )
    await query(
      `UPDATE memorization_path_enrollments
         SET status = 'active', current_unit_id = $2, reviewed_by = $3,
             reviewed_at = NOW(), last_activity_at = NOW()
       WHERE id = $1`,
      [enrollmentId, units[0].id, readerId],
    )
    return NextResponse.json({ success: true, status: "active" })
  } catch (error) {
    console.error("Reader enrollment request action error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

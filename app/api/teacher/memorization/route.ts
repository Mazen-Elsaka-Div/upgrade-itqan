import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !["teacher", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT 
        l.*,
        u.name as student_name,
        u.email as student_email
      FROM maqraa_memorization_logs l
      JOIN users u ON l.student_id = u.id
      WHERE l.teacher_id = $1 OR l.status = 'pending'
      ORDER BY l.created_at DESC
      LIMIT 100
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error("[API] teacher maqraa_memorization GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || !["teacher", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, status, quality, points_earned, teacher_notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await query(`
      UPDATE maqraa_memorization_logs
      SET 
        status = $1,
        quality = COALESCE($2, quality),
        points_earned = COALESCE($3, points_earned),
        teacher_notes = COALESCE($4, teacher_notes),
        teacher_id = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [status, quality || null, points_earned || 0, teacher_notes || null, session.sub, id])

    if (result.length === 0) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 })
    }

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error("[API] teacher maqraa_memorization PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

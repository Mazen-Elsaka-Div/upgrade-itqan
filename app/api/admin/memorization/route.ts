import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "academy_admin" && session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const stats = await query(`
      SELECT 
        COUNT(DISTINCT student_id) as active_students,
        COUNT(id) as total_logs,
        SUM(verses_count) as total_verses_memorized
      FROM maqraa_memorization_logs
      WHERE status = 'approved'
    `)

    const recentLogs = await query(`
      SELECT 
        l.*,
        u.name as student_name,
        t.name as teacher_name
      FROM maqraa_memorization_logs l
      JOIN users u ON l.student_id = u.id
      LEFT JOIN users t ON l.teacher_id = t.id
      ORDER BY l.created_at DESC
      LIMIT 20
    `)

    return NextResponse.json({ 
      stats: stats[0] || { active_students: 0, total_logs: 0, total_verses_memorized: 0 },
      recentLogs 
    })
  } catch (error) {
    console.error("[API] admin maqraa_memorization GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

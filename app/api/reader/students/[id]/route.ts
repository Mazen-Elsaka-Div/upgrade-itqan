import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/reader/students/[id]
// Returns a single student's profile + maqraa-focused activity,
// scoped to students actually linked to this reader.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || !requireRole(session, ["reader", "admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const { id: studentId } = await ctx.params
    const readerId = session.sub

    // Verify this student is linked to the reader (via recitations, bookings, or owned paths)
    const link = (await query<{ ok: number }>(
      `
      SELECT 1 AS ok WHERE EXISTS (
        SELECT 1 FROM recitations r WHERE r.assigned_reader_id = $1 AND r.student_id = $2
        UNION
        SELECT 1 FROM bookings b WHERE b.reader_id = $1 AND b.student_id = $2
        UNION
        SELECT 1 FROM tajweed_path_enrollments tpe
          JOIN tajweed_paths tp ON tp.id = tpe.path_id
          WHERE tp.created_by = $1 AND tpe.student_id = $2
        UNION
        SELECT 1 FROM memorization_path_enrollments mpe
          JOIN memorization_paths mp ON mp.id = mpe.path_id
          WHERE mp.created_by = $1 AND mpe.student_id = $2
      ) LIMIT 1
      `,
      [readerId, studentId],
    )) as { ok: number }[]

    if (link.length === 0 && session.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح بعرض هذا الطالب" }, { status: 403 })
    }

    // Profile
    const studentRows = (await query<any>(
      `
      SELECT id, name, email, avatar_url, gender, bio, city, qualification,
             memorized_parts, last_login_at::text, created_at::text
      FROM users WHERE id = $1 LIMIT 1
      `,
      [studentId],
    )) as any[]
    const student = studentRows[0]
    if (!student) return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 })

    // Recitations assigned to this reader
    const recitations = (await query<any>(
      `
      SELECT id, surah_name, surah_number, ayah_from, ayah_to, recitation_type,
             status, audio_url, audio_duration_seconds, qiraah,
             created_at::text, reviewed_at::text
      FROM recitations
      WHERE assigned_reader_id = $1 AND student_id = $2
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [readerId, studentId],
    )) as any[]

    // Bookings/sessions with this reader
    const sessions = (await query<any>(
      `
      SELECT id, scheduled_at::text, duration_minutes, status,
             meeting_platform, session_summary, started_at::text, ended_at::text
      FROM bookings
      WHERE reader_id = $1 AND student_id = $2
      ORDER BY scheduled_at DESC NULLS LAST
      LIMIT 50
      `,
      [readerId, studentId],
    )) as any[]

    // Tajweed paths (owned by reader) the student is enrolled in
    const tajweedPaths = (await query<any>(
      `
      SELECT tpe.id AS enrollment_id, tp.id AS path_id, tp.title, tp.thumbnail_url,
             tpe.status, tpe.stages_completed, tp.total_stages,
             tpe.started_at::text, tpe.last_activity_at::text
      FROM tajweed_path_enrollments tpe
      JOIN tajweed_paths tp ON tp.id = tpe.path_id
      WHERE tp.created_by = $1 AND tpe.student_id = $2
      ORDER BY tpe.last_activity_at DESC NULLS LAST
      `,
      [readerId, studentId],
    )) as any[]

    // Memorization paths (owned by reader) the student is enrolled in
    const memorizationPaths = (await query<any>(
      `
      SELECT mpe.id AS enrollment_id, mp.id AS path_id, mp.title, mp.thumbnail_url,
             mpe.status, mpe.units_completed, mp.total_units,
             mpe.started_at::text, mpe.last_activity_at::text
      FROM memorization_path_enrollments mpe
      JOIN memorization_paths mp ON mp.id = mpe.path_id
      WHERE mp.created_by = $1 AND mpe.student_id = $2
      ORDER BY mpe.last_activity_at DESC NULLS LAST
      `,
      [readerId, studentId],
    )) as any[]

    // Memorization stats
    const memStatsRows = (await query<any>(
      `
      SELECT
        COALESCE(SUM(new_verses), 0)::int                                              AS total_new_verses,
        COALESCE(SUM(revised_verses), 0)::int                                          AS total_revised_verses,
        COALESCE(SUM(new_verses) FILTER (WHERE log_date >= date_trunc('week', CURRENT_DATE)::date), 0)::int AS week_new_verses,
        COUNT(DISTINCT log_date) FILTER (WHERE log_date >= CURRENT_DATE - 30)::int      AS active_days_30,
        ROUND(AVG(quality_rating) FILTER (WHERE quality_rating IS NOT NULL), 1)         AS avg_quality
      FROM memorization_log
      WHERE student_id = $1
      `,
      [studentId],
    )) as any[]

    return NextResponse.json({
      student,
      recitations,
      sessions,
      tajweedPaths,
      memorizationPaths,
      memStats: memStatsRows[0] || {},
    })
  } catch (error) {
    console.error("Reader student detail error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

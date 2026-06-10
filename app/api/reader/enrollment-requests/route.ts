import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/reader/enrollment-requests
// Lists pending enrollment requests for tajweed/memorization paths owned by this reader.
export async function GET() {
  try {
    const session = await getSession()
    if (!session || !requireRole(session, ["reader", "admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const readerId = session.sub

    const tajweed = (await query<any>(
      `
      SELECT tpe.id              AS enrollment_id,
             'tajweed'           AS path_type,
             tp.id               AS path_id,
             tp.title            AS path_title,
             tp.thumbnail_url,
             tpe.status,
             tpe.request_note,
             tpe.started_at::text AS requested_at,
             u.id                AS student_id,
             u.name              AS student_name,
             u.email             AS student_email,
             u.avatar_url
      FROM tajweed_path_enrollments tpe
      JOIN tajweed_paths tp ON tp.id = tpe.path_id
      JOIN users u ON u.id = tpe.student_id
      WHERE tp.created_by = $1 AND tpe.status = 'pending'
      `,
      [readerId],
    )) as any[]

    const memorization = (await query<any>(
      `
      SELECT mpe.id              AS enrollment_id,
             'memorization'      AS path_type,
             mp.id               AS path_id,
             mp.title            AS path_title,
             mp.thumbnail_url,
             mpe.status,
             mpe.request_note,
             mpe.started_at::text AS requested_at,
             u.id                AS student_id,
             u.name              AS student_name,
             u.email             AS student_email,
             u.avatar_url
      FROM memorization_path_enrollments mpe
      JOIN memorization_paths mp ON mp.id = mpe.path_id
      JOIN users u ON u.id = mpe.student_id
      WHERE mp.created_by = $1 AND mpe.status = 'pending'
      `,
      [readerId],
    )) as any[]

    const requests = [...tajweed, ...memorization].sort(
      (a, b) => new Date(b.requested_at || 0).getTime() - new Date(a.requested_at || 0).getTime(),
    )

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Reader enrollment requests error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

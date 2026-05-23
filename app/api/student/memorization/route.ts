import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT 
        l.*,
        u.name as teacher_name,
        p.title as path_name
      FROM maqraa_memorization_logs l
      LEFT JOIN users u ON l.teacher_id = u.id
      LEFT JOIN memorization_paths p ON l.path_id = p.id
      WHERE l.student_id = $1
      ORDER BY l.created_at DESC
      LIMIT 50
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error("[API] maqraa_memorization GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { surah_number, ayah_from, ayah_to, quality, student_notes, path_id } = body

    if (!surah_number || !ayah_from || !ayah_to || !quality) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const versesCount = Math.abs(ayah_to - ayah_from) + 1

    const result = await query(`
      INSERT INTO maqraa_memorization_logs (
        student_id, path_id, surah_number, ayah_from, ayah_to, verses_count, quality, student_notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *
    `, [
      session.sub, 
      path_id || null, 
      surah_number, 
      ayah_from, 
      ayah_to, 
      versesCount, 
      quality, 
      student_notes || null
    ])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[API] maqraa_memorization POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

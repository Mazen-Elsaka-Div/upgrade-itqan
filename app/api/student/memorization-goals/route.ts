import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { getWeekStart, type MemorizationGoal } from "@/lib/memorization-goals"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const weekParam = searchParams.get("week")
    const rangeParam = parseInt(searchParams.get("range") || "0", 10)

    if (rangeParam > 0 && rangeParam <= 26) {
      // Last N weeks of history
      const goals = await query<MemorizationGoal>(
        `SELECT * FROM maqraa_memorization_goals
         WHERE student_id = $1
         ORDER BY week_start DESC
         LIMIT $2`,
        [session.sub, rangeParam],
      )
      return NextResponse.json({ goals })
    }

    const week = weekParam || getWeekStart(new Date())
    const rows = await query<MemorizationGoal>(
      `SELECT * FROM maqraa_memorization_goals
       WHERE student_id = $1 AND week_start = $2
       LIMIT 1`,
      [session.sub, week],
    )

    return NextResponse.json({
      week_start: week,
      goal: rows[0] || null,
    })
  } catch (err) {
    console.error("[API] maqraa_memorization-goals GET error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const week = body.week ? getWeekStart(body.week) : getWeekStart(new Date())

    const surahFrom = body.surah_from ?? null
    const ayahFrom = body.ayah_from ?? null
    const surahTo = body.surah_to ?? null
    const ayahTo = body.ayah_to ?? null
    const targetVerses = Math.max(0, parseInt(body.target_verses || "0", 10) || 0)
    const notes = (body.notes || "").toString().slice(0, 2000) || null

    const rows = await query<MemorizationGoal>(
      `INSERT INTO maqraa_memorization_goals (
         student_id, teacher_id, week_start,
         surah_from, ayah_from, surah_to, ayah_to,
         target_verses, notes, status
       )
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, 'active')
       ON CONFLICT (student_id, week_start) DO UPDATE SET
         surah_from    = EXCLUDED.surah_from,
         ayah_from     = EXCLUDED.ayah_from,
         surah_to      = EXCLUDED.surah_to,
         ayah_to       = EXCLUDED.ayah_to,
         target_verses = EXCLUDED.target_verses,
         notes         = EXCLUDED.notes,
         status        = CASE
           WHEN maqraa_memorization_goals.status = 'completed' THEN 'completed'
           ELSE 'active'
         END,
         updated_at    = NOW()
       RETURNING *`,
      [session.sub, week, surahFrom, ayahFrom, surahTo, ayahTo, targetVerses, notes],
    )

    return NextResponse.json({ goal: rows[0] })
  } catch (err: any) {
    console.error("[API] maqraa_memorization-goals POST error:", err)
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    )
  }
}

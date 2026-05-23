import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import type { MemorizationGoal } from "@/lib/memorization-goals"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await req.json()
    const { status } = body

    if (status !== "completed" && status !== "active") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const rows = await query<MemorizationGoal>(
      `UPDATE maqraa_memorization_goals
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND student_id = $3
       RETURNING *`,
      [status, id, session.sub]
    )

    if (!rows[0]) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({ goal: rows[0] })
  } catch (err) {
    console.error("[API] maqraa_memorization-goals PATCH error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

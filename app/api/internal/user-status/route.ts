import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const userRow = await queryOne<{
        role: string
        is_active: boolean
        is_disabled: boolean
        has_academy_access: boolean
        has_quran_access: boolean
        approval_status: string
        must_change_password: boolean
    }>(
        `SELECT role, is_active, is_disabled, has_academy_access, has_quran_access, approval_status, must_change_password FROM users WHERE id = $1 LIMIT 1`,
        [userId]
    )

    return NextResponse.json(userRow || null)
  } catch (error) {
    console.error("[Internal User Status Check] Error:", error)
    return NextResponse.json({ error: "DB Error" }, { status: 500 })
  }
}

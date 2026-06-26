import { NextRequest, NextResponse } from "next/server"
import { generateAndSendParentWeeklyReports, getPreviousWeekWindow } from "@/lib/academy/parent-reports"
import { isCronAuthorized } from "@/lib/cron-auth"

function isAuthorized(req: NextRequest): boolean {
  return isCronAuthorized(req)
}

async function run(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const weekStartParam = searchParams.get("weekStart")
  const weekEndParam = searchParams.get("weekEnd")
  const { weekStart, weekEnd } = weekStartParam && weekEndParam
    ? { weekStart: weekStartParam, weekEnd: weekEndParam }
    : getPreviousWeekWindow()

  try {
    const result = await generateAndSendParentWeeklyReports(weekStart, weekEnd)
    return NextResponse.json({ success: true, weekStart, weekEnd, ...result })
  } catch (error) {
    console.error("[cron parent-weekly-reports] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return run(req)
}

export async function POST(req: NextRequest) {
  return run(req)
}

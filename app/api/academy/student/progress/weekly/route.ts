import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const AR_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * GET /api/academy/student/progress/weekly?locale=ar
 *
 * Returns the last 7 calendar days of activity aggregated from points_log:
 *   [{ day, points, tasks, lessons }]
 * Days with no activity are still returned (points = 0) so the chart shows a
 * full week instead of collapsing to whatever days happen to have entries.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar'
  const labels = locale === 'en' ? EN_WEEKDAYS : AR_WEEKDAYS

  try {
    const rows = await query<{
      day: string
      points: string
      tasks: string
      lessons: string
    }>(
      `SELECT
         to_char(created_at, 'YYYY-MM-DD') AS day,
         COALESCE(SUM(points), 0)::int AS points,
         COUNT(*) FILTER (WHERE reason = 'task')::int AS tasks,
         COUNT(*) FILTER (WHERE reason = 'lesson')::int AS lessons
       FROM points_log
       WHERE user_id = $1
         AND created_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY 1`,
      [session.sub]
    )

    const byDay = new Map(rows.map((r) => [r.day, r]))

    // Build a continuous 7-day window ending today.
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const row = byDay.get(key)
      data.push({
        day: labels[d.getDay()],
        points: row ? parseInt(row.points as unknown as string) : 0,
        tasks: row ? parseInt(row.tasks as unknown as string) : 0,
        lessons: row ? parseInt(row.lessons as unknown as string) : 0,
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[API] student/progress/weekly GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

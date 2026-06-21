import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]
const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * GET /api/academy/student/progress/monthly?locale=ar&months=6
 *
 * Returns the last N calendar months of activity aggregated from points_log:
 *   [{ label, points, tasks, lessons, active_days }]
 * This powers the monthly trend chart so students can compare weekly vs monthly
 * activity. Months with no activity are still returned (points = 0) so the chart
 * always shows a complete, comparable timeline.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar'
  const monthsParam = parseInt(req.nextUrl.searchParams.get('months') || '6', 10)
  const months = Math.min(12, Math.max(3, Number.isFinite(monthsParam) ? monthsParam : 6))
  const monthLabels = locale === 'en' ? EN_MONTHS : AR_MONTHS

  try {
    const rows = await query<{
      ym: string
      points: string
      tasks: string
      lessons: string
      active_days: string
    }>(
      `SELECT
         to_char(date_trunc('month', created_at), 'YYYY-MM') AS ym,
         COALESCE(SUM(points), 0)::int AS points,
         COUNT(*) FILTER (WHERE reason = 'task')::int AS tasks,
         COUNT(*) FILTER (WHERE reason = 'lesson')::int AS lessons,
         COUNT(DISTINCT created_at::date)::int AS active_days
       FROM points_log
       WHERE user_id = $1
         AND created_at >= date_trunc('month', CURRENT_DATE) - make_interval(months => $2)
       GROUP BY 1`,
      [session.sub, months - 1]
    )

    const byMonth = new Map(rows.map((r) => [r.ym, r]))

    const data = []
    const now = new Date()
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const row = byMonth.get(key)
      data.push({
        label: monthLabels[d.getMonth()],
        points: row ? parseInt(row.points as unknown as string) : 0,
        tasks: row ? parseInt(row.tasks as unknown as string) : 0,
        lessons: row ? parseInt(row.lessons as unknown as string) : 0,
        active_days: row ? parseInt(row.active_days as unknown as string) : 0,
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[API] student/progress/monthly GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

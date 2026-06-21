import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/student/progress/achievements?limit=5
 *
 * Returns the student's most recently earned badges, shaped for the Progress
 * page's "recent achievements" list: { id, title, description, earned_at, icon }.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limitParam = parseInt(req.nextUrl.searchParams.get('limit') || '5', 10)
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitParam) ? limitParam : 5))

  try {
    const rows = await query<{
      id: string
      badge_type: string
      badge_name: string
      badge_description: string | null
      badge_icon_url: string | null
      awarded_at: string
    }>(
      `SELECT id, badge_type, badge_name, badge_description, badge_icon_url, awarded_at
         FROM badges
        WHERE user_id = $1
        ORDER BY awarded_at DESC
        LIMIT $2`,
      [session.sub, limit]
    )

    const data = rows.map((b) => ({
      id: b.id,
      title: b.badge_name,
      description: b.badge_description ?? '',
      earned_at: b.awarded_at,
      icon: b.badge_icon_url ?? '🏅',
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[API] student/progress/achievements GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

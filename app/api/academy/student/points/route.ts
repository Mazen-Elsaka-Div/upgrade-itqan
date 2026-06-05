import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { getUserPointsSummary, POINTS_RULES, type AcademyLevel } from '@/lib/academy/gamification'

const LEVEL_LABELS: Record<AcademyLevel, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
  hafiz: 'حافظ',
  master: 'متقن',
}

const LEVELS = [
  { key: 'beginner', min: 0, label: 'مبتدئ' },
  { key: 'intermediate', min: 500, label: 'متوسط' },
  { key: 'advanced', min: 2000, label: 'متقدم' },
  { key: 'hafiz', min: 5000, label: 'حافظ' },
]

const POINTS_CONFIG: Record<string, number> = {
  recitation: POINTS_RULES.recitation,
  mastered: POINTS_RULES.mastered,
  task: POINTS_RULES.task,
  lesson: 10,
  session_attend: POINTS_RULES.session_attend,
  course_complete: POINTS_RULES.juz_complete,
  streak: POINTS_RULES.streak,
}

/**
 * GET /api/academy/student/points
 *
 * Returns the authenticated user's gamification summary:
 *   - total_points / level / level progress / streak
 *   - badges_earned count
 *   - the last 20 entries from points_log (with reason + description)
 */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || !['student', 'teacher', 'parent', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await getUserPointsSummary(session.sub)

    const [log, verses, badgeRows] = await Promise.all([
      query<{
        id: string
        points: number
        reason: string
        description: string | null
        related_entity_type: string | null
        related_entity_id: string | null
        created_at: string
      }>(
        `SELECT id, points, reason, description, related_entity_type, related_entity_id, created_at
           FROM points_log
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 20`,
        [session.sub]
      ),
      queryOne<{ total_verses_memorized: number; total_verses_revised: number }>(
        `SELECT COALESCE(total_verses_memorized, 0)::int AS total_verses_memorized,
                COALESCE(total_verses_revised, 0)::int  AS total_verses_revised
           FROM user_points WHERE user_id = $1`,
        [session.sub]
      ),
      query<{
        badge_type: string
        badge_name: string
        badge_description: string | null
        badge_icon_url: string | null
        points_awarded: number
        awarded_at: string
      }>(
        `SELECT badge_type, badge_name, badge_description, badge_icon_url, points_awarded, awarded_at
           FROM badges
          WHERE user_id = $1
          ORDER BY awarded_at DESC`,
        [session.sub]
      ),
    ])

    const lp = summary.level_progress
    const next_level = lp.next
      ? { key: lp.next, label: LEVEL_LABELS[lp.next] ?? lp.next, min: lp.next_floor ?? summary.total_points }
      : null
    const points_to_next_level = lp.next_floor
      ? Math.max(0, lp.next_floor - summary.total_points)
      : 0

    const badges = badgeRows.map((b) => ({
      badge_key: b.badge_type,
      badge_name: b.badge_name,
      badge_description: b.badge_description ?? '',
      badge_icon: '🏅',
      badge_image_url: b.badge_icon_url,
      badge_color: '#f59e0b',
      points_awarded: b.points_awarded,
      awarded_at: b.awarded_at,
    }))

    return NextResponse.json({
      // ---- flat shape consumed by the student points page ----
      total_points: summary.total_points,
      level: summary.level,
      level_label: LEVEL_LABELS[summary.level] ?? summary.level,
      streak_days: summary.streak_days,
      longest_streak: summary.longest_streak,
      streak_multiplier_active: summary.streak_days >= 7,
      next_level,
      points_to_next_level,
      total_verses_memorized: verses?.total_verses_memorized ?? 0,
      total_verses_revised: verses?.total_verses_revised ?? 0,
      points_config: POINTS_CONFIG,
      levels: LEVELS,
      log,
      badges,
      // ---- nested shape kept backwards-compatible (dashboard) ----
      data: {
        points: {
          user_id: summary.user_id,
          total_points: summary.total_points,
          points: summary.total_points, // alias for older clients
          level: summary.level,
          streak_days: summary.streak_days,
          longest_streak: summary.longest_streak,
          last_activity_date: summary.last_activity_date,
          badges_earned: summary.badges_earned,
          level_progress: summary.level_progress,
          unlocked_features: summary.unlocked_features,
        },
        log,
      },
    })
  } catch (error) {
    console.error('[API] student/points GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

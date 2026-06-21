import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getUserPointsSummary, awardDailyLoginIfNew, BADGE_CATALOGUE } from '@/lib/academy/gamification'

/**
 * GET /api/academy/student/progress
 *
 * Aggregated stats for the student Progress page. The page expects a NUMERIC
 * `current_level` and reasons about 1000-point bands (see getLevelProgress in
 * the page), so we derive a numeric level from total_points here to keep the
 * client math consistent.
 */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Opening the Progress page is a daily activity signal too — keep it in
    // sync with the dashboard, which also grants the daily-login bump.
    if (['student', 'reader'].includes(session.role)) {
      await awardDailyLoginIfNew(session.sub)
    }

    const summary = await getUserPointsSummary(session.sub)

    const [
      coursesRow,
      tasksRow,
      lessonsRow,
      versesRow,
      attendanceRow,
    ] = await Promise.all([
      query<{ enrolled: string; completed: string }>(
        `SELECT
           COUNT(*)::int AS enrolled,
           COUNT(*) FILTER (
             WHERE LOWER(status) = 'completed'
                OR completed_at IS NOT NULL
                OR COALESCE(progress_percentage, 0) >= 100
           )::int AS completed
         FROM enrollments WHERE student_id = $1`,
        [session.sub]
      ),
      query<{ total: string; completed: string }>(
        `SELECT
           COUNT(DISTINCT t.id)::int AS total,
           COUNT(DISTINCT ts.task_id) FILTER (WHERE ts.status IN ('submitted','graded'))::int AS completed
         FROM tasks t
         LEFT JOIN enrollments e ON e.course_id = t.course_id AND e.student_id = $1
         LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.student_id = $1
         WHERE t.assigned_to = $1 OR e.student_id = $1`,
        [session.sub]
      ),
      query<{ total: string; completed: string }>(
        `SELECT
           COUNT(DISTINCT l.id)::int AS total,
           COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.is_completed = TRUE)::int AS completed
         FROM enrollments e
         JOIN lessons l ON l.course_id = e.course_id AND l.status = 'published'
         LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
         WHERE e.student_id = $1`,
        [session.sub]
      ),
      query<{ memorized: string }>(
        `SELECT COALESCE(total_verses_memorized, 0)::int AS memorized
         FROM user_points WHERE user_id = $1`,
        [session.sub]
      ),
      query<{ attended: string; total: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE sa.id IS NOT NULL)::int AS attended,
           COUNT(*)::int AS total
         FROM course_sessions cs
         JOIN enrollments e ON e.course_id = cs.course_id AND e.student_id = $1
         LEFT JOIN session_attendance sa ON sa.session_id = cs.id AND sa.student_id = $1
         WHERE cs.scheduled_at < NOW()
           AND cs.status IN ('completed','ended','finished','live','in_progress')`,
        [session.sub]
      ),
    ])

    const totalPoints = summary.total_points
    // Numeric level on 1000-point bands so the page's getLevelProgress() math
    // (currentLevelPoints = (level-1)*1000, nextLevelPoints = level*1000) holds.
    const numericLevel = Math.floor(totalPoints / 1000) + 1
    const pointsToNextLevel = numericLevel * 1000 - totalPoints

    const attendedTotal = parseInt(attendanceRow[0]?.total || '0')
    const attendanceRate = attendedTotal > 0
      ? Math.round((parseInt(attendanceRow[0]?.attended || '0') / attendedTotal) * 100)
      : 0

    return NextResponse.json({
      total_points: totalPoints,
      current_level: numericLevel,
      points_to_next_level: pointsToNextLevel,
      streak_days: summary.streak_days,
      longest_streak: summary.longest_streak,
      courses_enrolled: parseInt(coursesRow[0]?.enrolled || '0'),
      courses_completed: parseInt(coursesRow[0]?.completed || '0'),
      tasks_completed: parseInt(tasksRow[0]?.completed || '0'),
      total_tasks: parseInt(tasksRow[0]?.total || '0'),
      lessons_completed: parseInt(lessonsRow[0]?.completed || '0'),
      total_lessons: parseInt(lessonsRow[0]?.total || '0'),
      memorized_ayahs: parseInt(versesRow[0]?.memorized || '0'),
      attendance_rate: attendanceRate,
      badges_earned: summary.badges_earned,
      total_badges: BADGE_CATALOGUE.length,
    })
  } catch (error) {
    console.error('[API] student/progress GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

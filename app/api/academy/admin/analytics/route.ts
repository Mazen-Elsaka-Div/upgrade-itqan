import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

interface CountRow {
  count: number
}

async function safeCount(sql: string, params: unknown[] = []): Promise<number> {
  try {
    const rows = await query<CountRow>(sql, params)
    return rows[0]?.count ?? 0
  } catch {
    return 0
  }
}

async function safeQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  try {
    return await query<T>(sql, params)
  } catch {
    return []
  }
}

export async function GET() {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalReaders,
      totalAdmins,
      activeCourses,
      draftCourses,
      archivedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalLessons,
      totalSessions,
      upcomingSessions,
      completedSessions,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalCertificates,
      weeklyEnrollments,
      monthlyEnrollments,
      dailyActiveStudents,
      weeklyActiveStudents,
      monthlyActiveStudents,
      attendancePresent,
      attendanceTotal,
      learningPaths,
      memorizationPaths,
      tajweedPaths,
      totalRecitations,
      totalBookings,
      totalBooks,
      totalBookFiles,
      forumPosts,
      communityMembers,
    ] = await Promise.all([
      safeCount(`SELECT COUNT(*)::int as count FROM users WHERE role = 'student' AND has_academy_access = true`),
      safeCount(`SELECT COUNT(*)::int as count FROM users WHERE role = 'teacher'`),
      safeCount(`SELECT COUNT(*)::int as count FROM users WHERE role = 'parent'`),
      safeCount(`SELECT COUNT(*)::int as count FROM users WHERE role = 'reader'`),
      safeCount(`SELECT COUNT(*)::int as count FROM users WHERE role IN ('admin','academy_admin')`),
      safeCount(`SELECT COUNT(*)::int as count FROM courses WHERE status = 'published' OR is_published = true`),
      safeCount(`SELECT COUNT(*)::int as count FROM courses WHERE status = 'draft'`),
      safeCount(`SELECT COUNT(*)::int as count FROM courses WHERE status = 'archived'`),
      safeCount(`SELECT COUNT(*)::int as count FROM enrollments`),
      safeCount(`SELECT COUNT(*)::int as count FROM enrollments WHERE LOWER(status) = 'active'`),
      safeCount(`SELECT COUNT(*)::int as count FROM enrollments WHERE LOWER(status) = 'completed' OR progress_percentage >= 100`),
      safeCount(`SELECT COUNT(*)::int as count FROM lessons`),
      safeCount(`SELECT COUNT(*)::int as count FROM course_sessions`),
      safeCount(`SELECT COUNT(*)::int as count FROM course_sessions WHERE scheduled_at > NOW() AND status = 'scheduled'`),
      safeCount(`SELECT COUNT(*)::int as count FROM course_sessions WHERE status = 'completed'`),
      safeCount(`SELECT COUNT(*)::int as count FROM tasks`),
      safeCount(`SELECT COUNT(*)::int as count FROM tasks WHERE status = 'done'`),
      safeCount(`SELECT COUNT(*)::int as count FROM tasks WHERE status = 'overdue' OR (status = 'pending' AND due_date < NOW())`),
      safeCount(`SELECT COUNT(*)::int as count FROM academy_certificates`),
      safeCount(`SELECT COUNT(*)::int as count FROM enrollments WHERE enrolled_at >= NOW() - INTERVAL '7 days'`),
      safeCount(`SELECT COUNT(*)::int as count FROM enrollments WHERE enrolled_at >= NOW() - INTERVAL '30 days'`),
      safeCount(`SELECT COUNT(DISTINCT user_id)::int as count FROM points_log WHERE created_at >= NOW() - INTERVAL '1 day'`),
      safeCount(`SELECT COUNT(DISTINCT user_id)::int as count FROM points_log WHERE created_at >= NOW() - INTERVAL '7 days'`),
      safeCount(`SELECT COUNT(DISTINCT user_id)::int as count FROM points_log WHERE created_at >= NOW() - INTERVAL '30 days'`),
      safeCount(`SELECT COUNT(*)::int as count FROM session_attendance WHERE attendance_status = 'present'`),
      safeCount(`SELECT COUNT(*)::int as count FROM session_attendance`),
      safeCount(`SELECT COUNT(*)::int as count FROM learning_paths WHERE is_published = true`),
      safeCount(`SELECT COUNT(*)::int as count FROM memorization_paths WHERE is_published = true`),
      safeCount(`SELECT COUNT(*)::int as count FROM tajweed_paths WHERE is_published = true`),
      safeCount(`SELECT COUNT(*)::int as count FROM recitations`),
      safeCount(`SELECT COUNT(*)::int as count FROM bookings`),
      safeCount(`SELECT COUNT(*)::int as count FROM books`),
      safeCount(`SELECT COUNT(*)::int as count FROM book_files`),
      safeCount(`SELECT COUNT(*)::int as count FROM forum_posts`),
      safeCount(`SELECT COUNT(DISTINCT user_id)::int as count FROM forum_posts WHERE created_at >= NOW() - INTERVAL '30 days'`),
    ])

    const completionRow = await safeQuery<{ avg: number }>(
      `SELECT COALESCE(AVG(progress_percentage), 0)::int as avg FROM enrollments WHERE LOWER(status) = 'active'`
    )
    const completionRate = completionRow[0]?.avg ?? 0

    const attendanceRate = attendanceTotal > 0
      ? Math.round((attendancePresent / attendanceTotal) * 100)
      : 0

    const taskCompletionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0

    const dailyActivityRate = totalStudents > 0
      ? Math.round((dailyActiveStudents / totalStudents) * 100)
      : 0

    const enrollmentTrend = await safeQuery<{ month: string; count: number }>(
      `SELECT
        TO_CHAR(enrolled_at, 'YYYY-MM') as month,
        COUNT(*)::int as count
       FROM enrollments
       WHERE enrolled_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(enrolled_at, 'YYYY-MM')
       ORDER BY month ASC`
    )

    const genderDistribution = await safeQuery<{ gender: string; count: number }>(
      `SELECT COALESCE(gender, 'unknown') as gender, COUNT(*)::int as count
       FROM users WHERE role = 'student' AND has_academy_access = true
       GROUP BY gender`
    )

    const topCourses = await safeQuery<{
      title: string
      enrollments: number
      avg_progress: number
    }>(
      `SELECT
         c.title,
         COUNT(e.id)::int as enrollments,
         COALESCE(AVG(e.progress_percentage), 0)::int as avg_progress
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.status = 'published' OR c.is_published = true
       GROUP BY c.id, c.title
       ORDER BY enrollments DESC
       LIMIT 10`
    )

    const topTeachers = await safeQuery<{
      teacher_id: string
      name: string
      courses_count: number
      students_count: number
    }>(
      `SELECT
         u.id as teacher_id,
         u.name,
         COUNT(DISTINCT c.id)::int as courses_count,
         COUNT(DISTINCT e.student_id)::int as students_count
       FROM users u
       LEFT JOIN courses c ON c.teacher_id = u.id
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE u.role = 'teacher'
       GROUP BY u.id, u.name
       ORDER BY students_count DESC, courses_count DESC
       LIMIT 10`
    )

    const studentsByCountry = await safeQuery<{
      country: string
      country_code: string | null
      count: number
      active_count: number
    }>(
      `SELECT
        COALESCE(NULLIF(country, ''), 'غير محدد') AS country,
        NULLIF(country_code, '') AS country_code,
        COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days')::int AS active_count
       FROM users
       WHERE role = 'student' AND has_academy_access = true
       GROUP BY COALESCE(NULLIF(country, ''), 'غير محدد'), NULLIF(country_code, '')
       ORDER BY count DESC, country ASC`
    )

    const geoHeatmap = await safeQuery<{
      country: string
      country_code: string | null
      region: string
      city: string
      count: number
    }>(
      `SELECT
        COALESCE(NULLIF(country, ''), 'غير محدد') AS country,
        NULLIF(country_code, '') AS country_code,
        COALESCE(NULLIF(region, ''), 'غير محدد') AS region,
        COALESCE(NULLIF(city, ''), 'غير محدد') AS city,
        COUNT(*)::int AS count
       FROM users
       WHERE role = 'student' AND has_academy_access = true
       GROUP BY
        COALESCE(NULLIF(country, ''), 'غير محدد'),
        NULLIF(country_code, ''),
        COALESCE(NULLIF(region, ''), 'غير محدد'),
        COALESCE(NULLIF(city, ''), 'غير محدد')
       ORDER BY count DESC, country ASC, region ASC
       LIMIT 50`
    )

    const dailyActivity = await safeQuery<{
      day: string
      active_students: number
      points: number
    }>(
      `SELECT
        TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT user_id)::int AS active_students,
        COALESCE(SUM(points), 0)::int AS points
       FROM points_log
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY created_at::date
       ORDER BY created_at::date ASC`
    )

    const topSurahs = await safeQuery<{
      surah_name: string
      surah_number: number | null
      recordings: number
      unique_students: number
    }>(
      `SELECT
        COALESCE(surah_name, 'غير محدد') AS surah_name,
        surah_number,
        COUNT(*)::int AS recordings,
        COUNT(DISTINCT student_id)::int AS unique_students
       FROM recitations
       WHERE created_at >= NOW() - INTERVAL '90 days'
       GROUP BY COALESCE(surah_name, 'غير محدد'), surah_number
       ORDER BY recordings DESC, unique_students DESC
       LIMIT 10`
    )

    const topStudents = await safeQuery<{
      student_id: string
      name: string
      points: number
      enrollments: number
      completed: number
    }>(
      `SELECT
         u.id as student_id,
         u.name,
         COALESCE((SELECT SUM(points) FROM points_log p WHERE p.user_id = u.id), 0)::int as points,
         COUNT(DISTINCT e.id)::int as enrollments,
         COUNT(DISTINCT e.id) FILTER (WHERE e.progress_percentage >= 100)::int as completed
       FROM users u
       LEFT JOIN enrollments e ON e.student_id = u.id
       WHERE u.role = 'student' AND u.has_academy_access = true
       GROUP BY u.id, u.name
       ORDER BY points DESC, enrollments DESC
       LIMIT 10`
    )

    const enrollmentStatuses = await safeQuery<{ status: string; count: number }>(
      `SELECT COALESCE(status, 'unknown') as status, COUNT(*)::int as count
       FROM enrollments
       GROUP BY status
       ORDER BY count DESC`
    )

    const sessionsByStatus = await safeQuery<{ status: string; count: number }>(
      `SELECT COALESCE(status, 'unknown') as status, COUNT(*)::int as count
       FROM course_sessions
       GROUP BY status
       ORDER BY count DESC`
    )

    const lastSignups = await safeQuery<{
      id: string
      name: string
      role: string
      created_at: string
    }>(
      `SELECT id, name, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`
    )

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalParents,
        totalReaders,
        totalAdmins,
        activeCourses,
        draftCourses,
        archivedCourses,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        totalLessons,
        totalSessions,
        upcomingSessions,
        completedSessions,
        totalTasks,
        completedTasks,
        overdueTasks,
        taskCompletionRate,
        attendancePresent,
        attendanceTotal,
        attendanceRate,
        completionRate,
        totalCertificates,
        weeklyEnrollments,
        monthlyEnrollments,
        dailyActiveStudents,
        weeklyActiveStudents,
        monthlyActiveStudents,
        dailyActivityRate,
        learningPaths,
        memorizationPaths,
        tajweedPaths,
        totalRecitations,
        totalBookings,
        totalBooks,
        totalBookFiles,
        forumPosts,
        communityMembers,
      },
      enrollmentTrend,
      genderDistribution,
      topCourses,
      topTeachers,
      topStudents,
      enrollmentStatuses,
      sessionsByStatus,
      studentsByCountry,
      geoHeatmap,
      dailyActivity,
      topSurahs,
      lastSignups,
    })
  } catch (error) {
    console.error('[API] Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

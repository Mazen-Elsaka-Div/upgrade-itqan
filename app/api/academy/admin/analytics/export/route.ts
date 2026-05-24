import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

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

function applyRtl(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ rightToLeft: true }]
}

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF065F46" },
    }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      top: { style: "thin", color: { argb: "FF065F46" } },
      bottom: { style: "thin", color: { argb: "FF065F46" } },
      left: { style: "thin", color: { argb: "FF065F46" } },
      right: { style: "thin", color: { argb: "FF065F46" } },
    }
  })
}

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || !["academy_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = "Itqan Academy"
  wb.created = new Date()

  // 1) Summary sheet
  const summary = wb.addWorksheet("ملخص", { views: [{ rightToLeft: true }] })
  summary.columns = [
    { header: "المقياس", key: "label", width: 38 },
    { header: "القيمة", key: "value", width: 18 },
  ]

  const [
    totalStudents,
    totalTeachers,
    totalParents,
    totalReaders,
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

  const attendanceRate = attendanceTotal > 0
    ? Math.round((attendancePresent / attendanceTotal) * 100)
    : 0
  const taskCompletionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0
  const dailyActivityRate = totalStudents > 0
    ? Math.round((dailyActiveStudents / totalStudents) * 100)
    : 0

  const completionRow = await safeQuery<{ avg: number }>(
    `SELECT COALESCE(AVG(progress_percentage), 0)::int as avg FROM enrollments WHERE LOWER(status) = 'active'`
  )
  const completionRate = completionRow[0]?.avg ?? 0

  const summaryRows: Array<[string, string | number]> = [
    ["إجمالي الطلاب", totalStudents],
    ["إجمالي المدرسين", totalTeachers],
    ["إجمالي أولياء الأمور", totalParents],
    ["إجمالي المقرئين", totalReaders],
    ["الدورات النشطة", activeCourses],
    ["مسودات الدورات", draftCourses],
    ["الدورات المؤرشفة", archivedCourses],
    ["إجمالي التسجيلات", totalEnrollments],
    ["تسجيلات نشطة", activeEnrollments],
    ["تسجيلات مكتملة", completedEnrollments],
    ["إجمالي الدروس", totalLessons],
    ["إجمالي الجلسات", totalSessions],
    ["جلسات قادمة", upcomingSessions],
    ["جلسات مكتملة", completedSessions],
    ["إجمالي المهام", totalTasks],
    ["مهام مكتملة", completedTasks],
    ["مهام متأخرة", overdueTasks],
    ["معدل إنجاز المهام (%)", taskCompletionRate],
    ["حضور الجلسات (%)", attendanceRate],
    ["معدل التقدم العام (%)", completionRate],
    ["الشهادات الصادرة", totalCertificates],
    ["تسجيلات هذا الأسبوع", weeklyEnrollments],
    ["تسجيلات هذا الشهر", monthlyEnrollments],
    ["نشطون اليوم", dailyActiveStudents],
    ["نشطون أسبوعياً", weeklyActiveStudents],
    ["نشطون شهرياً", monthlyActiveStudents],
    ["نسبة النشاط اليومي (%)", dailyActivityRate],
    ["المسارات التعليمية", learningPaths],
    ["مسارات الحفظ", memorizationPaths],
    ["مسارات التجويد", tajweedPaths],
    ["إجمالي التسجيلات الصوتية", totalRecitations],
    ["إجمالي الحجوزات", totalBookings],
    ["كتب المكتبة", totalBooks],
    ["ملفات كتب المكتبة", totalBookFiles],
    ["مشاركات المنتدى", forumPosts],
    ["أعضاء نشطون بالمجتمع (30ي)", communityMembers],
  ]

  styleHeader(summary.getRow(1))
  summary.addRows(summaryRows.map(([label, value]) => ({ label, value })))

  // 2) Students sheet
  const students = await safeQuery<{
    id: string
    name: string
    email: string
    country: string | null
    enrollments: number
    completed: number
    points: number
    last_login_at: string | null
    created_at: string
  }>(
    `SELECT
        u.id,
        u.name,
        u.email,
        u.country,
        COUNT(DISTINCT e.id)::int AS enrollments,
        COUNT(DISTINCT e.id) FILTER (WHERE e.progress_percentage >= 100)::int AS completed,
        COALESCE((SELECT SUM(points) FROM points_log p WHERE p.user_id = u.id), 0)::int AS points,
        u.last_login_at,
        u.created_at
      FROM users u
      LEFT JOIN enrollments e ON e.student_id = u.id
      WHERE u.role = 'student' AND u.has_academy_access = true
      GROUP BY u.id
      ORDER BY points DESC, u.name ASC`
  )
  const studentsSheet = wb.addWorksheet("الطلاب")
  applyRtl(studentsSheet)
  studentsSheet.columns = [
    { header: "الاسم", key: "name", width: 28 },
    { header: "البريد", key: "email", width: 32 },
    { header: "الدولة", key: "country", width: 18 },
    { header: "التسجيلات", key: "enrollments", width: 14 },
    { header: "مكتملة", key: "completed", width: 12 },
    { header: "النقاط", key: "points", width: 12 },
    { header: "آخر دخول", key: "last_login_at", width: 22 },
    { header: "تاريخ التسجيل", key: "created_at", width: 22 },
  ]
  styleHeader(studentsSheet.getRow(1))
  studentsSheet.addRows(students)

  // 3) Teachers sheet
  const teachers = await safeQuery<{
    id: string
    name: string
    email: string
    courses_count: number
    published_courses: number
    students_count: number
  }>(
    `SELECT
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT c.id)::int AS courses_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published' OR c.is_published = true)::int AS published_courses,
        COUNT(DISTINCT e.student_id)::int AS students_count
      FROM users u
      LEFT JOIN courses c ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY students_count DESC, courses_count DESC`
  )
  const teachersSheet = wb.addWorksheet("المدرسون")
  applyRtl(teachersSheet)
  teachersSheet.columns = [
    { header: "الاسم", key: "name", width: 28 },
    { header: "البريد", key: "email", width: 32 },
    { header: "الدورات", key: "courses_count", width: 12 },
    { header: "منشورة", key: "published_courses", width: 12 },
    { header: "إجمالي الطلاب", key: "students_count", width: 16 },
  ]
  styleHeader(teachersSheet.getRow(1))
  teachersSheet.addRows(teachers)

  // 4) Courses sheet
  const courses = await safeQuery<{
    id: string
    title: string
    teacher: string
    status: string | null
    enrollments: number
    avg_progress: number
    lessons: number
    created_at: string
  }>(
    `SELECT
        c.id,
        c.title,
        u.name AS teacher,
        c.status,
        COUNT(DISTINCT e.id)::int AS enrollments,
        COALESCE(AVG(e.progress_percentage), 0)::int AS avg_progress,
        COUNT(DISTINCT l.id)::int AS lessons,
        c.created_at
      FROM courses c
      LEFT JOIN users u ON u.id = c.teacher_id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN lessons l ON l.course_id = c.id
      GROUP BY c.id, u.name
      ORDER BY enrollments DESC`
  )
  const coursesSheet = wb.addWorksheet("الدورات")
  applyRtl(coursesSheet)
  coursesSheet.columns = [
    { header: "العنوان", key: "title", width: 36 },
    { header: "المدرس", key: "teacher", width: 24 },
    { header: "الحالة", key: "status", width: 14 },
    { header: "التسجيلات", key: "enrollments", width: 14 },
    { header: "متوسط التقدم", key: "avg_progress", width: 16 },
    { header: "الدروس", key: "lessons", width: 12 },
    { header: "تاريخ الإنشاء", key: "created_at", width: 22 },
  ]
  styleHeader(coursesSheet.getRow(1))
  coursesSheet.addRows(courses)

  // 5) Sessions sheet
  const sessions = await safeQuery<{
    title: string
    course: string
    scheduled_at: string | null
    status: string | null
    duration_minutes: number | null
    attendance: number
  }>(
    `SELECT
        cs.title,
        c.title AS course,
        cs.scheduled_at,
        cs.status,
        cs.duration_minutes,
        COUNT(sa.id) FILTER (WHERE sa.attendance_status = 'present')::int AS attendance
      FROM course_sessions cs
      LEFT JOIN courses c ON c.id = cs.course_id
      LEFT JOIN session_attendance sa ON sa.session_id = cs.id
      GROUP BY cs.id, c.title
      ORDER BY cs.scheduled_at DESC NULLS LAST
      LIMIT 500`
  )
  const sessionsSheet = wb.addWorksheet("الجلسات")
  applyRtl(sessionsSheet)
  sessionsSheet.columns = [
    { header: "عنوان الجلسة", key: "title", width: 32 },
    { header: "الدورة", key: "course", width: 28 },
    { header: "الموعد", key: "scheduled_at", width: 22 },
    { header: "الحالة", key: "status", width: 14 },
    { header: "المدة (دقائق)", key: "duration_minutes", width: 16 },
    { header: "حضور", key: "attendance", width: 12 },
  ]
  styleHeader(sessionsSheet.getRow(1))
  sessionsSheet.addRows(sessions)

  // 6) Enrollments sheet
  const enrollments = await safeQuery<{
    student: string
    course: string
    status: string | null
    progress_percentage: number | null
    enrolled_at: string
    completed_at: string | null
  }>(
    `SELECT
        u.name AS student,
        c.title AS course,
        e.status,
        e.progress_percentage,
        e.enrolled_at,
        e.completed_at
      FROM enrollments e
      LEFT JOIN users u ON u.id = e.student_id
      LEFT JOIN courses c ON c.id = e.course_id
      ORDER BY e.enrolled_at DESC
      LIMIT 1000`
  )
  const enrollmentsSheet = wb.addWorksheet("التسجيلات")
  applyRtl(enrollmentsSheet)
  enrollmentsSheet.columns = [
    { header: "الطالب", key: "student", width: 28 },
    { header: "الدورة", key: "course", width: 32 },
    { header: "الحالة", key: "status", width: 14 },
    { header: "التقدم", key: "progress_percentage", width: 14 },
    { header: "تاريخ التسجيل", key: "enrolled_at", width: 22 },
    { header: "تاريخ الإكمال", key: "completed_at", width: 22 },
  ]
  styleHeader(enrollmentsSheet.getRow(1))
  enrollmentsSheet.addRows(enrollments)

  // 7) Countries sheet
  const countries = await safeQuery<{
    country: string
    students: number
    active_7d: number
  }>(
    `SELECT
        COALESCE(NULLIF(country, ''), 'غير محدد') AS country,
        COUNT(*)::int AS students,
        COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days')::int AS active_7d
      FROM users
      WHERE role = 'student' AND has_academy_access = true
      GROUP BY COALESCE(NULLIF(country, ''), 'غير محدد')
      ORDER BY students DESC`
  )
  const countriesSheet = wb.addWorksheet("الدول")
  applyRtl(countriesSheet)
  countriesSheet.columns = [
    { header: "الدولة", key: "country", width: 28 },
    { header: "الطلاب", key: "students", width: 14 },
    { header: "نشطون (7ي)", key: "active_7d", width: 16 },
  ]
  styleHeader(countriesSheet.getRow(1))
  countriesSheet.addRows(countries)

  const buffer = await wb.xlsx.writeBuffer()
  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="academy-analytics-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  })
}

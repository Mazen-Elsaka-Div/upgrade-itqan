"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import {
  BookOpen, Clock, Target, Trophy, Award, Calendar,
  PlayCircle, ChevronLeft, Flame, Star, TrendingUp,
  CheckCircle2, GraduationCap, Activity as ActivityIcon,
  Video, Sparkles, ArrowUpRight, Medal,
} from 'lucide-react'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import { AdhkarWidget } from '@/components/adhkar-widget'
import { PrayerTimesDialog } from '@/components/prayer-times-dialog'

// Level labels will be resolved dynamically within the component using translations.

interface LevelProgress {
  level: string
  next: string | null
  current_floor: number
  next_floor: number | null
  percent: number
}

interface StudentStats {
  enrolled_courses: number
  completed_courses: number
  pending_tasks: number
  total_points: number
  current_level: string
  streak_days: number
  longest_streak: number
  upcoming_sessions: number
  badges_earned: number
  level_progress?: LevelProgress
  avg_grade?: number | null
}

interface Course {
  id: string
  title: string
  thumbnail_url?: string
  progress_percent: number
  next_lesson?: string
  teacher_name?: string
}

interface UpcomingSession {
  id: string
  title: string
  course_title: string
  scheduled_at: string
  teacher_name: string
}

interface Task {
  id: string
  title: string
  course_title: string
  due_date: string
  type: string
  points_value: number
}

interface ActivityEntry {
  id: string
  points: number
  reason: string
  description: string | null
  created_at: string
}

// Reason labels will be resolved dynamically within the component using translations.

export default function AcademyStudentDashboard() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<UpcomingSession[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllSessions, setShowAllSessions] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, coursesRes, sessionsRes, tasksRes, pointsRes] = await Promise.all([
          fetch('/api/academy/student/stats'),
          fetch('/api/academy/student/courses?limit=3'),
          fetch('/api/academy/student/sessions?limit=20&upcoming=true'),
          fetch('/api/academy/student/tasks?limit=4&pending=true'),
          fetch('/api/academy/student/points'),
        ])

        if (statsRes.ok) setStats(await statsRes.json())
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.data || [])
        }
        if (sessionsRes.ok) {
          const data = await sessionsRes.json()
          setSessions(data.data || [])
        }
        if (tasksRes.ok) {
          const data = await tasksRes.json()
          setTasks(data.data || [])
        }
        if (pointsRes.ok) {
          const data = await pointsRes.json()
          setActivity(data.data?.log || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(date)
  }

  const formatRelative = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return isAr ? 'الآن' : 'now'
    if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return isAr ? `منذ ${hrs} س` : `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return isAr ? `منذ ${days} يوم` : `${days}d ago`
    return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }).format(date)
  }

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return t.studentPages?.dashboard?.dueLate || 'متأخر'
    if (days === 0) return t.studentPages?.dashboard?.dueToday || 'اليوم'
    if (days === 1) return t.studentPages?.dashboard?.dueTomorrow || 'غداً'
    return (t.studentPages?.dashboard?.dueDays || '{days} أيام').replace('{days}', String(days))
  }

  // Next upcoming session highlighted separately
  const nextSession = sessions[0]
  const sessionStartsSoon = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.getTime() - Date.now() < 15 * 60 * 1000 && d.getTime() - Date.now() > 0
  }

  const levelLabels: Record<string, string> = {
    beginner: t.studentPages?.dashboard?.levels?.beginner || 'مبتدئ',
    intermediate: t.studentPages?.dashboard?.levels?.intermediate || 'متوسط',
    advanced: t.studentPages?.dashboard?.levels?.advanced || 'متقدم',
    hafiz: t.studentPages?.dashboard?.levels?.hafiz || 'حافظ',
    master: t.studentPages?.dashboard?.levels?.master || 'متقن',
  }

  const lp = stats?.level_progress
  const levelLabel = levelLabels[lp?.level || stats?.current_level || 'beginner'] || 'مبتدئ'
  const nextLevelLabel = lp?.next ? levelLabels[lp.next] : null
  const pointsToNext = lp?.next_floor != null ? Math.max(0, lp.next_floor - (stats?.total_points || 0)) : 0

  return (
    <div className="space-y-6">
      {/* Welcome + Level Hero */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
          <h1 className="text-2xl font-bold mb-1 text-balance">
            {t.studentPages?.dashboard?.welcomeBack || 'مرحباً بعودتك!'}
          </h1>
          <p className="text-white/80 mb-5 text-sm leading-relaxed">
            {t.studentPages?.dashboard?.continueJourney || 'واصل رحلتك التعليمية واكسب المزيد من النقاط'}
          </p>
          <div className="mb-5">
            <PrayerTimesDialog
              trigger={
                <button className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors backdrop-blur-sm border border-white/20">
                  <Clock className="w-4 h-4" />
                  {t.studentPages?.dashboard?.prayerTimesBtn}
                </button>
              }
            />
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="font-bold text-lg">{stats?.streak_days || 0}</span>
              <span className="text-white/70 text-sm">{t.studentPages?.dashboard?.streakDaysSuffix}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-lg">{stats?.total_points || 0}</span>
              <span className="text-white/70 text-sm">{t.studentPages?.dashboard?.pointsSuffix}</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-200" />
              <span className="font-bold text-lg">{stats?.badges_earned || 0}</span>
              <span className="text-white/70 text-sm">{t.studentPages?.dashboard?.badgesSuffix}</span>
            </div>
          </div>
        </div>

        {/* Level Card */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.studentPages?.dashboard?.currentLevelLabel}</p>
                <p className="font-bold text-lg">{levelLabel}</p>
              </div>
            </div>
            <Link href="/academy/student/points" className="text-muted-foreground hover:text-foreground">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${lp?.percent ?? 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {nextLevelLabel
                ? (t.studentPages?.dashboard?.pointsToNextLevel || 'باقي {points} نقطة للوصول إلى «{level}»')
                  .replace('{points}', String(pointsToNext))
                  .replace('{level}', nextLevelLabel)
                : t.studentPages?.dashboard?.maxLevelReached}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={BookOpen} label={t.studentPages?.dashboard?.myCoursesLabel} value={stats?.enrolled_courses || 0} tone="sky" />
        <StatCard icon={CheckCircle2} label={t.studentPages?.dashboard?.completedCoursesLabel} value={stats?.completed_courses || 0} tone="emerald" />
        <StatCard icon={Clock} label={t.studentPages?.dashboard?.pendingTasksLabel} value={stats?.pending_tasks || 0} highlight={Boolean(stats?.pending_tasks)} />
        <StatCard icon={Calendar} label={t.studentPages?.dashboard?.upcomingSessionsLabel} value={stats?.upcoming_sessions || 0} tone="violet" />
        <StatCard icon={Award} label={t.studentPages?.dashboard?.badgesLabel} value={stats?.badges_earned || 0} tone="rose" />
        <StatCard
          icon={GraduationCap}
          label={t.studentPages?.dashboard?.avgGradeLabel}
          value={stats?.avg_grade != null ? `${stats.avg_grade}%` : '—'}
          tone="teal"
        />
      </div>

      {/* Next Session Highlight */}
      {nextSession && (
        <Link
          href={`/academy/student/sessions/${nextSession.id}`}
          className="block bg-gradient-to-l from-violet-500/10 to-transparent rounded-2xl border border-violet-500/20 p-5 hover:border-violet-500/50 transition-colors group"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{t.studentPages?.dashboard?.nextSessionLabel}</p>
                {sessionStartsSoon(nextSession.scheduled_at) && (
                  <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {t.studentPages?.dashboard?.startsSoonLabel}
                  </span>
                )}
              </div>
              <p className="font-bold truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{nextSession.title}</p>
              <p className="text-sm text-muted-foreground truncate">{nextSession.course_title}</p>
            </div>
            <div className="text-left shrink-0">
              <p className="text-sm font-medium">{formatDate(nextSession.scheduled_at)}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-xs text-violet-600 dark:text-violet-400 font-bold">
                <PlayCircle className="w-4 h-4" /> {t.studentPages?.dashboard?.joinBtn}
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" /> {t.studentPages?.dashboard?.myCoursesSection}
              </h2>
              <Link href="/academy/student/courses" className="text-sm text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                {t.studentPages?.dashboard?.viewAll} <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t.studentPages?.dashboard?.noEnrolledCourses}</p>
                <Link
                  href="/academy/student/courses/browse"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t.studentPages?.dashboard?.browseCoursesBtn}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/academy/student/courses/${course.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors group"
                  >
                    <div className="w-20 h-14 rounded-lg bg-sky-500/10 flex items-center justify-center overflow-hidden shrink-0">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{course.title}</h3>
                      {course.teacher_name && (
                        <p className="text-sm text-muted-foreground">{course.teacher_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all" style={{ width: `${course.progress_percent}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{course.progress_percent}%</span>
                      </div>
                    </div>
                    <PlayCircle className="w-7 h-7 text-sky-600 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
              <ActivityIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" /> {t.studentPages?.dashboard?.recentActivities}
            </h2>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t.studentPages?.dashboard?.noActivities}</p>
            ) : (
              <div className="space-y-1">
                {activity.slice(0, 6).map((entry) => {
                  const reasonLabels: Record<string, string> = {
                    recitation: t.studentPages?.dashboard?.reasons?.recitation || 'سجّلت تلاوة',
                    mastered: t.studentPages?.dashboard?.reasons?.mastered || 'أتقنت حفظاً',
                    task: t.studentPages?.dashboard?.reasons?.task || 'أنجزت مهمة',
                    lesson: t.studentPages?.dashboard?.reasons?.lesson || 'أكملت درساً',
                    streak: t.studentPages?.dashboard?.reasons?.streak || 'مكافأة المثابرة',
                    juz_complete: t.studentPages?.dashboard?.reasons?.juz_complete || 'أتممت جزءاً',
                    course_complete: t.studentPages?.dashboard?.reasons?.course_complete || 'أكملت دورة',
                    session_attend: t.studentPages?.dashboard?.reasons?.session_attend || 'حضرت جلسة',
                    daily_login: t.studentPages?.dashboard?.reasons?.daily_login || 'دخول يومي',
                    competition_win: t.studentPages?.dashboard?.reasons?.competition_win || 'فزت في مسابقة',
                    badge_earned: t.studentPages?.dashboard?.reasons?.badge_earned || 'حصلت على شارة',
                  }
                  return (
                    <div key={entry.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {entry.description || reasonLabels[entry.reason] || entry.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatRelative(entry.created_at)}</p>
                      </div>
                      <span className={cn(
                        'text-sm font-bold shrink-0',
                        entry.points >= 0 ? 'text-emerald-600' : 'text-destructive'
                      )}>
                        {entry.points >= 0 ? '+' : ''}{entry.points}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Morning/Evening Adhkar */}
          <AdhkarWidget />

          {/* Upcoming Sessions */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" /> {t.studentPages?.dashboard?.upcomingSessions}
              </h2>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t.studentPages?.dashboard?.noUpcomingSessions}</p>
            ) : (
              <div className="space-y-2">
                {(showAllSessions ? sessions : sessions.slice(0, 4)).map((session) => (
                  <Link
                    key={session.id}
                    href={`/academy/student/sessions/${session.id}`}
                    className="block p-3 rounded-xl bg-muted/40 hover:bg-violet-500/10 transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{session.course_title}</p>
                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">{formatDate(session.scheduled_at)}</p>
                  </Link>
                ))}
                {sessions.length > 4 && (
                  <button
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    className="w-full text-center text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 py-2 mt-2 border border-violet-500/20 rounded-lg hover:bg-violet-500/10 transition-colors"
                  >
                    {showAllSessions ? t.studentPages?.dashboard?.showLess : t.studentPages?.dashboard?.showMore}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" /> {t.studentPages?.dashboard?.pendingTasks}
              </h2>
              <Link href="/academy/student/tasks" className="text-xs text-rose-600 dark:text-rose-400 hover:underline">{t.studentPages?.dashboard?.all}</Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t.studentPages?.dashboard?.noPendingTasks}</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const due = formatDueDate(task.due_date)
                  const late = due === t.studentPages?.dashboard?.dueLate || due === 'متأخر'
                  return (
                    <Link
                      key={task.id}
                      href={`/academy/student/tasks/${task.id}`}
                      className="block p-3 rounded-xl bg-muted/40 hover:bg-rose-500/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded shrink-0',
                          late ? 'bg-destructive/15 text-destructive' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        )}>
                          {due}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{task.course_title}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
                        <Star className="w-3 h-3" /> <span>{task.points_value} {t.studentPages?.dashboard?.pointsSuffix}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Streak Card */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" /> {t.studentPages?.dashboard?.streakTitle}
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">{stats?.streak_days || 0}</p>
                <p className="text-xs text-muted-foreground">{t.studentPages?.dashboard?.streakDaysSuffix}</p>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold flex items-center gap-1 justify-end">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  {stats?.longest_streak || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t.studentPages?.dashboard?.longestStreak}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => {
                const active = i < Math.min(7, stats?.streak_days || 0)
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 aspect-square rounded-lg flex items-center justify-center',
                      active ? 'bg-orange-500/15 text-orange-500' : 'bg-muted text-muted-foreground/40'
                    )}
                  >
                    <Flame className="w-4 h-4" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const STAT_TONES = {
  sky: { icon: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', border: 'hover:border-sky-500/40' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', border: 'hover:border-emerald-500/40' },
  amber: { icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', border: 'hover:border-amber-500/40' },
  violet: { icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', border: 'hover:border-violet-500/40' },
  rose: { icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400', border: 'hover:border-rose-500/40' },
  teal: { icon: 'bg-teal-500/15 text-teal-600 dark:text-teal-400', border: 'hover:border-teal-500/40' },
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
  tone = 'sky',
}: {
  icon: React.ElementType
  label: string
  value: number | string
  highlight?: boolean
  tone?: keyof typeof STAT_TONES
}) {
  const t = STAT_TONES[tone]
  return (
    <div className={cn(
      'bg-card rounded-xl border p-4 transition-colors',
      highlight ? 'border-amber-500/50' : cn('border-border', t.border)
    )}>
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
        highlight ? 'bg-amber-500 text-white' : t.icon
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

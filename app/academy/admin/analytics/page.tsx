"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  Globe2,
  GraduationCap,
  Library,
  Loader2,
  MapPin,
  MessageSquare,
  Mic2,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface Stats {
  totalStudents: number
  totalTeachers: number
  totalParents: number
  totalReaders: number
  totalAdmins: number
  activeCourses: number
  draftCourses: number
  archivedCourses: number
  totalEnrollments: number
  activeEnrollments: number
  completedEnrollments: number
  totalLessons: number
  totalSessions: number
  upcomingSessions: number
  completedSessions: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  taskCompletionRate: number
  attendancePresent: number
  attendanceTotal: number
  attendanceRate: number
  completionRate: number
  totalCertificates: number
  weeklyEnrollments: number
  monthlyEnrollments: number
  dailyActiveStudents: number
  weeklyActiveStudents: number
  monthlyActiveStudents: number
  dailyActivityRate: number
  learningPaths: number
  memorizationPaths: number
  tajweedPaths: number
  totalRecitations: number
  totalBookings: number
  totalBooks: number
  totalBookFiles: number
  forumPosts: number
  communityMembers: number
}

interface AnalyticsData {
  stats: Stats
  enrollmentTrend: { month: string; count: number }[]
  genderDistribution: { gender: string; count: number }[]
  topCourses: { title: string; enrollments: number; avg_progress: number }[]
  topTeachers: { teacher_id: string; name: string; courses_count: number; students_count: number }[]
  topStudents: { student_id: string; name: string; points: number; enrollments: number; completed: number }[]
  enrollmentStatuses: { status: string; count: number }[]
  sessionsByStatus: { status: string; count: number }[]
  studentsByCountry: { country: string; country_code?: string | null; count: number; active_count: number }[]
  geoHeatmap: { country: string; country_code?: string | null; region: string; city: string; count: number }[]
  dailyActivity: { day: string; active_students: number; points: number }[]
  topSurahs: { surah_name: string; surah_number?: number | null; recordings: number; unique_students: number }[]
  lastSignups: { id: string; name: string; role: string; created_at: string }[]
}

interface CounterCardProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone: string
}

function CounterCard({ label, value, hint, icon: Icon, tone }: CounterCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-lg ${tone} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-2xl font-black text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  )
}

const monthLabels: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
}

const genderLabels: Record<string, string> = {
  male: "ذكور",
  female: "إناث",
  unknown: "غير محدد",
}

const enrollmentStatusLabels: Record<string, string> = {
  active: "نشط",
  ACTIVE: "نشط",
  completed: "مكتمل",
  COMPLETED: "مكتمل",
  paused: "متوقف",
  PAUSED: "متوقف",
  dropped: "متروك",
  DROPPED: "متروك",
  accepted: "مقبول",
  unknown: "غير محدد",
}

const sessionStatusLabels: Record<string, string> = {
  scheduled: "مجدولة",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة",
  unknown: "غير محدد",
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch("/api/academy/admin/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/academy/admin/analytics/export")
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `academy-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("تم تصدير التقرير")
    } catch {
      toast.error("تعذر تصدير التقرير")
    } finally {
      setExporting(false)
    }
  }

  const stats = data?.stats

  const maxEnrollment = useMemo(
    () => Math.max(...(data?.enrollmentTrend || []).map((e) => e.count), 1),
    [data?.enrollmentTrend]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!data || !stats) {
    return (
      <div className="text-center text-muted-foreground py-12" dir="rtl">
        تعذر تحميل التحليلات
      </div>
    )
  }

  const userCounters: CounterCardProps[] = [
    { label: "إجمالي الطلاب", value: stats.totalStudents.toLocaleString(), icon: Users, tone: "bg-blue-500/10 text-blue-500" },
    { label: "المدرسون", value: stats.totalTeachers.toLocaleString(), icon: GraduationCap, tone: "bg-purple-500/10 text-purple-500" },
    { label: "أولياء الأمور", value: stats.totalParents.toLocaleString(), icon: UserCog, tone: "bg-amber-500/10 text-amber-500" },
    { label: "المقرئون", value: stats.totalReaders.toLocaleString(), icon: Mic2, tone: "bg-teal-500/10 text-teal-500" },
    { label: "المشرفون", value: stats.totalAdmins.toLocaleString(), icon: UserCheck, tone: "bg-rose-500/10 text-rose-500" },
    { label: "نشطون اليوم", value: stats.dailyActiveStudents.toLocaleString(), hint: `${stats.dailyActivityRate}% من الطلاب`, icon: Activity, tone: "bg-emerald-500/10 text-emerald-500" },
    { label: "نشطون أسبوعياً", value: stats.weeklyActiveStudents.toLocaleString(), icon: TrendingUp, tone: "bg-cyan-500/10 text-cyan-500" },
    { label: "نشطون شهرياً", value: stats.monthlyActiveStudents.toLocaleString(), icon: Sparkles, tone: "bg-indigo-500/10 text-indigo-500" },
  ]

  const contentCounters: CounterCardProps[] = [
    { label: "الدورات النشطة", value: stats.activeCourses.toLocaleString(), hint: `${stats.draftCourses} مسودة • ${stats.archivedCourses} أرشيف`, icon: BookOpen, tone: "bg-emerald-500/10 text-emerald-500" },
    { label: "الدروس", value: stats.totalLessons.toLocaleString(), icon: BookOpen, tone: "bg-blue-500/10 text-blue-500" },
    { label: "الجلسات", value: stats.totalSessions.toLocaleString(), hint: `${stats.upcomingSessions} قادمة • ${stats.completedSessions} مكتملة`, icon: Calendar, tone: "bg-purple-500/10 text-purple-500" },
    { label: "المسارات التعليمية", value: stats.learningPaths.toLocaleString(), icon: Route, tone: "bg-orange-500/10 text-orange-500" },
    { label: "مسارات الحفظ", value: stats.memorizationPaths.toLocaleString(), icon: Target, tone: "bg-pink-500/10 text-pink-500" },
    { label: "مسارات التجويد", value: stats.tajweedPaths.toLocaleString(), icon: Mic2, tone: "bg-teal-500/10 text-teal-500" },
    { label: "مكتبة الكتب", value: stats.totalBooks.toLocaleString(), hint: `${stats.totalBookFiles} ملف`, icon: Library, tone: "bg-amber-500/10 text-amber-500" },
    { label: "تسجيلات صوتية", value: stats.totalRecitations.toLocaleString(), icon: Mic2, tone: "bg-cyan-500/10 text-cyan-500" },
  ]

  const engagementCounters: CounterCardProps[] = [
    { label: "إجمالي التسجيلات", value: stats.totalEnrollments.toLocaleString(), hint: `${stats.activeEnrollments} نشطة • ${stats.completedEnrollments} مكتملة`, icon: UserCheck, tone: "bg-blue-500/10 text-blue-500" },
    { label: "تسجيلات أسبوعية", value: stats.weeklyEnrollments.toLocaleString(), icon: TrendingUp, tone: "bg-emerald-500/10 text-emerald-500" },
    { label: "تسجيلات شهرية", value: stats.monthlyEnrollments.toLocaleString(), icon: BarChart3, tone: "bg-cyan-500/10 text-cyan-500" },
    { label: "متوسط التقدم", value: `${stats.completionRate}%`, icon: Target, tone: "bg-yellow-500/10 text-yellow-500" },
    { label: "حضور الجلسات", value: `${stats.attendanceRate}%`, hint: `${stats.attendancePresent} / ${stats.attendanceTotal}`, icon: Clock, tone: "bg-rose-500/10 text-rose-500" },
    { label: "إنجاز المهام", value: `${stats.taskCompletionRate}%`, hint: `${stats.completedTasks} / ${stats.totalTasks}`, icon: Sparkles, tone: "bg-purple-500/10 text-purple-500" },
    { label: "مهام متأخرة", value: stats.overdueTasks.toLocaleString(), icon: Clock, tone: "bg-red-500/10 text-red-500" },
    { label: "الشهادات", value: stats.totalCertificates.toLocaleString(), icon: Award, tone: "bg-amber-500/10 text-amber-500" },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            التحليلات الشاملة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            نظرة عامة شاملة على أداء الأكاديمية وكل تفاصيلها
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="gap-2 font-bold">
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          تصدير Excel
          {!exporting && <Download className="w-4 h-4" />}
        </Button>
      </div>

      {/* Users counters */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-muted-foreground">
          المستخدمون والنشاط
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {userCounters.map((c) => (
            <CounterCard key={c.label} {...c} />
          ))}
        </div>
      </section>

      {/* Content counters */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-muted-foreground">
          المحتوى التعليمي
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {contentCounters.map((c) => (
            <CounterCard key={c.label} {...c} />
          ))}
        </div>
      </section>

      {/* Engagement counters */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-muted-foreground">
          التسجيلات والمشاركة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {engagementCounters.map((c) => (
            <CounterCard key={c.label} {...c} />
          ))}
        </div>
      </section>

      {/* Widget: enrollment trend + gender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              نمو التسجيلات (آخر 6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.enrollmentTrend.length > 0 ? (
              <div className="space-y-3">
                {data.enrollmentTrend.map((item, idx) => {
                  const monthNum = item.month.split("-")[1] || ""
                  const monthName = monthLabels[monthNum] || item.month
                  const width = (item.count / maxEnrollment) * 100
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-16 shrink-0">
                        {monthName}
                      </span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-10 text-left">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات كافية
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              توزيع الطلاب حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.genderDistribution.length > 0 ? (
              <div className="flex items-center justify-center gap-8 py-8 flex-wrap">
                {data.genderDistribution.map((item, idx) => {
                  const colors = ["bg-blue-500", "bg-pink-500", "bg-gray-400"]
                  const total = data.genderDistribution.reduce((a, g) => a + g.count, 0)
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                  return (
                    <div key={idx} className="text-center">
                      <div
                        className={`w-20 h-20 rounded-full ${colors[idx % colors.length]} flex items-center justify-center mx-auto mb-3`}
                      >
                        <span className="text-white text-xl font-black">{pct}%</span>
                      </div>
                      <p className="font-bold text-foreground">
                        {genderLabels[item.gender] || item.gender}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.count} طالب</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات كافية
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Widget: enrollment statuses + session statuses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              توزيع التسجيلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.enrollmentStatuses.length > 0 ? (
              <div className="space-y-2">
                {data.enrollmentStatuses.map((item, idx) => {
                  const total = data.enrollmentStatuses.reduce((a, s) => a + s.count, 0)
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-24 shrink-0">
                        {enrollmentStatusLabels[item.status] || item.status}
                      </span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-16 text-left">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              توزيع الجلسات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.sessionsByStatus.length > 0 ? (
              <div className="space-y-2">
                {data.sessionsByStatus.map((item, idx) => {
                  const total = data.sessionsByStatus.reduce((a, s) => a + s.count, 0)
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-24 shrink-0">
                        {sessionStatusLabels[item.status] || item.status}
                      </span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-16 text-left">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد جلسات
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top students + Top teachers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              أفضل الطلاب (حسب النقاط)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topStudents.length > 0 ? (
              <div className="space-y-2">
                {data.topStudents.map((s, idx) => {
                  const medals = ["bg-amber-500", "bg-gray-400", "bg-amber-700"]
                  return (
                    <div
                      key={s.student_id}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <div
                        className={`w-7 h-7 rounded-full ${medals[idx] || "bg-muted"} flex items-center justify-center shrink-0`}
                      >
                        <span className="text-white text-xs font-bold">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {s.enrollments} تسجيل • {s.completed} مكتمل
                        </p>
                      </div>
                      <span className="text-sm font-bold text-amber-500">
                        {s.points.toLocaleString()} ★
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              أفضل المدرسين (حسب الطلاب)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topTeachers.length > 0 ? (
              <div className="space-y-2">
                {data.topTeachers.map((t, idx) => (
                  <div
                    key={t.teacher_id}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.courses_count} دورة
                      </p>
                    </div>
                    <span className="text-sm font-bold">
                      {t.students_count} طالب
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top courses */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            أفضل الدورات (حسب التسجيلات)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topCourses.length > 0 ? (
            <div className="space-y-3">
              {data.topCourses.map((c, idx) => {
                const max = Math.max(...data.topCourses.map((x) => x.enrollments), 1)
                const width = (c.enrollments / max) * 100
                const medals = ["bg-amber-500", "bg-gray-400", "bg-amber-700"]
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${medals[idx] || "bg-muted"} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-white text-sm font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{c.title}</p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold">{c.enrollments} طالب</p>
                      <p className="text-[10px] text-muted-foreground">{c.avg_progress}% تقدم</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              لا توجد دورات
            </div>
          )}
        </CardContent>
      </Card>

      {/* Countries + Geo Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-primary" />
              توزيع الطلاب حسب الدول
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.studentsByCountry.length > 0 ? (
              <div className="space-y-3">
                {data.studentsByCountry.slice(0, 10).map((item, idx) => {
                  const max = Math.max(...data.studentsByCountry.map((c) => c.count), 1)
                  const width = (item.count / max) * 100
                  return (
                    <div key={`${item.country}-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">{item.country}</span>
                        <span className="text-muted-foreground">
                          {item.count} طالب • {item.active_count} نشط
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              خريطة حرارية للمناطق
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.geoHeatmap.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.geoHeatmap.slice(0, 12).map((item, idx) => {
                  const max = Math.max(...data.geoHeatmap.map((r) => r.count), 1)
                  const opacity = 0.2 + (item.count / max) * 0.8
                  return (
                    <div
                      key={`${item.country}-${item.region}-${idx}`}
                      className="rounded-xl border border-border p-3"
                      style={{ backgroundColor: `rgba(16, 185, 129, ${opacity})` }}
                    >
                      <p className="text-sm font-black truncate">{item.region}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.country} • {item.city}
                      </p>
                      <p className="mt-2 text-xl font-black">{item.count}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات مناطق
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily activity + Top surahs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              النشاط اليومي (آخر 10 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.dailyActivity.length > 0 ? (
              <div className="space-y-3">
                {data.dailyActivity.slice(-10).map((item) => {
                  const max = Math.max(...data.dailyActivity.map((d) => d.active_students), 1)
                  const width = (item.active_students / max) * 100
                  return (
                    <div key={item.day} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">
                        {item.day}
                      </span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-16 text-left">
                        {item.active_students} طالب
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-primary" />
              أكثر السور تسجيلاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topSurahs.length > 0 ? (
              <div className="space-y-3">
                {data.topSurahs.map((s, idx) => {
                  const max = Math.max(...data.topSurahs.map((x) => x.recordings), 1)
                  const width = (s.recordings / max) * 100
                  return (
                    <div
                      key={`${s.surah_name}-${idx}`}
                      className="flex items-center gap-3"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{s.surah_name}</p>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-muted-foreground">
                        {s.recordings} تسجيل
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد تسجيلات
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest signups + Community */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              أحدث المسجلين
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lastSignups.length > 0 ? (
              <div className="space-y-1">
                {data.lastSignups.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="font-medium truncate">{u.name}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs">{u.role}</span>
                      <span className="text-[11px]">
                        {new Date(u.created_at).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                لا توجد تسجيلات حديثة
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              نشاط المجتمع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="text-center p-4 rounded-xl border border-border">
                <p className="text-3xl font-black text-foreground">
                  {stats.forumPosts.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">إجمالي المشاركات</p>
              </div>
              <div className="text-center p-4 rounded-xl border border-border">
                <p className="text-3xl font-black text-foreground">
                  {stats.communityMembers.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">أعضاء نشطون (30ي)</p>
              </div>
              <div className="text-center p-4 rounded-xl border border-border">
                <p className="text-3xl font-black text-foreground">
                  {stats.totalBookings.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">إجمالي الحجوزات</p>
              </div>
              <div className="text-center p-4 rounded-xl border border-border">
                <p className="text-3xl font-black text-foreground">
                  {stats.totalRecitations.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">تسجيلات صوتية</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

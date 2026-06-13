'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Loader2,
  BookOpen,
  Calendar,
  Trophy,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowUpRight,
  MessageSquare,
  Shield,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChildDetail {
  link: {
    id: string
    relation: string
    linked_at: string
    confirmed_at: string | null
  }
  child: {
    id: string
    name: string
    email: string
    avatar_url: string | null
    gender: string | null
    created_at: string
  }
  progress: {
    total_courses: number
    active_courses: number
    completed_courses: number
    avg_progress: number
    total_recitations_30d: number
  }
  enrollments: Array<{
    id: string
    course_id: string
    course_title: string
    status: string
    progress: number
    enrolled_at: string
  }>
  recent_recitations: Array<{
    id: string
    surah_name: string
    surah_number: number
    verdict: string | null
    notes: string | null
    created_at: string
  }>
  upcoming_bookings: Array<{
    id: string
    reader_name: string
    scheduled_at: string
    status: string
    meeting_link: string | null
  }>
  weekly_activity: Array<{
    day_offset: number
    count: number
  }>
  badges: Array<{
    id: string
    badge_name: string
    badge_description: string | null
    badge_icon: string | null
    earned_at: string
  }>
}

const relationLabels: Record<string, { ar: string; en: string }> = {
  father: { ar: 'أب', en: 'Father' },
  mother: { ar: 'أم', en: 'Mother' },
  guardian: { ar: 'ولي أمر', en: 'Guardian' },
  other: { ar: 'أخرى', en: 'Other' },
}

const dayLabels: Record<string, string[]> = {
  ar: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
  en: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
}

const verdictLabels: Record<string, { ar: string; en: string; tone: 'good' | 'warn' | 'bad' }> = {
  approved: { ar: 'مقبولة', en: 'Approved', tone: 'good' },
  accepted: { ar: 'مقبولة', en: 'Accepted', tone: 'good' },
  passed: { ar: 'ناجحة', en: 'Passed', tone: 'good' },
  needs_improvement: { ar: 'تحتاج تحسين', en: 'Needs work', tone: 'warn' },
  rejected: { ar: 'مرفوضة', en: 'Rejected', tone: 'bad' },
  failed: { ar: 'غير مقبولة', en: 'Failed', tone: 'bad' },
}

function fmtDate(s: string | null, isAr: boolean) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function fmtDateTime(s: string | null, isAr: boolean) {
  if (!s) return '—'
  return new Date(s).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [detail, setDetail] = useState<ChildDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/detail`)
      if (res.ok) {
        const data = await res.json()
        setDetail(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (!detail?.child) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {isAr ? 'الطالب غير موجود أو غير مربوط بحسابك.' : 'Student not found or not linked.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { child, link, progress, enrollments, recent_recitations, upcoming_bookings, weekly_activity, badges } = detail

  const chartData = [...weekly_activity]
    .sort((a, b) => a.day_offset - b.day_offset)
    .map((d) => ({
      name: dayLabels[locale][6 - d.day_offset],
      count: d.count,
    }))

  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back Link */}
      <Link
        href="/academy/parent/children"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronIcon className="w-4 h-4" />
        {isAr ? 'العودة لقائمة الأبناء' : 'Back to children'}
      </Link>

      {/* Hero Profile */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-background border border-primary/10 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.06),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <Avatar className="w-20 h-20 md:w-24 md:h-24 shrink-0 ring-4 ring-background shadow-lg">
            <AvatarImage src={child.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
              {child.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-foreground">{child.name}</h1>
              <Badge variant="secondary" className="text-xs">
                {relationLabels[link.relation]?.[locale] || link.relation}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {child.email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? 'ربط منذ' : 'Linked since'} {fmtDate(link.linked_at, isAr)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href={`/academy/parent/messages?child_id=${id}`}>
              <Button variant="outline" size="sm" className="rounded-xl font-bold">
                <MessageSquare className="w-4 h-4 me-1.5" />
                {isAr ? 'مراسلة' : 'Message'}
              </Button>
            </Link>
            <Link href={`/academy/parent/children/${id}/restrictions`}>
              <Button variant="outline" size="sm" className="rounded-xl font-bold">
                <Shield className="w-4 h-4 me-1.5" />
                {isAr ? 'تقييد' : 'Restrict'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'المقررات' : 'Courses'}
              </span>
            </div>
            <div className="text-3xl font-black text-foreground">{progress.total_courses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress.active_courses} {isAr ? 'نشط' : 'active'} · {progress.completed_courses}{' '}
              {isAr ? 'مكتمل' : 'completed'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'التقدم' : 'Progress'}
              </span>
            </div>
            <div className="text-3xl font-black text-foreground">{progress.avg_progress}%</div>
            <Progress value={progress.avg_progress} className="h-1.5 mt-2 bg-primary/10" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-violet-500" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'تلاوات' : 'Recitations'}
              </span>
            </div>
            <div className="text-3xl font-black text-foreground">{progress.total_recitations_30d}</div>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? 'آخر ٣٠ يوم' : 'Last 30 days'}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'الشارات' : 'Badges'}
              </span>
            </div>
            <div className="text-3xl font-black text-foreground">{badges.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">
            {isAr ? 'نظرة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="recitations">
            {isAr ? 'التلاوات' : 'Recitations'}
          </TabsTrigger>
          <TabsTrigger value="schedule">
            {isAr ? 'المواعيد' : 'Schedule'}
          </TabsTrigger>
          <TabsTrigger value="badges">
            {isAr ? 'الشارات' : 'Badges'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Weekly Activity Chart */}
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'نشاط الأسبوع' : 'Weekly Activity'}
              </h3>
              {weekly_activity.some((d) => d.count > 0) ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '13px',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                        name={isAr ? 'النشاط' : 'Activity'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  {isAr ? 'لا يوجد نشاط هذا الأسبوع' : 'No activity this week'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollments */}
          {enrollments.length > 0 && (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {isAr ? 'المقررات' : 'Enrolled Courses'}
                </h3>
                <div className="space-y-3">
                  {enrollments.map((e) => (
                    <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">{e.course_title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={e.progress} className="h-1.5 flex-1 bg-primary/10" />
                          <span className="text-xs font-bold text-muted-foreground shrink-0">{e.progress}%</span>
                        </div>
                      </div>
                      <Badge
                        variant={e.status === 'completed' ? 'default' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {e.status === 'completed'
                          ? isAr ? 'مكتمل' : 'Done'
                          : e.status === 'pending'
                            ? isAr ? 'قيد الانتظار' : 'Pending'
                            : isAr ? 'نشط' : 'Active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recitations Tab */}
        <TabsContent value="recitations" className="mt-6">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'التلاوات الأخيرة' : 'Recent Recitations'}
              </h3>
              {recent_recitations.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {isAr ? 'لا توجد تلاوات بعد.' : 'No recitations yet.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {recent_recitations.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{r.surah_name}</h4>
                          {r.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {r.verdict && (() => {
                          const v = verdictLabels[r.verdict.toLowerCase()]
                          const tone = v?.tone ?? 'warn'
                          const cls =
                            tone === 'good'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : tone === 'bad'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          return (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${cls}`}>
                              {v ? v[locale] : r.verdict}
                            </span>
                          )
                        })()}
                        <span className="text-xs text-muted-foreground">{fmtDate(r.created_at, isAr)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'المواعيد القادمة' : 'Upcoming Schedule'}
              </h3>
              {upcoming_bookings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {isAr ? 'لا توجد مواعيد قادمة.' : 'No upcoming bookings.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {upcoming_bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">
                            {isAr ? 'حجز تلاوة' : 'Recitation'} — {b.reader_name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fmtDateTime(b.scheduled_at, isAr)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {b.meeting_link && (
                          <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs" asChild>
                            <a href={b.meeting_link} target="_blank" rel="noopener noreferrer">
                              <ArrowUpRight className="w-3 h-3 me-1" />
                              {isAr ? 'انضمام' : 'Join'}
                            </a>
                          </Button>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {isAr ? 'قادم' : 'Upcoming'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-6">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isAr ? 'الشارات المكتسبة' : 'Earned Badges'}
              </h3>
              {badges.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {isAr ? 'لم يحصل على شارات بعد.' : 'No badges earned yet.'}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-start gap-3 p-4 rounded-xl border border-border/50 hover:border-amber-300/50 dark:hover:border-amber-700/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground">{b.badge_name}</h4>
                        {b.badge_description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {b.badge_description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {fmtDate(b.earned_at, isAr)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

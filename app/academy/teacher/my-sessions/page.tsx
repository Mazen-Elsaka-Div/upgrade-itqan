'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Radio,
  Star,
  Users,
  Video,
  PlayCircle,
  Loader2,
  History,
} from 'lucide-react'

interface MySessionRow {
  id: string
  kind: 'halaqa' | 'booking' | 'course_session'
  ref_id: string
  platform: 'academy' | 'maqraa'
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  peak_participants: number
  total_participants: number
  recording_status: string
  recording_url: string | null
  is_host: boolean
  is_attendee: boolean
  title: string | null
  participants_count: number
  ratings_count: number
  avg_rating: number | null
}

const KIND_LABEL: Record<string, string> = {
  halaqa: 'حلقة',
  booking: 'جلسة فردية',
  course_session: 'درس دورة',
}

function fmtDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h > 0) return `${h}س ${rem}د`
  return `${m}د`
}

function fmtDate(s: string) {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(s))
  } catch {
    return s
  }
}

function Stars({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">لا يوجد تقييم</span>
  }
  return (
    <div className="flex items-center gap-1" aria-label={`متوسط التقييم ${value}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
        />
      ))}
      <span className="text-xs font-semibold text-foreground/80 mr-1">{Number(value).toFixed(1)}</span>
    </div>
  )
}

export default function TeacherMySessionsPage() {
  const [data, setData] = useState<MySessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'hosted' | 'attended' | 'all'>('hosted')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const role = filter === 'hosted' ? 'host' : filter === 'attended' ? 'attendee' : 'any'
      const res = await fetch(`/api/video/my-sessions?role=${role}&limit=100&platform=academy`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'فشل تحميل السجل')
      }
      const json = await res.json()
      setData(json.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }, [filter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  const stats = useMemo(() => {
    let hosted = 0
    let attended = 0
    let totalMinutes = 0
    let ratingsSum = 0
    let ratingsCount = 0
    for (const r of data) {
      if (r.is_host) hosted++
      if (r.is_attendee) attended++
      totalMinutes += Math.floor((r.duration_seconds || 0) / 60)
      if (r.avg_rating !== null && r.ratings_count > 0) {
        ratingsSum += Number(r.avg_rating) * r.ratings_count
        ratingsCount += r.ratings_count
      }
    }
    const avg = ratingsCount > 0 ? ratingsSum / ratingsCount : null
    return { hosted, attended, totalMinutes, avg, ratingsCount }
  }, [data])

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-blue-500" />
          سجلي
        </h1>
        <p className="text-sm text-muted-foreground">
          استعرض جلسات البث المباشر التي قمت ببدئها أو حضرتها وتقييمات الطلاب لك.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="جلسات بدأتها" value={String(stats.hosted)} icon={<Radio className="w-4 h-4 text-red-500" />} />
        <StatBox label="جلسات حضرتها" value={String(stats.attended)} icon={<Users className="w-4 h-4 text-blue-500" />} />
        <StatBox label="دقائق بث" value={`${stats.totalMinutes}`} icon={<Clock className="w-4 h-4 text-emerald-500" />} />
        <StatBox
          label="متوسط تقييمي"
          value={stats.avg !== null ? `${stats.avg.toFixed(2)} (${stats.ratingsCount})` : '—'}
          icon={<Star className="w-4 h-4 text-amber-500" />}
        />
      </div>

      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {([
          { id: 'hosted' as const, label: 'جلسات بدأتها' },
          { id: 'attended' as const, label: 'جلسات حضرتها' },
          { id: 'all' as const, label: 'الكل' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive font-medium mb-3">{error}</p>
            <Button onClick={load}>إعادة المحاولة</Button>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted grid place-items-center">
              <Video className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">لا توجد جلسات بعد</h3>
            <p className="text-sm text-muted-foreground">
              بمجرد أن تبدأ بث مباشر أو تحضر جلسة ستظهر هنا تلقائياً.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <Card key={row.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex flex-col md:flex-row gap-4 md:items-start">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">
                        {row.title || `${KIND_LABEL[row.kind] || row.kind}`}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground/70">
                        {KIND_LABEL[row.kind] || row.kind}
                      </span>
                      {row.is_host && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          المضيف
                        </span>
                      )}
                      {!row.ended_at && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
                          مباشر الآن
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {fmtDate(row.started_at)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        المدة: {fmtDuration(row.duration_seconds)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        الحضور: {row.participants_count} (ذروة {row.peak_participants})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stars value={row.avg_rating !== null ? Number(row.avg_rating) : null} />
                      <span className="text-xs text-muted-foreground">
                        {row.ratings_count} تقييم
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 md:items-end">
                    {row.recording_url ? (
                      <Button asChild size="sm" variant="outline" className="gap-1">
                        <a href={row.recording_url} target="_blank" rel="noopener noreferrer">
                          <PlayCircle className="w-4 h-4" />
                          شاهد التسجيل
                        </a>
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {row.recording_status === 'recording' ? 'جاري التسجيل...' : 'لا يوجد تسجيل'}
                      </span>
                    )}
                    {row.kind === 'course_session' && (
                      <Button asChild size="sm" variant="ghost" className="gap-1">
                        <Link href={`/academy/teacher/sessions/${row.ref_id}`}>
                          تفاصيل الدرس
                        </Link>
                      </Button>
                    )}
                    {row.kind === 'halaqa' && (
                      <Button asChild size="sm" variant="ghost" className="gap-1">
                        <Link href={`/academy/teacher/halaqat/${row.ref_id}`}>
                          صفحة الحلقة
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold tabular-nums">{value}</p>
          </div>
          <div className="rounded-lg bg-muted p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

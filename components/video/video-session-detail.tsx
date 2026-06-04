"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  Clock,
  Download,
  Loader2,
  PlayCircle,
  Star,
  Users,
  Video as VideoIcon,
} from 'lucide-react'

interface Props {
  sessionId: string
  backHref: string
}

interface SessionInfo {
  data: {
    id: string
    kind: string
    ref_id: string
    platform: 'academy' | 'maqraa'
    room_name: string
    started_at: string
    ended_at: string | null
    duration_seconds: number | null
    peak_participants: number
    total_participants: number
    recording_status: string
    recording_url: string | null
    notes: string | null
    title: string | null
  }
  participants: Array<{
    user_id: string
    name: string
    email: string
    role: string
    joined_at: string
    left_at: string | null
    duration_seconds: number | null
  }>
  ratings: Array<{
    id: string
    user_id: string
    name: string
    rating: number
    comment: string | null
    audio_quality: number | null
    video_quality: number | null
    teacher_rating: number | null
    created_at: string
  }>
}

const KIND_LABEL: Record<string, string> = {
  halaqa: 'حلقة',
  booking: 'جلسة 1:1',
  course_session: 'درس مباشر',
}

export function VideoSessionDetail({ sessionId, backHref }: Props) {
  const [info, setInfo] = useState<SessionInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/video/sessions/${sessionId}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'تعذر تحميل الجلسة')
        if (!cancelled) setInfo(json)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'حدث خطأ')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-6 text-center mt-12">
        <p className="text-sm text-rose-500 mb-3">{error || 'تعذر تحميل البيانات'}</p>
        <Link href={backHref} className="text-emerald-600 hover:underline text-sm">
          ← رجوع
        </Link>
      </div>
    )
  }

  const s = info.data
  const avgRating =
    info.ratings.length > 0
      ? info.ratings.reduce((sum, r) => sum + r.rating, 0) / info.ratings.length
      : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={backHref} className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowRight className="w-4 h-4" /> سجل الجلسات
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                {KIND_LABEL[s.kind] || s.kind}
              </span>
              {!s.ended_at && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> مباشر الآن
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{s.title || KIND_LABEL[s.kind]}</h1>
            <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(s.started_at).toLocaleString('ar-EG')}
            </p>
          </div>
          {s.recording_url && (
            <a
              href={s.recording_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600"
            >
              <PlayCircle className="w-4 h-4" /> تشغيل التسجيل
              <Download className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}
          {!s.ended_at && s.platform === 'academy' && (
            <Link
              href={`/academy/admin/video-settings/sessions/${sessionId}/monitor`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-sm font-bold border border-emerald-500/20"
              target="_blank"
            >
              <VideoIcon className="w-4 h-4" /> مراقبة خفية
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Metric icon={<Clock className="w-3.5 h-3.5" />} label="المدة" value={s.duration_seconds ? `${Math.round(s.duration_seconds / 60)} د` : '—'} />
          <Metric icon={<Users className="w-3.5 h-3.5" />} label="ذروة المشاركين" value={s.peak_participants} />
          <Metric icon={<VideoIcon className="w-3.5 h-3.5" />} label="إجمالي المشاركين" value={info.participants.length} />
          <Metric
            icon={<Star className="w-3.5 h-3.5" />}
            label="متوسط التقييم"
            value={avgRating != null ? `${avgRating.toFixed(1)} / 5` : '—'}
          />
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold inline-flex items-center gap-2"><Users className="w-4 h-4" /> المشاركون ({info.participants.length})</h3>
        </div>
        {info.participants.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">لم يسجل أي مشارك في هذه الجلسة.</p>
        ) : (
          <div className="divide-y divide-border">
            {info.participants.map((p) => (
              <div key={`${p.user_id}-${p.joined_at}`} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full border ${
                    p.role === 'host'
                      ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                      : 'bg-muted text-muted-foreground border-border'
                  } font-bold`}>
                    {p.role === 'host' ? 'مضيف' : p.role === 'viewer' ? 'مشاهد' : 'مشارك'}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(p.joined_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    {p.left_at && ` → ${new Date(p.left_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                  {p.duration_seconds != null && (
                    <span className="font-bold">{Math.round(p.duration_seconds / 60)} د</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold inline-flex items-center gap-2"><Star className="w-4 h-4" /> التقييمات ({info.ratings.length})</h3>
        </div>
        {info.ratings.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">لم يقيّم أي طالب هذه الجلسة بعد.</p>
        ) : (
          <div className="divide-y divide-border">
            {info.ratings.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                  <div className="min-w-0">
                    <p className="font-bold">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {(r.audio_quality || r.video_quality || r.teacher_rating) && (
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mb-1">
                    {r.audio_quality && <span>الصوت: <strong className="text-foreground">{r.audio_quality}/5</strong></span>}
                    {r.video_quality && <span>الفيديو: <strong className="text-foreground">{r.video_quality}/5</strong></span>}
                    {r.teacher_rating && <span>المدرّس: <strong className="text-foreground">{r.teacher_rating}/5</strong></span>}
                  </div>
                )}
                {r.comment && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">{icon}{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
        />
      ))}
    </div>
  )
}

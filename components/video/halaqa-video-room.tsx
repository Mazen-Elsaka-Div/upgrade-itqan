"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  formatChatMessageLinks,
} from '@livekit/components-react'
import '@livekit/components-styles'
import {
  Loader2,
  LogOut,
  Radio,
  Star,
  Video,
} from 'lucide-react'
import { ClientRecorder } from './client-recorder'

export type VideoCallKind = 'halaqa' | 'booking' | 'session' | 'course_session'

interface Props {
  kind: VideoCallKind
  refId: string
  title?: string
  subtitle?: string
  /** Where to go when the user clicks "leave" / disconnects. */
  exitHref: string
  /** Hex/Tailwind colour for the accent badge, e.g. 'emerald'. */
  accent?: 'emerald' | 'indigo' | 'amber' | 'rose'
}

interface TokenResponse {
  token: string
  url: string
  roomName: string
  role: 'host' | 'participant' | 'viewer'
  identity: string
  name?: string
  platform: 'academy' | 'maqraa'
  videoSessionId: string | null
  settings: {
    recording_enabled: boolean
    allow_chat: boolean
    allow_screen_share: boolean
    allow_student_unmute: boolean
    allow_student_video: boolean
    default_video_quality: string
    default_audio_only: boolean
    show_participant_count: boolean
    watermark_text: string | null
    max_participants: number
  }
}

const ACCENTS: Record<NonNullable<Props['accent']>, { ring: string; chip: string; gradient: string }> = {
  emerald: {
    ring: 'ring-emerald-500/40',
    chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    gradient: 'from-emerald-600/20 via-emerald-500/5 to-transparent',
  },
  indigo: {
    ring: 'ring-indigo-500/40',
    chip: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    gradient: 'from-indigo-600/20 via-indigo-500/5 to-transparent',
  },
  amber: {
    ring: 'ring-amber-500/40',
    chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    gradient: 'from-amber-600/20 via-amber-500/5 to-transparent',
  },
  rose: {
    ring: 'ring-rose-500/40',
    chip: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    gradient: 'from-rose-600/20 via-rose-500/5 to-transparent',
  },
}

export function HalaqaVideoRoom({ kind, refId, title, subtitle, exitHref, accent = 'emerald' }: Props) {
  const router = useRouter()
  const [data, setData] = useState<TokenResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAtRef = useRef<number | null>(null)

  // tokenKind mapped for backwards compatibility — 'session' becomes 'course_session' on the server.
  const apiKind = kind === 'session' ? 'session' : kind

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: apiKind, id: refId }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'تعذر إنشاء رمز الدخول')
        if (cancelled) return
        if (!json.url) throw new Error('LIVEKIT_URL غير معرّف على الخادم')
        setData(json as TokenResponse)
        startedAtRef.current = Date.now()
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [apiKind, refId])

  // Tick the elapsed-time chip in the header.
  useEffect(() => {
    if (!data) return
    const i = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(i)
  }, [data])

  const accentTheme = useMemo(() => ACCENTS[accent], [accent])
  const isHost = data?.role === 'host'
  const sessionId = data?.videoSessionId

  const handleLeave = useCallback(() => {
    if (sessionId && data?.role !== 'host') {
      setShowLeaveConfirm(false)
      setShowRating(true)
      return
    }
    router.push(exitHref)
  }, [router, exitHref, sessionId, data?.role])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-6">
        <div className="relative">
          <div className={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-tr ${accentTheme.gradient}`} />
          <Loader2 className="relative w-12 h-12 animate-spin text-emerald-400" />
        </div>
        <p className="text-base font-medium text-foreground">جاري تجهيز غرفة البث المباشر…</p>
        <p className="text-xs text-muted-foreground">يتم التحقق من الصلاحيات والاتصال بخادم LiveKit</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 text-center space-y-4 mt-12">
        <Video className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">تعذر فتح الغرفة</h2>
        <p className="text-sm text-muted-foreground">{error || 'خطأ غير معروف'}</p>
        <button
          onClick={() => router.push(exitHref)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" /> رجوع
        </button>
      </div>
    )
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col">
      {/* Header bar */}
      <div className={`relative shrink-0 border-b border-white/10 bg-gradient-to-b ${accentTheme.gradient}`}>
        <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center ${accentTheme.chip} border`}>
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold truncate text-sm sm:text-base">{title || 'غرفة الجلسة'}</h2>
              {subtitle && <p className="text-[11px] sm:text-xs opacity-70 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full border ${accentTheme.chip}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              مباشر · {timeStr}
            </span>
            <span className="hidden md:inline-flex text-[11px] font-bold px-2 py-1 rounded-full bg-white/10 border border-white/10">
              {data.role === 'host' ? 'المضيف' : 'مشارك'}
            </span>

            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="relative flex-1 min-h-0" data-lk-theme="default">
        <LiveKitRoom
          serverUrl={data.url}
          token={data.token}
          connect
          audio={data.settings.allow_student_unmute || isHost}
          video={!data.settings.default_audio_only && (data.settings.allow_student_video || isHost)}
          onDisconnected={() => {
            if (sessionId && data.role !== 'host') {
              setShowRating(true)
            } else {
              router.push(exitHref)
            }
          }}
          style={{ height: '100%' }}
        >
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
          <RoomAudioRenderer />
          {isHost && sessionId && data.settings.recording_enabled && (
            <div className="absolute top-2 left-2 z-20 pointer-events-auto">
              <ClientRecorder sessionId={sessionId} enabled />
            </div>
          )}
        </LiveKitRoom>
        {data.settings.watermark_text && (
          <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-bold opacity-40 select-none">
            {data.settings.watermark_text}
          </div>
        )}
      </div>

      {showLeaveConfirm && (
        <LeaveConfirm onCancel={() => setShowLeaveConfirm(false)} onConfirm={handleLeave} />
      )}

      {showRating && sessionId && (
        <RatingModal
          sessionId={sessionId}
          onClose={() => {
            setShowRating(false)
            router.push(exitHref)
          }}
        />
      )}
    </div>
  )
}

function LeaveConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-zinc-900 border border-white/10 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold mb-2">هل تريد الخروج؟</h3>
        <p className="text-sm text-zinc-400 mb-5">سيتم قطع الاتصال بهذه الجلسة.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold">
            البقاء
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold">
            خروج
          </button>
        </div>
      </div>
    </div>
  )
}

function RatingModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [rating, setRating] = useState(0)
  const [audio, setAudio] = useState(0)
  const [video, setVideo] = useState(0)
  const [teacher, setTeacher] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!rating) return
    setSubmitting(true)
    try {
      await fetch(`/api/video/sessions/${sessionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          audio_quality: audio || undefined,
          video_quality: video || undefined,
          teacher_rating: teacher || undefined,
          comment: comment.trim() || undefined,
        }),
      })
      setDone(true)
      setTimeout(onClose, 800)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
        {done ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🌟</div>
            <h3 className="text-lg font-bold mb-1">شكراً على تقييمك</h3>
            <p className="text-sm text-zinc-400">سيساعدنا في تحسين الجلسات القادمة.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-bold mb-1">قيّم هذه الجلسة</h3>
              <p className="text-xs text-zinc-400">رأيك يهمنا — سيظهر للمدرّس والإدارة فقط.</p>
            </div>
            <RatingRow label="التقييم العام" value={rating} onChange={setRating} required />
            <RatingRow label="جودة الصوت" value={audio} onChange={setAudio} />
            <RatingRow label="جودة الفيديو" value={video} onChange={setVideo} />
            <RatingRow label="أداء المدرّس" value={teacher} onChange={setTeacher} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ملاحظات إضافية (اختياري)"
              rows={3}
              maxLength={500}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold"
              >
                تخطي
              </button>
              <button
                onClick={submit}
                disabled={!rating || submitting}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'جاري الإرسال…' : 'إرسال التقييم'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RatingRow({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  required?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">
        {label}
        {required && <span className="text-rose-400">*</span>}
      </span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 transition-transform hover:scale-110"
            aria-label={`${n} نجوم`}
          >
            <Star
              className={`w-5 h-5 ${
                n <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

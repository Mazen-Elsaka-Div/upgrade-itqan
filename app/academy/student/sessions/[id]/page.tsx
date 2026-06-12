'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Video, Calendar, Clock, Users, PlayCircle, ArrowRight,
  CheckCircle2, ExternalLink, BookOpen, FileText,
  Loader2, ArrowLeft, Info, AlertTriangle, LayoutDashboard
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import { cn } from '@/lib/utils'
import { VideoPlayerModal } from '@/components/video/video-player-modal'

interface SessionDetails {
  id: string
  title: string
  description: string | null
  course_id: string
  course_title: string
  course_description: string | null
  teacher_id: string
  teacher_name: string
  teacher_avatar: string | null
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  meeting_platform: string | null
  public_join_token: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  recording_url: string | null
  notes: string | null
  attachments: string | null
  attendees_count: number
  user_attended: boolean
  user_attendance: { id: string; joined_at: string; left_at: string | null } | null
  materials: Array<{
    id: string
    title: string
    type: string
    content_url: string | null
  }>
}

export default function SessionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [session, setSession] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const sessionId = params.id as string

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setError(isAr ? 'معرف الجلسة مفقود' : 'Session ID is missing')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/academy/student/sessions/${sessionId}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
        setError(null)
      } else if (res.status === 404) {
        setError(isAr ? 'الجلسة غير موجودة أو غير متاحة' : 'Session not found or not available')
      } else if (res.status === 401) {
        router.push('/login')
        return
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || (isAr ? 'فشل تحميل الجلسة' : 'Failed to load session'))
      }
    } catch (err) {
      console.error('[SessionDetails] Fetch error:', err)
      setError(isAr ? 'تعذّر الاتصال بالخادم' : 'Could not connect to server')
    } finally {
      setLoading(false)
    }
  }, [router, sessionId, isAr])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSession() }, [fetchSession])

  const handleJoinSession = async () => {
    if (!session?.meeting_link) return

    setJoining(true)
    try {
      const res = await fetch(`/api/academy/student/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
        credentials: 'include',
      })

      if (res.ok) {
        window.open(session.meeting_link, '_blank')
        fetchSession()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || (isAr ? 'فشل الانضمام للجلسة' : 'Failed to join session'))
      }
    } catch (err) {
      console.error('[SessionDetails] Join error:', err)
      setError(isAr ? 'حدث خطأ أثناء الانضمام' : 'Error occurred while joining')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return <PageLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 relative">
        <Button variant="ghost" asChild className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          <Link href="/academy/student/sessions">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
          </Link>
        </Button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[350px] text-center gap-5 p-10 bg-white/60 dark:bg-slate-900/60 border border-border/50 rounded-3xl backdrop-blur-xl shadow-xl shadow-red-500/5"
        >
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black">
              {isAr ? 'حدث خطأ' : 'An error occurred'}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">{error}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button size="lg" className="rounded-xl font-bold px-8 shadow-md" onClick={() => { setLoading(true); setError(null); fetchSession() }}>
              {isAr ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-xl font-bold px-8">
              <Link href="/academy/student/sessions">
                {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          <Link href="/academy/student/sessions">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
          </Link>
        </Button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white/60 dark:bg-slate-900/60 border border-border/50 rounded-3xl backdrop-blur-xl shadow-xl shadow-blue-900/5 min-h-[400px]"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Video className="w-10 h-10 text-slate-400 dark:text-slate-500/50" />
          </div>
          <h3 className="text-2xl font-black mb-3">
            {isAr ? 'الجلسة غير موجودة' : 'Session not found'}
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            {isAr ? 'قد تكون الجلسة محذوفة أو غير متاحة لك للاطلاع عليها في الوقت الحالي.' : 'The session may have been deleted or is not available to you.'}
          </p>
          <Button size="lg" className="rounded-xl font-bold px-8 shadow-md" asChild>
            <Link href="/academy/student/sessions">
              {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
            </Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  const now = new Date()
  const sessionDate = new Date(session.scheduled_at)
  const sessionEnd = new Date(sessionDate.getTime() + session.duration_minutes * 60000)
  const isLive = session.status === 'in_progress' || (sessionDate <= now && sessionEnd >= now && session.status !== 'completed')
  const isUpcoming = session.status === 'scheduled' && sessionDate > now
  const isCompleted = session.status === 'completed' || sessionEnd < now

  const formatDateTime = (dateStr: string) => {
    return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  }

  const statusConfig = {
    scheduled: {
      label: isAr ? 'مجدولة' : 'Scheduled',
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      gradient: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/30'
    },
    in_progress: {
      label: isAr ? 'مباشر الآن' : 'Live Now',
      color: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
      gradient: 'from-red-600 to-orange-600',
      shadow: 'shadow-red-500/30'
    },
    completed: {
      label: isAr ? 'منتهية' : 'Completed',
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30'
    },
    cancelled: {
      label: isAr ? 'ملغاة' : 'Cancelled',
      color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
      gradient: 'from-slate-600 to-slate-800',
      shadow: 'shadow-slate-500/30'
    },
  }

  const currentStatus = isLive ? 'in_progress' : session.status
  const statusInfo = statusConfig[currentStatus]

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative pb-12">
      {/* Background Ornaments */}
      <div className={cn("absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full -z-10 pointer-events-none opacity-20", isLive ? "bg-red-500" : "bg-blue-500")} />

      {/* Back Button */}
      <Button variant="ghost" asChild className="gap-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl backdrop-blur-sm -ml-2">
        <Link href="/academy/student/sessions">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isAr ? 'العودة للجلسات' : 'Back to Sessions'}
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Main Card */}
        <div className={cn(
          "bg-white/80 dark:bg-slate-900/80 rounded-3xl overflow-hidden border-2 transition-all duration-500 backdrop-blur-xl hover:shadow-2xl",
          isLive ? "border-red-500/50 shadow-xl shadow-red-500/10" : "border-border/50 hover:border-blue-500/30 shadow-xl shadow-blue-900/5"
        )}>
          {/* Header */}
          <div className={cn("relative p-8 md:p-10 bg-gradient-to-r text-white overflow-hidden", statusInfo.gradient)}>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
            
            <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6 z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className={cn("px-4 py-1.5 rounded-full text-sm font-bold bg-white/20 backdrop-blur-md border border-white/20 shadow-sm", statusInfo.shadow)}>
                    {statusInfo.label}
                  </span>
                  {isLive && (
                    <span className="flex items-center gap-2 text-sm font-bold bg-white/20 backdrop-blur-md border border-white/20 shadow-sm px-4 py-1.5 rounded-full">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                      </span>
                      {isAr ? 'بث مباشر الآن' : 'Live Now'}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tight drop-shadow-sm">{session.title}</h1>
                <Link href={`/academy/student/courses/${session.course_id}`} className="inline-flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm md:text-base -ml-3">
                  <BookOpen className="w-5 h-5 shrink-0 opacity-80" />
                  {session.course_title}
                </Link>
              </div>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20 shadow-lg self-start">
                <Video className={cn("w-10 h-10 md:w-12 md:h-12", isLive && "animate-pulse")} />
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-8">
            {/* Session Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard
                icon={<Calendar className="w-6 h-6 text-blue-500" />}
                label={isAr ? 'التاريخ والوقت' : 'Date & Time'}
                value={formatDateTime(session.scheduled_at)}
                isAr={isAr}
              />
              <InfoCard
                icon={<Clock className="w-6 h-6 text-purple-500" />}
                label={isAr ? 'المدة' : 'Duration'}
                value={`${session.duration_minutes} ${isAr ? 'دقيقة' : 'min'}`}
                isAr={isAr}
              />
              <InfoCard
                icon={<Users className="w-6 h-6 text-orange-500" />}
                label={isAr ? 'الحضور' : 'Attendees'}
                value={String(session.attendees_count)}
                isAr={isAr}
              />
              <InfoCard
                icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                label={isAr ? 'حضورك' : 'Your Attendance'}
                value={session.user_attended ? (isAr ? 'حضرت' : 'Attended') : (isAr ? 'لم تحضر' : 'Not attended')}
                isAr={isAr}
                highlight={session.user_attended}
              />
            </div>

            {/* Teacher */}
            <div className="flex items-center gap-5 p-5 md:p-6 rounded-2xl border border-border/50 bg-slate-50/50 dark:bg-slate-800/30 shadow-sm">
              <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-slate-900 shadow-md">
                <AvatarImage src={session.teacher_avatar || undefined} alt={session.teacher_name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 text-xl font-bold">
                  {session.teacher_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{isAr ? 'المدرس' : 'Teacher'}</p>
                <p className="font-black text-xl text-foreground">{session.teacher_name}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Description */}
              {session.description && (
                <div className="bg-slate-50 dark:bg-slate-800/30 border border-border/50 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-black mb-3 flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-blue-500" />
                    {isAr ? 'وصف الجلسة' : 'Session Description'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">{session.description}</p>
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50 shadow-sm">
                  <h4 className="font-black text-amber-900 dark:text-amber-100 flex items-center gap-2 text-lg mb-3">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    {isAr ? 'ملاحظات المدرس' : 'Teacher Notes'}
                  </h4>
                  <p className="text-amber-800 dark:text-amber-200 leading-relaxed font-medium">{session.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
              {isLive && (
                <Button
                  size="lg"
                  asChild
                  className="gap-2 flex-1 font-black text-base bg-gradient-to-r from-red-600 to-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-red-500/25 h-14 rounded-2xl"
                >
                  <Link href={`/academy/student/sessions/${session.id}/live`}>
                    <PlayCircle className="w-6 h-6" />
                    {isAr ? 'انضم للبث المباشر الآن' : 'Join Live Stream Now'}
                  </Link>
                </Button>
              )}
              {(isLive || isUpcoming) && session.meeting_link && (
                <Button
                  size="lg"
                  variant={isLive ? 'outline' : 'default'}
                  className={cn(
                    "gap-2 flex-1 font-black text-base transition-all duration-300 h-14 rounded-2xl",
                    !isLive ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25" : "border-2 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20"
                  )}
                  onClick={handleJoinSession}
                  disabled={joining}
                >
                  {joining ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <ExternalLink className="w-6 h-6" />
                  )}
                  {isLive
                    ? (isAr ? 'فتح الرابط الخارجي' : 'Open External Link')
                    : (isAr ? 'فتح رابط الجلسة' : 'Open Meeting Link')}
                </Button>
              )}

              {isCompleted && session.recording_url && (
                <VideoPlayerModal url={session.recording_url} title={session.title}>
                  <Button
                    size="lg"
                    className="gap-2 flex-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-emerald-500/25 font-black text-base h-14 rounded-2xl"
                  >
                    <PlayCircle className="w-6 h-6" />
                    {isAr ? 'شاهد التسجيل' : 'Watch Recording'}
                  </Button>
                </VideoPlayerModal>
              )}

              {isUpcoming && !session.meeting_link && (
                <Button size="lg" disabled className="gap-2 flex-1 font-bold h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-100">
                  <Clock className="w-6 h-6" />
                  {isAr ? 'الجلسة لم تبدأ بعد' : 'Session not started yet'}
                </Button>
              )}

              {session.public_join_token && (
                <Button size="lg" variant="outline" asChild className="gap-2 font-bold h-14 rounded-2xl border-2 border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Link href={`/academy/public/session/${session.public_join_token}`}>
                    <ExternalLink className="w-5 h-5" />
                    {isAr ? 'رابط الدرس العام' : 'Public Lesson Link'}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Related Materials */}
      {session.materials && session.materials.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="bg-white/80 dark:bg-slate-900/80 border border-border/50 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg shadow-blue-900/5 mt-8">
            <div className="px-6 md:px-8 py-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-black">
                {isAr ? 'مواد الدورة' : 'Course Materials'}
              </h2>
            </div>
            <div className="p-4 md:p-6 grid gap-4 md:grid-cols-2">
              {session.materials.map((material, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + (i * 0.05) }}
                  key={material.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:border-blue-500/30 bg-card hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{material.title}</p>
                      <p className="text-xs font-medium text-muted-foreground capitalize mt-0.5">
                        {material.type}
                      </p>
                    </div>
                  </div>
                  {material.content_url && (
                    <Button size="icon" variant="ghost" asChild className="shrink-0 w-10 h-10 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400">
                      <a href={material.content_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
  isAr,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isAr: boolean
  highlight?: boolean
}) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5",
      highlight ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" : "bg-card border-border/50"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
        highlight ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"
      )}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className={cn("font-black text-sm truncate", highlight ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>
          {value}
        </p>
      </div>
    </div>
  )
}

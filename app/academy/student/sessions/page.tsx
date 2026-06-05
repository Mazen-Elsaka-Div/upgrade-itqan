"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Calendar, Clock, Users, PlayCircle,
  CheckCircle2, ExternalLink, BookOpen, Search,
  ArrowUpRight, History
} from 'lucide-react'
import { VideoPlayerModal } from '@/components/video/video-player-modal'

interface Session {
  id: string
  title: string
  description?: string
  course_id: string
  course_title: string
  teacher_id: string
  teacher_name: string
  scheduled_at: string
  duration_minutes: number
  meeting_link?: string
  meeting_platform?: string
  is_public?: boolean
  public_join_token?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  recording_url?: string
  attendees_count?: number
}

type Filter = 'upcoming' | 'live' | 'completed' | 'all'

function SessionCardSkeleton() {
  return (
    <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-border/50 p-5 animate-pulse backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
      </div>
    </div>
  )
}

export default function StudentSessionsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/academy/student/sessions')
        if (res.ok) {
          const data = await res.json()
          setSessions(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  const now = new Date()

  const isLive = (session: Session) => {
    const sessionDate = new Date(session.scheduled_at)
    const sessionEnd = new Date(sessionDate.getTime() + session.duration_minutes * 60000)
    return session.status === 'in_progress' || (sessionDate <= now && sessionEnd >= now && session.status !== 'completed')
  }

  const matchesSearch = (s: Session) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      s.title?.toLowerCase().includes(q) ||
      s.course_title?.toLowerCase().includes(q) ||
      s.teacher_name?.toLowerCase().includes(q)
    )
  }

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (!matchesSearch(s)) return false
      const sessionDate = new Date(s.scheduled_at)
      const sessionEnd = new Date(sessionDate.getTime() + s.duration_minutes * 60000)
      if (filter === 'live') return isLive(s)
      if (filter === 'upcoming') return s.status === 'scheduled' && sessionDate > now && !isLive(s)
      if (filter === 'completed') return s.status === 'completed' || sessionEnd < now
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, filter, search])

  const liveCount = sessions.filter(isLive).length
  const upcomingCount = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > now && !isLive(s)).length
  const completedCount = sessions.filter(s => {
    const sessionDate = new Date(s.scheduled_at)
    const sessionEnd = new Date(sessionDate.getTime() + s.duration_minutes * 60000)
    return s.status === 'completed' || sessionEnd < now
  }).length

  const statusConfig: Record<string, { label: string; color: string }> = {
    scheduled:   { label: t.academy?.scheduled  || (isAr ? 'مجدولة'      : 'Scheduled'),  color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' },
    in_progress: { label: t.academy?.live       || (isAr ? 'مباشر الآن' : 'Live now'),    color: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20' },
    completed:   { label: t.academy?.completed  || (isAr ? 'منتهية'      : 'Completed'),  color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
    cancelled:   { label: t.academy?.cancelled  || (isAr ? 'ملغاة'        : 'Cancelled'),  color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20' },
  }

  const fmtDate = (d: Date) => new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  const fmtTime = (d: Date) => new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: !isAr }).format(d)

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = date.getTime() - now.getTime()
    if (diff < 0) return null
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return isAr ? `بعد ${minutes} دقيقة` : `in ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return isAr ? `بعد ${hours} ساعة` : `in ${hours} hr`
    const days = Math.floor(hours / 24)
    return isAr ? `بعد ${days} يوم` : `in ${days} days`
  }

  const groupedSessions = useMemo(() => {
    if (filter === 'live') return null
    const groups = new Map<string, Session[]>()
    const sorted = [...filteredSessions].sort((a, b) => {
      const av = new Date(a.scheduled_at).getTime()
      const bv = new Date(b.scheduled_at).getTime()
      return filter === 'completed' ? bv - av : av - bv
    })
    for (const s of sorted) {
      const d = new Date(s.scheduled_at)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(s)
    }
    return Array.from(groups.entries())
  }, [filteredSessions, filter])

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase backdrop-blur-sm w-fit">
            <Video className="w-4 h-4" />
            {t.academy?.liveSessions || (isAr ? 'الجلسات الحية' : 'Live Sessions')}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 py-1">
            {isAr ? 'مواعيد الجلسات' : 'Sessions Schedule'}
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            {t.academy?.sessionsDesc || (isAr ? 'احضر جلسات دوراتك المباشرة وراجع التسجيلات السابقة بكل سهولة.' : 'Attend your live class sessions and review recordings.')}
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute top-1/2 -translate-y-1/2 start-4 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث بعنوان الجلسة، الدورة، أو المدرس...' : 'Search by session, course, or teacher...'}
            className="w-full ps-11 pe-4 py-3 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-slate-900/80"
          />
        </div>
      </motion.div>

      {/* Live Alert */}
      <AnimatePresence>
        {liveCount > 0 && filter !== 'live' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-red-500/5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40 shrink-0">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-red-700 dark:text-red-300 text-lg">
                    {liveCount} {t.academy?.sessionsLiveNow || (isAr ? 'جلسة مباشرة الآن' : 'live sessions right now')}
                  </p>
                  <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80">
                    {t.academy?.joinNow || (isAr ? 'انضم الآن قبل انتهاء البث المباشر' : 'Join now before it ends')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFilter('live')}
                className="self-start sm:self-center px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-500/20"
              >
                {isAr ? 'عرض الجلسات المباشرة' : 'View live sessions'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide bg-white/40 dark:bg-slate-900/40 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm w-fit"
      >
        {([
          { id: 'upcoming'  as Filter, label: t.academy?.upcoming  || (isAr ? 'القادمة' : 'Upcoming'),  count: upcomingCount,  icon: Calendar },
          { id: 'live'      as Filter, label: t.academy?.live      || (isAr ? 'مباشر' : 'Live'),        count: liveCount,      icon: Video },
          { id: 'completed' as Filter, label: t.academy?.completed || (isAr ? 'منتهية' : 'Completed'), count: completedCount, icon: CheckCircle2 },
          { id: 'all'       as Filter, label: isAr ? 'الكل' : 'All',                                      count: sessions.length, icon: History },
        ]).map(tab => {
          const isSelected = filter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "relative shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden",
                isSelected ? "text-white shadow-md shadow-blue-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {isSelected && (
                <motion.div 
                  layoutId="sessionFilterTab"
                  className={cn(
                    "absolute inset-0",
                    tab.id === 'live' ? "bg-gradient-to-r from-red-600 to-orange-600" :
                    tab.id === 'completed' ? "bg-gradient-to-r from-emerald-600 to-teal-600" :
                    tab.id === 'all' ? "bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800" :
                    "bg-gradient-to-r from-blue-600 to-indigo-600"
                  )}
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon className={cn("w-4 h-4", isSelected && tab.id === 'live' && "animate-pulse")} />
                {tab.label}
                <span className={cn(
                  "flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] px-1.5 transition-colors",
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {tab.count}
                </span>
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Sessions List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {[0,1,2].map(i => <SessionCardSkeleton key={i} />)}
          </motion.div>
        ) : filteredSessions.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center p-12 text-center bg-white/60 dark:bg-slate-900/60 border border-border/50 rounded-3xl backdrop-blur-xl shadow-xl shadow-blue-900/5 min-h-[350px]"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Video className="w-10 h-10 text-slate-400 dark:text-slate-500/50" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">
              {search ? (isAr ? 'لا توجد نتائج' : 'No results') : (t.academy?.noSessions || (isAr ? 'لا توجد جلسات' : 'No sessions'))}
            </h3>
            <p className="text-muted-foreground font-medium max-w-sm mb-8 leading-relaxed">
              {search
                ? (isAr ? `لم نعثر على جلسات تطابق "${search}".` : `No sessions matched "${search}".`)
                : (
                  filter === 'upcoming'  ? (t.academy?.noUpcomingSessions  || (isAr ? 'لا توجد جلسات قادمة في الوقت الحالي. سيتم تنبيهك عند تحديد موعد.' : 'No upcoming sessions right now.')) :
                  filter === 'live'      ? (t.academy?.noLiveSessions      || (isAr ? 'لا توجد جلسات مباشرة الآن. راقب تبويب القادمة لمعرفة المواعيد.' : 'No live sessions at the moment.')) :
                  filter === 'completed' ? (t.academy?.noCompletedSessions || (isAr ? 'لم تنتهِ أي جلسات بعد للاطلاع على تسجيلاتها.' : 'No completed sessions yet.')) :
                                            (isAr ? 'لا توجد جلسات مسجّلة.' : 'No sessions recorded.')
                )
              }
            </p>
          </motion.div>
        ) : groupedSessions && filter !== 'live' ? (
          <motion.div key="grouped" className="space-y-8" initial="hidden" animate="show" variants={{
            show: { transition: { staggerChildren: 0.1 } }
          }}>
            {groupedSessions.map(([key, items]) => (
              <motion.div key={key} className="space-y-4" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <div className="flex items-center gap-3 text-sm font-black text-slate-500 dark:text-slate-400 px-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {fmtDate(new Date(items[0].scheduled_at))}
                  <div className="flex-1 h-px bg-border/50 ml-4" />
                </div>
                <div className="space-y-4">
                  {items.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isLive={isLive(session)}
                      isAr={isAr}
                      t={t}
                      statusConfig={statusConfig}
                      fmtTime={fmtTime}
                      timeUntil={getTimeUntil(session.scheduled_at)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-4" initial="hidden" animate="show" variants={{
            show: { transition: { staggerChildren: 0.05 } }
          }}>
            {filteredSessions.map(session => (
              <motion.div key={session.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <SessionCard
                  session={session}
                  isLive={isLive(session)}
                  isAr={isAr}
                  t={t}
                  statusConfig={statusConfig}
                  fmtTime={fmtTime}
                  timeUntil={getTimeUntil(session.scheduled_at)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface SessionCardProps {
  session: Session
  isLive: boolean
  isAr: boolean
  t: any
  statusConfig: Record<string, { label: string; color: string }>
  fmtTime: (d: Date) => string
  timeUntil: string | null
}

function SessionCard({ session, isLive, isAr, t, statusConfig, fmtTime, timeUntil }: SessionCardProps) {
  const platformLabel =
    session.meeting_platform === 'google_meet' ? 'Google Meet' :
    session.meeting_platform === 'zoom' ? 'Zoom' :
    (isAr ? 'رابط خارجي' : 'External link')

  return (
    <div
      className={cn(
        'group bg-white/80 dark:bg-slate-900/80 rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 backdrop-blur-xl',
        isLive ? 'border-red-500/50 shadow-lg shadow-red-500/10 hover:border-red-500' : 'border-border/50 hover:border-blue-500/40 hover:shadow-blue-500/5'
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        {/* Icon */}
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 self-start shadow-inner',
          isLive ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white animate-pulse shadow-red-500/30'
                 : session.status === 'completed' ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400'
                 : 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400'
        )}>
          {session.status === 'completed' ? <CheckCircle2 className="w-8 h-8" /> : <Video className="w-8 h-8" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div>
              <Link
                href={`/academy/student/sessions/${session.id}`}
                className="font-black text-xl hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
              >
                {session.title}
              </Link>
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground mt-2 flex-wrap">
                <Link href={`/academy/student/courses/${session.course_id}`} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg hover:text-foreground transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  {session.course_title}
                </Link>
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {session.teacher_name}
                </span>
              </div>
            </div>
            
            <div className={cn(
              'px-3 py-1.5 rounded-xl text-sm font-bold shrink-0 border',
              isLive ? statusConfig.in_progress.color : statusConfig[session.status].color
            )}>
              {isLive ? statusConfig.in_progress.label : statusConfig[session.status].label}
            </div>
          </div>

          {session.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{session.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground flex-wrap pt-2 border-t border-border/50">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 opacity-70" />
              {fmtTime(new Date(session.scheduled_at))}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 opacity-70" />
              {session.duration_minutes} {t.academy?.minutes || (isAr ? 'دقيقة' : 'min')}
            </span>
            {session.attendees_count !== undefined && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 opacity-70" />
                {session.attendees_count} {t.academy?.attendees || (isAr ? 'حاضر' : 'attending')}
              </span>
            )}
            {session.meeting_link && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <ExternalLink className="w-3.5 h-3.5" />
                {platformLabel}
              </span>
            )}
          </div>

          {!isLive && timeUntil && session.status === 'scheduled' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-bold mt-1">
              <Calendar className="w-4 h-4" />
              {timeUntil}
            </div>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0 flex flex-row md:flex-col gap-2 md:items-end flex-wrap">
          {isLive ? (
            <Link
              href={`/academy/student/sessions/${session.id}/live`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:scale-105 font-bold shadow-md shadow-red-500/30 transition-all flex-1 md:flex-none"
            >
              <PlayCircle className="w-5 h-5" />
              {t.academy?.joinNow || (isAr ? 'انضم للبث المباشر' : 'Join live now')}
            </Link>
          ) : session.meeting_link && session.status === 'scheduled' ? (
            <a
              href={session.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all flex-1 md:flex-none"
            >
              <Video className="w-5 h-5" />
              {isAr ? 'رابط خارجي' : 'External link'}
            </a>
          ) : session.status === 'completed' && session.recording_url ? (
            <VideoPlayerModal url={session.recording_url} title={session.title}>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:scale-105 font-bold shadow-md shadow-emerald-500/20 transition-all flex-1 md:flex-none"
              >
                <PlayCircle className="w-5 h-5" />
                {t.academy?.watchRecording || (isAr ? 'شاهد التسجيل' : 'Watch recording')}
              </button>
            </VideoPlayerModal>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-bold cursor-not-allowed flex-1 md:flex-none"
            >
              <Clock className="w-5 h-5" />
              {isAr ? 'لم تبدأ بعد' : 'Not started'}
            </button>
          )}
          <Link
            href={`/academy/student/sessions/${session.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-foreground border border-border/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 md:flex-none"
          >
            {isAr ? 'تفاصيل الجلسة' : 'Details'}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          {session.is_public && session.public_join_token && (
            <Link
              href={`/academy/public/session/${session.public_join_token}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex-1 md:flex-none mt-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {isAr ? 'رابط المشاركة' : 'Share link'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

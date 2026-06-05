'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Loader2, PlayCircle, Users, Video, ArrowLeft, RefreshCcw } from 'lucide-react'
import { VideoPlayerModal } from '@/components/video/video-player-modal'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Recording {
  id: string
  kind: 'halaqa' | 'booking' | 'course_session'
  ref_id: string
  title: string | null
  started_at: string
  duration_seconds: number | null
  recording_url: string | null
  started_by_name: string | null
  participants_count: number
}

const KIND_LABEL: Record<string, string> = {
  halaqa: 'حلقة إقراء',
  booking: 'جلسة فردية',
  course_session: 'درس دورة',
}

const KIND_COLORS: Record<string, string> = {
  halaqa: 'from-emerald-500/20 to-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  booking: 'from-blue-500/20 to-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  course_session: 'from-indigo-500/20 to-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
}

function fmtDuration(seconds: number | null) {
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
      month: 'long',
      year: 'numeric',
    }).format(new Date(s))
  } catch {
    return s
  }
}

export default function StudentRecordingsPage() {
  const [data, setData] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/video/recordings?scope=mine&platform=academy&limit=200')
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'فشل تحميل التسجيلات')
      }
      const json = await res.json()
      setData(json.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع أثناء الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 relative" dir="rtl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-l from-emerald-600 to-teal-700 p-8 sm:p-10 text-white shadow-xl shadow-emerald-900/10"
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
              <Video className="w-4 h-4 text-emerald-100" />
              <span className="text-sm font-bold tracking-wide">أكاديمية إتقان</span>
            </div>
            <h1 className="text-3xl font-black sm:text-4xl drop-shadow-sm">مكتبة التسجيلات</h1>
            <p className="text-emerald-50 max-w-xl leading-relaxed text-base">
              راجع جميع محاضراتك، الجلسات الفردية، وحلقات الإقراء التي تم تسجيلها لتستفيد منها في المراجعة والمذاكرة في أي وقت.
            </p>
          </div>
          
          <div className="flex shrink-0 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-3xl font-black leading-none">{data.length}</p>
              <p className="text-sm font-medium text-emerald-100 mt-1">تسجيل متاح</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-muted-foreground font-medium animate-pulse">جاري جلب التسجيلات...</p>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <Card className="w-full max-w-md border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 shadow-lg shadow-red-500/5 backdrop-blur-xl">
              <CardContent className="py-12 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <RefreshCcw className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">عذراً، حدث خطأ</h3>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80 px-4">{error}</p>
                </div>
                <Button 
                  onClick={load} 
                  variant="destructive" 
                  className="rounded-xl px-8 shadow-sm hover:shadow-md transition-all"
                >
                  إعادة المحاولة
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : data.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <Card className="w-full max-w-2xl border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/30">
              <CardContent className="py-20 text-center space-y-5">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-ping opacity-20" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
                    <Video className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">لا توجد تسجيلات حتى الآن</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    لم يتم العثور على أي تسجيلات للجلسات التي حضرتها. بمجرد أن يقوم المعلم بمشاركة تسجيل جلسة سابقة، سيظهر هنا مباشرة.
                  </p>
                </div>
                <Button 
                  onClick={load} 
                  variant="outline" 
                  className="mt-4 rounded-xl border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  تحديث الصفحة
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {data.map((r, index) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="group h-full flex flex-col overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-border/50 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                    <CardContent className="p-6 flex flex-col h-full space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2 flex-1">
                          <Badge 
                            variant="secondary" 
                            className={cn("w-fit font-bold border bg-gradient-to-r", KIND_COLORS[r.kind] || KIND_COLORS.halaqa)}
                          >
                            {KIND_LABEL[r.kind] || 'جلسة'}
                          </Badge>
                          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {r.title || KIND_LABEL[r.kind]}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                          <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate font-medium">{fmtDate(r.started_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-medium">{fmtDuration(r.duration_seconds)}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                          <Users className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-medium">{r.participants_count} مشارك حضر الجلسة</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        {r.recording_url ? (
                          <div className="flex-1">
                            <VideoPlayerModal 
                              url={r.recording_url} 
                              title={r.title || KIND_LABEL[r.kind]} 
                            />
                          </div>
                        ) : (
                          <Button disabled className="flex-1 rounded-xl bg-muted text-muted-foreground" variant="secondary">
                            قيد المعالجة
                          </Button>
                        )}
                        
                        {r.kind === 'course_session' && (
                          <Button 
                            asChild 
                            variant="outline" 
                            className="shrink-0 rounded-xl px-4 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
                          >
                            <Link href={`/academy/student/sessions/${r.ref_id}`}>
                              التفاصيل
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

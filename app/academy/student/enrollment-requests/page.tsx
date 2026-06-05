"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Clock, CheckCircle, XCircle, GraduationCap, LayoutDashboard, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnrollmentRequest {
  id: string
  status: 'pending' | 'active' | 'rejected'
  enrolled_at: string
  course_id: string
  course_title: string
  level: string
  thumbnail_url?: string
  teacher_name: string
}

const statusConfig = {
  pending: {
    label: 'في انتظار الموافقة',
    icon: Clock,
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
  },
  active: {
    label: 'مُقبول',
    icon: CheckCircle,
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  rejected: {
    label: 'مرفوض',
    icon: XCircle,
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  }
}

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم'
}

export default function EnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all')

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/academy/student/enrollments')
        if (res.ok) {
          const json = await res.json()
          setRequests(json.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch enrollment requests:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative" dir="rtl">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase backdrop-blur-sm w-fit">
          <LayoutDashboard className="w-4 h-4" />
          متابعة الطلبات
        </div>
        <h1 className="text-3xl lg:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 py-1">
          طلبات الانضمام للدورات
        </h1>
        <p className="text-muted-foreground font-medium max-w-xl">
          تتبع حالة طلباتك للالتحاق بالدورات الأكاديمية وتابع مسيرتك التعليمية بسهولة.
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-2 flex-wrap bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-border/50 backdrop-blur-sm w-fit shadow-sm"
      >
        {(['all', 'pending', 'active', 'rejected'] as const).map((f) => {
          const isSelected = filter === f
          const Icon = f !== 'all' ? statusConfig[f].icon : null
          
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden",
                isSelected ? "text-white shadow-md shadow-blue-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {isSelected && (
                <motion.div 
                  layoutId="enrollmentFilterTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                {f === 'all' ? 'الكل' : statusConfig[f].label}
                <span className={cn(
                  "flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] px-1.5 transition-colors",
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {f === 'all' ? requests.length : requests.filter(r => r.status === f).length}
                </span>
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[300px]"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-blue-100 dark:border-blue-900/30" />
              <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute inset-0" />
            </div>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center p-12 text-center bg-white/60 dark:bg-slate-900/60 border border-border/50 rounded-3xl backdrop-blur-xl shadow-xl shadow-blue-900/5 min-h-[350px]"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <BookOpen className="w-10 h-10 text-blue-400 dark:text-blue-500/50" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">لا توجد طلبات هنا</h3>
            <p className="text-muted-foreground font-medium max-w-sm mb-8 leading-relaxed">
              {filter === 'all'
                ? 'لم تقم بتقديم أي طلب انضمام لأي دورة حتى الآن. استكشف الدورات المتاحة وابدأ رحلتك.'
                : 'لا توجد طلبات تتطابق مع هذه الحالة حالياً.'}
            </p>
            <Link
              href="/academy/student/courses/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
            >
              <BookOpen className="w-5 h-5" />
              تصفح الدورات الآن
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            className="grid gap-4"
          >
            {filtered.map((req, i) => {
              const config = statusConfig[req.status]
              const StatusIcon = config.icon
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={req.id} 
                  className="group bg-white/80 dark:bg-slate-900/80 border border-border/50 hover:border-blue-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all hover:shadow-xl hover:shadow-blue-900/5 backdrop-blur-xl"
                >
                  {/* Course Thumbnail */}
                  <div className="w-full sm:w-28 h-36 sm:h-28 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/50 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:shadow-md transition-all">
                    {req.thumbnail_url ? (
                      <img src={req.thumbnail_url} alt={req.course_title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-xl text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{req.course_title}</h3>
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-2 flex-wrap">
                          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                            <GraduationCap className="w-4 h-4 text-blue-500" />
                            {req.teacher_name}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {levelLabels[req.level] || req.level}
                          </span>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold shrink-0 border self-start", config.className)}>
                        <StatusIcon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <CalendarDays className="w-4 h-4 opacity-70" />
                        تاريخ الطلب: <span dir="ltr">{new Date(req.enrolled_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      
                      {/* Action Button */}
                      {req.status === 'active' && (
                        <Link
                          href={`/academy/student/courses/${req.course_id}`}
                          className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 text-sm font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
                        >
                          الدخول للدورة
                          <CheckCircle className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

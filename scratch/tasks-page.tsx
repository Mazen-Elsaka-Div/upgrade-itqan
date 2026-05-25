"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  ClipboardList, Clock, Star, Filter, CheckCircle2,
  AlertCircle, BookOpen, Mic, FileText, HelpCircle,
  TrendingUp, Loader2, PlayCircle, FolderOpen, ImageIcon, PenTool
} from 'lucide-react'

type TaskKind = 'memorization' | 'recitation' | 'written' | 'quiz' | 'project' | 'media'

interface Task {
  id: string
  title: string
  description?: string
  course_id: string
  course_title: string
  type?: string
  due_date?: string
  points_value: number
  status: 'pending' | 'submitted' | 'graded' | 'late'
  grade?: number
  feedback?: string
}

function normalizeTaskType(raw?: string | null): TaskKind {
  const v = (raw || '').toLowerCase()
  if (v === 'recitation' || v === 'audio') return 'recitation'
  if (v === 'video' || v === 'image') return 'media'
  if (v === 'memorization' || v === 'memorize') return 'memorization'
  if (v === 'quiz' || v === 'test' || v === 'exam') return 'quiz'
  if (v === 'project' || v === 'file') return 'project'
  return 'written'
}

export default function StudentTasksPage() {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [marking, setMarking] = useState<string | null>(null)

  async function fetchTasks() {
    try {
      const res = await fetch('/api/academy/student/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleMarkDone = async (taskId: string, currentStatus: Task['status']) => {
    setMarking(taskId)
    const action = currentStatus === 'submitted' ? 'undo_done' : 'mark_done'
    try {
      const res = await fetch(`/api/academy/student/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId
          ? { ...t, status: action === 'mark_done' ? 'submitted' : 'pending' }
          : t))
      }
    } catch (err) {
      console.error('mark done failed', err)
    } finally {
      setMarking(null)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  const typeIcons = {
    memorization: BookOpen,
    recitation: Mic,
    written: PenTool,
    quiz: HelpCircle,
    project: FolderOpen,
    media: PlayCircle
  }

  const typeLabels = {
    memorization: 'حفظ',
    recitation: 'تسميع',
    written: 'كتابي',
    quiz: 'اختبار',
    project: 'مشروع / ملف',
    media: 'وسائط'
  }

  const statusConfig = {
    pending: { 
      label: 'معلق', 
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Clock
    },
    submitted: { 
      label: 'مُسلَّم', 
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: CheckCircle2
    },
    graded: { 
      label: 'مُقيَّم', 
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2
    },
    late: { 
      label: 'متأخر', 
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      icon: AlertCircle
    }
  }

  const getDueStatus = (dueDate?: string) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return { text: 'متأخر', urgent: true, veryUrgent: true }
    if (days === 0) return { text: 'اليوم', urgent: true, veryUrgent: false }
    if (days === 1) return { text: 'غداً', urgent: true, veryUrgent: false }
    if (days <= 3) return { text: `باقي ${days} أيام`, urgent: false, veryUrgent: false }
    return { text: formatDate(dueDate), urgent: false, veryUrgent: false }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-SA', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">جاري تحميل المهام...</p>
      </div>
    )
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const submittedCount = tasks.filter(t => t.status === 'submitted').length
  const gradedCount = tasks.filter(t => t.status === 'graded').length
  const lateCount = tasks.filter(t => t.status === 'late').length
  const totalCount = tasks.length
  const doneCount = submittedCount + gradedCount
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            {t.academy?.tasks || 'لوحة المهام'}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            {t.academy?.tasksDesc || 'تابع إنجازاتك وأكمل مهامك لترفع رصيد نقاطك'}
          </p>
        </div>
      </div>

      {/* Completion progress card */}
      {totalCount > 0 && (
        <div className="relative overflow-hidden bg-card/40 backdrop-blur-xl rounded-2xl border border-border shadow-lg p-6">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  مؤشر الإنجاز الكلي
                </p>
                <div className="flex items-center gap-3 mt-1 text-sm font-medium">
                  <span className="text-muted-foreground">{doneCount} من {totalCount} مهام مكتملة</span>
                  {lateCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md text-xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {lateCount} مهام متأخرة
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-emerald-600">{completionPct}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('pending')}
          className={cn(
            "relative overflow-hidden bg-card/60 backdrop-blur-md rounded-2xl border p-5 text-start transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
            filter === 'pending' ? "border-amber-500 shadow-md ring-1 ring-amber-500" : "border-border hover:border-amber-500/50"
          )}
        >
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <p className="text-4xl font-black text-amber-600 dark:text-amber-400 mb-1 drop-shadow-sm">{pendingCount}</p>
          <p className="text-sm font-bold text-muted-foreground group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">المهام المعلقة</p>
        </button>

        <button
          onClick={() => setFilter('submitted')}
          className={cn(
            "relative overflow-hidden bg-card/60 backdrop-blur-md rounded-2xl border p-5 text-start transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
            filter === 'submitted' ? "border-blue-500 shadow-md ring-1 ring-blue-500" : "border-border hover:border-blue-500/50"
          )}
        >
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-1 drop-shadow-sm">{submittedCount}</p>
          <p className="text-sm font-bold text-muted-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">المهام المُسلَّمة</p>
        </button>

        <button
          onClick={() => setFilter('graded')}
          className={cn(
            "relative overflow-hidden bg-card/60 backdrop-blur-md rounded-2xl border p-5 text-start transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
            filter === 'graded' ? "border-emerald-500 shadow-md ring-1 ring-emerald-500" : "border-border hover:border-emerald-500/50"
          )}
        >
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-1 drop-shadow-sm">{gradedCount}</p>
          <p className="text-sm font-bold text-muted-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">المهام المُقيَّمة</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-card/30 p-1.5 rounded-xl border border-border w-max">
        {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
              filter === f
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f === 'all' && 'كل المهام'}
            {f === 'pending' && 'المعلقة'}
            {f === 'submitted' && 'المسلمة'}
            {f === 'graded' && 'المقيمة'}
          </button>
        ))}
      </div>

      {/* Tasks Grid/List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-card/30 backdrop-blur-sm rounded-2xl border border-dashed border-border">
          <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">
            لا توجد مهام
          </h3>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto">
            {filter === 'all' 
              ? 'أنت على أتم الاستعداد! لم يتم تعيين مهام جديدة لك بعد.'
              : 'لا توجد مهام تطابق هذا التصنيف حالياً.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTasks.map((task) => {
            const kind = normalizeTaskType(task.type)
            const TypeIcon = typeIcons[kind]
            const dueStatus = getDueStatus(task.due_date)
            const isDoneOrGraded = task.status === 'submitted' || task.status === 'graded'
            const canSelfMark = task.status === 'pending' || task.status === 'late' || task.status === 'submitted'
            const conf = statusConfig[task.status]

            return (
              <div
                key={task.id}
                className={cn(
                  "relative bg-card/60 backdrop-blur-sm rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg group flex flex-col h-full overflow-hidden",
                  "hover:border-primary/40",
                  task.status === 'late' && "border-red-500/30"
                )}
              >
                {/* Status Indicator Line */}
                <div className={cn(
                  "absolute top-0 right-0 w-full h-1 opacity-50 group-hover:opacity-100 transition-opacity",
                  task.status === 'graded' ? "bg-emerald-500" :
                  task.status === 'submitted' ? "bg-blue-500" :
                  task.status === 'late' ? "bg-red-500" : "bg-amber-500"
                )} />

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      kind === 'memorization' && "bg-green-500 text-white",
                      kind === 'recitation' && "bg-blue-500 text-white",
                      kind === 'written' && "bg-purple-500 text-white",
                      kind === 'quiz' && "bg-orange-500 text-white",
                      kind === 'project' && "bg-teal-500 text-white",
                      kind === 'media' && "bg-rose-500 text-white"
                    )}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        conf.color
                      )}>
                        <conf.icon className="w-3.5 h-3.5" />
                        {conf.label}
                      </span>
                    </div>
                  </div>

                  {canSelfMark && task.status !== 'graded' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleMarkDone(task.id, task.status)
                      }}
                      disabled={marking === task.id}
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0 border",
                        isDoneOrGraded
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-800"
                          : "bg-muted text-muted-foreground border-border hover:bg-emerald-500 hover:text-white hover:border-emerald-600"
                      )}
                      title={isDoneOrGraded ? 'تراجع عن الإنجاز' : 'تأشير كمنجز'}
                    >
                      {marking === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-0 mb-4">
                  <Link href={`/academy/student/tasks/${task.id}/submit`} className="block group-hover:text-primary transition-colors">
                    <h3 className="text-lg font-black text-foreground truncate mb-1">
                      {task.title}
                    </h3>
                  </Link>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    {task.course_title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Footer Metrics */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                      <Star className="w-4 h-4 fill-amber-500/20" />
                      {task.points_value} نقطة
                    </span>
                    
                    {dueStatus && (
                      <span className={cn(
                        "flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md",
                        dueStatus.veryUrgent ? "text-red-600 bg-red-500/10" :
                        dueStatus.urgent ? "text-amber-600 bg-amber-500/10" :
                        "text-muted-foreground bg-muted"
                      )}>
                        <Clock className="w-3.5 h-3.5" />
                        {dueStatus.text}
                      </span>
                    )}
                  </div>

                  <Link 
                    href={`/academy/student/tasks/${task.id}/submit`}
                    className={cn(
                      "text-sm font-bold px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2",
                      isDoneOrGraded 
                        ? "bg-muted hover:bg-muted/80 text-foreground" 
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {isDoneOrGraded ? 'عرض التفاصيل' : 'ابدأ المهمة'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

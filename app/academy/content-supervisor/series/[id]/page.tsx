'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, Clock, CheckCircle, XCircle, Library,
  User, FileText, Loader2, Mail, BookOpen, Route as RouteIcon,
  ShieldAlert, Sparkles, Layers
} from 'lucide-react'

interface SeriesItem {
  id: string
  item_type: 'course' | 'path'
  order_index: number
  course_title: string | null
  path_title: string | null
}

interface Series {
  id: string
  title: string
  description: string | null
  subject: string | null
  status: string
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_for_review_at: string | null
  created_at: string
  teacher_id: string | null
  teacher_name: string | null
  teacher_email: string | null
  teacher_avatar: string | null
  reviewer_name: string | null
  items: SeriesItem[]
}

export default function SeriesReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    fetch(`/api/academy/supervisor/series/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.series) {
          setSeries(d.series)
          setNotes(d.series.rejection_reason || '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleReview(action: 'approve' | 'reject') {
    if (action === 'reject' && !notes.trim()) {
      toast.error('يجب كتابة سبب الرفض')
      return
    }
    setSubmitting(action)
    try {
      const res = await fetch(`/api/academy/supervisor/series/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(action === 'approve' ? 'تم اعتماد السلسلة ونشرها' : 'تم رفض السلسلة')
        router.push('/academy/content-supervisor/series')
      } else {
        toast.error(data.error || 'حدث خطأ')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
        <ShieldAlert className="w-16 h-16 text-rose-500/50 mb-4" />
        <p className="text-xl font-bold text-foreground mb-2">السلسلة غير موجودة</p>
        <p className="text-muted-foreground text-sm mb-6">قد تكون تم حذفها أو ليس لديك صلاحية للوصول إليها.</p>
        <Link href="/academy/content-supervisor/series" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة إلى القائمة
        </Link>
      </div>
    )
  }

  const isPending = series.status === 'pending_review'

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/academy/content-supervisor/series"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors bg-card hover:bg-muted border border-border/50 px-4 py-2 rounded-xl shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى السلاسل
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {series.subject && (
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/10">
                  {series.subject}
                </span>
              )}
              <StatusBadge status={series.status} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
              {series.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <strong className="text-foreground">{series.items.length}</strong> عنصر
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                رُفعت للمراجعة في {new Date(series.submitted_for_review_at || series.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Teacher Info Card-let */}
          {series.teacher_name && (
            <div className="shrink-0 flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20 shadow-sm">
                {series.teacher_avatar ? (
                  <img src={series.teacher_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">المعلم</p>
                <p className="font-bold text-foreground text-sm">{series.teacher_name}</p>
                {series.teacher_email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" />
                    {series.teacher_email}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Description */}
        {series.description && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              وصف السلسلة والأهداف
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {series.description}
              </p>
            </div>
          </div>
        )}

        {/* Series Items */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="font-bold text-foreground mb-6 flex items-center gap-2 text-lg">
            <Library className="w-5 h-5 text-blue-500" />
            عناصر السلسلة ({series.items.length} عنصر)
          </h2>
          
          {series.items.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-xl border border-border/50 border-dashed">
              <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد عناصر في هذه السلسلة بعد.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {series.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-background border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors shadow-sm group"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary text-sm font-bold flex items-center justify-center border border-primary/20">
                    {idx + 1}
                  </div>
                  
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    {item.item_type === 'course' ? (
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <RouteIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {item.course_title || item.path_title || 'عنصر غير معروف'}
                    </p>
                  </div>
                  
                  <div className="shrink-0">
                    <span className="inline-flex items-center px-2 py-1 bg-muted rounded border border-border/50 text-xs font-medium text-muted-foreground">
                      {item.item_type === 'course' ? 'دورة' : 'مسار'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Section */}
      <div className={`rounded-3xl p-6 md:p-8 shadow-sm border-2 ${isPending ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/50'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-foreground flex items-center gap-2 text-xl">
            {isPending ? (
              <>
                <Sparkles className="w-6 h-6 text-primary" />
                قرار المراجعة للسلسلة
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-muted-foreground" />
                سجل المراجعة
              </>
            )}
          </h2>
          
          {!isPending && series.reviewer_name && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-1.5 rounded-lg border border-border/50">
              <User className="w-3 h-3 text-muted-foreground" />
              المراجع: {series.reviewer_name}
              {series.reviewed_at && <span className="text-muted-foreground ml-1">({new Date(series.reviewed_at).toLocaleDateString('ar-EG')})</span>}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات / أسباب الرفض</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isPending}
              placeholder={isPending ? "أضف أسباب الرفض أو ملاحظاتك على السلسلة... (مطلوبة عند الرفض وتظهر للمعلم)" : "لا توجد ملاحظات."}
              rows={4}
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none disabled:opacity-70 disabled:bg-muted/50 transition-all shadow-sm"
            />
          </div>

          {isPending && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleReview('approve')}
                disabled={submitting !== null}
                className="flex-1 group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
              >
                {submitting === 'approve' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                اعتماد ونشر
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
              
              <button
                type="button"
                onClick={() => handleReview('reject')}
                disabled={submitting !== null}
                className="flex-1 group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
              >
                {submitting === 'reject' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                رفض السلسلة
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string; icon: any }> = {
    pending_review: { label: 'بانتظار المراجعة', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400', icon: Clock },
    published:      { label: 'منشورة',          cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
    approved:       { label: 'معتمدة',          cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
    rejected:       { label: 'مرفوضة',          cls: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400', icon: XCircle },
    draft:          { label: 'مسودة',          cls: 'bg-muted text-muted-foreground border-border/50', icon: Library },
  }
  const c = config[status] || config.draft
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-sm ${c.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {c.label}
    </span>
  )
}

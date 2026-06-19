'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, GraduationCap, Clock, CheckCircle, XCircle,
  Loader2, AlertCircle, User, BookMarked, Timer, Sparkles, FileText, Send
} from 'lucide-react'

interface PathDetail {
  id: string
  title: string
  description: string | null
  subject: string | null
  level: string | null
  estimated_hours: number | null
  status: string
  is_published: boolean
  rejection_reason: string | null
  submitted_for_review_at: string | null
  reviewed_at: string | null
  created_at: string
  creator_name: string | null
  creator_avatar: string | null
  creator_email: string | null
  reviewer_name: string | null
}

export default function AcademyPathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [path, setPath] = useState<PathDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/academy/supervisor/academy-paths/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setPath(d.data))
      .catch(() => setError('تعذّر تحميل بيانات المسار'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAction(action: 'approve' | 'reject') {
    if (action === 'reject' && !notes.trim()) {
      setError('يرجى كتابة سبب الرفض')
      return
    }
    setSubmitting(action)
    setError(null)
    try {
      const res = await fetch(`/api/academy/supervisor/academy-paths/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'فشل الإجراء')
      }
      setDone(true)
    } catch (e: any) {
      setError(e.message)
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

  if (!path) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
        <AlertCircle className="w-16 h-16 text-rose-500/50 mb-4" />
        <p className="text-xl font-bold text-foreground mb-2">المسار غير موجود</p>
        <p className="text-muted-foreground text-sm mb-6">قد يكون تم حذفه أو ليس لديك صلاحية للوصول إليه.</p>
        <Link href="/academy/content-supervisor/academy-paths" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة إلى القائمة
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="bg-card border border-border/50 rounded-3xl p-16 text-center space-y-6 max-w-lg mx-auto shadow-sm animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground mb-2">تم تنفيذ الإجراء بنجاح</h2>
          <p className="text-muted-foreground">تم {submitting === 'approve' ? 'اعتماد المسار ونشره' : 'رفض المسار'} بنجاح.</p>
        </div>
        <button
          onClick={() => router.push('/academy/content-supervisor/academy-paths')}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة المسارات
        </button>
      </div>
    )
  }

  const isPending = path.status === 'pending_review'

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors bg-card hover:bg-muted border border-border/50 px-4 py-2 rounded-xl shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى المسارات
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {path.subject && (
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/10">
                  {path.subject}
                </span>
              )}
              <StatusBadge status={path.status} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
              {path.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              {path.estimated_hours ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4" />
                    المدة: <strong className="text-foreground">{path.estimated_hours}</strong> ساعة
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                </>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                رُفع للمراجعة في {new Date(path.submitted_for_review_at || path.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Teacher Info Card-let */}
          {path.creator_name && (
            <div className="shrink-0 flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20 shadow-sm">
                {path.creator_avatar ? (
                  <img src={path.creator_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">المعلم المرفق</p>
                <p className="font-bold text-foreground text-sm">{path.creator_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description Grid */}
      <div className="grid grid-cols-1 gap-6">
        {path.description && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              الوصف والأهداف
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {path.description}
              </p>
            </div>
          </div>
        )}

        {/* Previous Rejection Info */}
        {path.status === 'rejected' && path.rejection_reason && (
          <div className="flex items-start gap-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 shadow-sm animate-in slide-in-from-bottom-4">
            <div className="p-2 bg-rose-500/20 rounded-xl shrink-0 mt-0.5">
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-500" />
            </div>
            <div>
              <p className="font-bold text-lg text-rose-900 dark:text-rose-400 mb-1">سبب الرفض السابق</p>
              <p className="text-sm text-rose-800/80 dark:text-rose-500/80 leading-relaxed whitespace-pre-wrap">
                {path.rejection_reason}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className={`rounded-3xl p-6 md:p-8 shadow-sm border-2 ${isPending ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/50'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-foreground flex items-center gap-2 text-xl">
            {isPending ? (
              <>
                <Sparkles className="w-6 h-6 text-primary" />
                قرار المراجعة للمسار
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-muted-foreground" />
                سجل المراجعة
              </>
            )}
          </h2>
          
          {!isPending && path.reviewer_name && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-1.5 rounded-lg border border-border/50">
              <User className="w-3 h-3 text-muted-foreground" />
              المراجع: {path.reviewer_name}
              {path.reviewed_at && <span className="text-muted-foreground ml-1">({new Date(path.reviewed_at).toLocaleDateString('ar-EG')})</span>}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">ملاحظات / أسباب الرفض</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isPending}
              placeholder={isPending ? "أضف أسباب الرفض (مطلوبة عند الرفض) أو ملاحظات إيجابية للمسار (اختياري)..." : "لا توجد ملاحظات."}
              rows={4}
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none disabled:opacity-70 disabled:bg-muted/50 transition-all shadow-sm"
            />
          </div>

          {isPending && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleAction('approve')}
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
                onClick={() => handleAction('reject')}
                disabled={submitting !== null}
                className="flex-1 group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
              >
                {submitting === 'reject' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                رفض المسار
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
    published:      { label: 'منشور',          cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
    approved:       { label: 'معتمد',          cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
    rejected:       { label: 'مرفوض',          cls: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400', icon: XCircle },
    draft:          { label: 'مسودة',          cls: 'bg-muted text-muted-foreground border-border/50', icon: BookMarked },
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

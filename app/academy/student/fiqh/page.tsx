'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  HelpCircle,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

interface FiqhQuestion {
  id: string
  question: string
  category: string
  answer: string | null
  answered_by: string | null
  answered_by_name: string | null
  is_published: boolean
  created_at: string
  answered_at: string | null
}

const CATEGORIES = [
  { id: 'tajweed', ar: 'أحكام التجويد', en: 'Tajweed Rulings' },
  { id: 'salah', ar: 'الصلاة', en: 'Prayer' },
  { id: 'tahara', ar: 'الطهارة', en: 'Purity' },
  { id: 'sawm', ar: 'الصيام', en: 'Fasting' },
  { id: 'zakah', ar: 'الزكاة', en: 'Zakah' },
  { id: 'hajj', ar: 'الحج والعمرة', en: 'Hajj & Umrah' },
  { id: 'quran', ar: 'علوم القرآن', en: 'Quranic Sciences' },
  { id: 'aqeedah', ar: 'العقيدة', en: 'Aqeedah' },
  { id: 'general', ar: 'عام', en: 'General' },
]

export default function StudentFiqhPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [questions, setQuestions] = useState<FiqhQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all')
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [creating, setCreating] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/academy/student/fiqh')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      // The API returns the questions array directly
      setQuestions(Array.isArray(data) ? data : data.questions || [])
    } catch (err) {
      console.error('[fiqh] fetch failed:', err)
      const msg = err instanceof Error ? err.message : 'Failed to load questions'
      setLoadError(msg)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newQuestion.trim()) return
    setSubmitError(null)
    setCreating(true)
    try {
      const res = await fetch('/api/academy/student/fiqh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion.trim(), category: newCategory }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(
          data?.error || t.studentPages?.fiqh?.errorSubmit,
        )
        return
      }
      setIsCreateOpen(false)
      setNewQuestion('')
      setNewCategory('general')
      fetchQuestions()
    } catch (err) {
      console.error('[fiqh] submit failed:', err)
      setSubmitError(t.studentPages?.fiqh?.errorUnexpected)
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const categoryLabel = (id: string) => {
    return t.studentPages?.fiqh?.categories?.[id] || id
  }

  const filtered = questions.filter((q) => {
    if (filter === 'all') return true
    if (filter === 'pending') return !q.answer
    if (filter === 'answered') return !!q.answer
    return true
  })

  const pendingCount = questions.filter((q) => !q.answer).length
  const answeredCount = questions.filter((q) => !!q.answer).length

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="w-8 h-8 text-primary" />
            {t.studentPages?.fiqh?.title}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t.studentPages?.fiqh?.desc}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          {t.studentPages?.fiqh?.newQuestionBtn}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'bg-card rounded-xl border p-4 text-center transition-all',
            filter === 'all'
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50',
          )}
        >
          <p className="text-2xl font-bold text-foreground">{questions.length}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t.studentPages?.fiqh?.allQuestions}
          </p>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={cn(
            'bg-card rounded-xl border p-4 text-center transition-all',
            filter === 'pending'
              ? 'border-yellow-500 ring-2 ring-yellow-500/20'
              : 'border-border hover:border-yellow-500/50',
          )}
        >
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t.studentPages?.fiqh?.pendingResponse}
          </p>
        </button>
        <button
          onClick={() => setFilter('answered')}
          className={cn(
            'bg-card rounded-xl border p-4 text-center transition-all',
            filter === 'answered'
              ? 'border-green-500 ring-2 ring-green-500/20'
              : 'border-border hover:border-green-500/50',
          )}
        >
          <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t.studentPages?.fiqh?.answered}
          </p>
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {loadError && (
          <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-900/20">
            <CardContent className="flex items-start gap-3 p-4">
              <HelpCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-700 dark:text-red-400">
                  {t.studentPages?.fiqh?.loadError}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{loadError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchQuestions}
                className="flex-shrink-0"
              >
                {t.studentPages?.fiqh?.retry}
              </Button>
            </CardContent>
          </Card>
        )}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-muted rounded-md" />
                    <div className="h-5 w-20 bg-muted rounded-md" />
                  </div>
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-foreground mb-1">
                {filter === 'all'
                  ? t.studentPages?.fiqh?.noQuestionsYet
                  : filter === 'pending'
                    ? t.studentPages?.fiqh?.noPendingQuestions
                    : t.studentPages?.fiqh?.noAnsweredQuestions}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.studentPages?.fiqh?.startAskingFirst}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((q) => (
            <Card
              key={q.id}
              className={cn(
                'transition-all border-border',
                q.answer
                  ? 'shadow-sm'
                  : 'border-yellow-500/30 bg-yellow-50/40 dark:bg-yellow-900/10',
              )}
            >
              <CardContent className="p-4 sm:p-5 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
                      {categoryLabel(q.category)}
                    </span>
                    {q.answer ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-md font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.studentPages?.fiqh?.statusAnswered}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-md font-bold">
                        <Clock className="w-3 h-3" />
                        {t.studentPages?.fiqh?.statusPending}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(q.created_at)}
                  </span>
                </div>

                {/* Question */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-bold">
                    {t.studentPages?.fiqh?.questionLabel}
                  </p>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {q.question}
                  </p>
                </div>

                {/* Answer */}
                {q.answer && (
                  <div className="border-t border-border pt-3 mt-2">
                    <p className="text-sm text-muted-foreground mb-1 font-bold flex items-center gap-1 flex-wrap">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {t.studentPages?.fiqh?.answerLabel}
                      {q.answered_by_name && (
                        <span className="text-xs font-medium text-foreground/70">
                          ({q.answered_by_name})
                        </span>
                      )}
                    </p>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {q.answer}
                    </p>
                    {q.answered_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(q.answered_at)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card">
          <DialogHeader>
            <DialogTitle>
              {t.studentPages?.fiqh?.dialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">
                {t.studentPages?.fiqh?.categoryLabel}
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border-border bg-card p-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(c.id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-foreground">
                {t.studentPages?.fiqh?.yourQuestionLabel}
              </label>
              <Textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows={6}
                placeholder={t.studentPages?.fiqh?.textareaPlaceholder}
                className="resize-none"
              />
            </div>
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
                {submitError}
              </p>
            )}
          </div>
          <DialogFooter className="flex-row-reverse sm:justify-start gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!newQuestion.trim() || creating}
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t.studentPages?.fiqh?.submitBtn
              )}
            </Button>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              {t.studentPages?.fiqh?.cancelBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

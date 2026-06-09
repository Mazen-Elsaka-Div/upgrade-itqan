'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Play, CheckCircle, Clock, Star, Send, Trophy, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import MediaViewer from '@/components/media-viewer'

interface Competition {
  id: string
  title: string
  type: string
  status: string
  tajweed_rules: string[] | null
}

interface Entry {
  id: string
  student_name: string
  student_email: string
  submission_url: string | null
  notes: string | null
  score: number | null
  status: string
  feedback: string | null
  tajweed_scores: Record<string, number>
  verses_count: number
  submitted_at: string
  evaluated_at: string | null
  evaluator_name: string | null
}

const TAJWEED_RULES = [
  { key: 'idgham', label: 'الإدغام' },
  { key: 'ikhfa', label: 'الإخفاء' },
  { key: 'iqlab', label: 'الإقلاب' },
  { key: 'izhar', label: 'الإظهار' },
  { key: 'madd', label: 'المدود' },
  { key: 'qalqala', label: 'القلقلة' },
  { key: 'ghunna', label: 'الغنة' },
  { key: 'tafkhim_tarqiq', label: 'التفخيم والترقيق' },
  { key: 'waqf', label: 'الوقف والابتداء' },
  { key: 'makharij', label: 'مخارج الحروف' },
]

export default function ReaderCompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [evalForm, setEvalForm] = useState<{
    score: number
    tajweed_scores: Record<string, number>
    feedback: string
  }>({ score: 0, tajweed_scores: {}, feedback: '' })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('all')

  const loadData = async () => {
    try {
      const res = await fetch(`/api/reader/competitions/${id}/entries`)
      if (res.ok) {
        const json = await res.json()
        setCompetition(json.competition || null)
        setEntries(json.entries || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  const startEvaluate = (entry: Entry) => {
    setEvaluatingId(entry.id)
    const initialScores: Record<string, number> = {}
    const rules = competition?.tajweed_rules || TAJWEED_RULES.map(r => r.key)
    rules.forEach(r => { initialScores[r] = entry.tajweed_scores?.[r] || 0 })
    setEvalForm({
      score: entry.score || 0,
      tajweed_scores: competition?.type === 'tajweed' ? initialScores : {},
      feedback: entry.feedback || '',
    })
  }

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evaluatingId) return
    setSubmitting(true)
    try {
      let finalScore = evalForm.score
      if (competition?.type === 'tajweed' && Object.keys(evalForm.tajweed_scores).length > 0) {
        const values = Object.values(evalForm.tajweed_scores)
        finalScore = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : 0
      }

      const res = await fetch(`/api/reader/competitions/entries/${evaluatingId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalScore,
          tajweed_scores: evalForm.tajweed_scores,
          feedback: evalForm.feedback,
        }),
      })

      if (res.ok) {
        setEvaluatingId(null)
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || 'حدث خطأ')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredEntries = entries.filter(e => {
    if (filter === 'pending') return e.status === 'pending' && e.submission_url
    if (filter === 'evaluated') return e.status !== 'pending'
    return true
  })

  const pendingCount = entries.filter(e => e.status === 'pending' && e.submission_url).length
  const evaluatedCount = entries.filter(e => e.status !== 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="text-center py-16">
        return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back */}
      <Link href="/reader/competitions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowRight className="w-4 h-4" />
        العودة للمسابقات
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{competition.title}</h1>
          <p className="text-muted-foreground mt-2">مراجعة وتقييم مشاركات الطلاب في هذه المسابقة.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center bg-card border border-border/50 shadow-sm rounded-xl px-6 py-3 min-w-[120px]">
            <span className="text-3xl font-bold text-amber-600 dark:text-amber-500">{pendingCount}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1">بانتظار التقييم</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-card border border-border/50 shadow-sm rounded-xl px-6 py-3 min-w-[120px]">
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{evaluatedCount}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1">تم التقييم</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="inline-flex items-center p-1 bg-muted/50 rounded-lg border border-border/50">
        {(['all', 'pending', 'evaluated'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-medium transition-all duration-200",
              filter === f 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {f === 'all' ? `الكل (${entries.length})` : f === 'pending' ? `بانتظار (${pendingCount})` : `تم التقييم (${evaluatedCount})`}
          </button>
        ))}
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card/50 border border-dashed border-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">لا توجد مشاركات</h3>
          <p className="text-muted-foreground text-sm">
            {filter === 'pending' ? 'لا توجد مشاركات بانتظار التقييم حالياً.' : 'لم يتم العثور على أي مشاركات تطابق بحثك.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-card border border-border/50 rounded-xl p-6 shadow-sm transition-colors hover:border-primary/20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-foreground">{entry.student_name}</h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                        entry.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' :
                        entry.status === 'winner' ? 'bg-yellow-50 text-yellow-700 border-yellow-200/50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                      )}>
                        {entry.status === 'pending' ? 'قيد التقييم' : entry.status === 'winner' ? 'فائز 🏆' : 'تم التقييم'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.student_email}</p>
                  </div>

                  {entry.submission_url && (
                    <div className="max-w-md rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                      <MediaViewer url={entry.submission_url} />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {entry.verses_count > 0 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-medium text-foreground">عدد الآيات:</span> {entry.verses_count}
                      </div>
                    )}
                    {entry.notes && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-medium text-foreground">ملاحظات:</span> {entry.notes}
                      </div>
                    )}
                  </div>

                  {entry.score !== null && (
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">الدرجة النهائية:</span>
                          <span className="text-xl font-bold text-primary">{entry.score}</span>
                          <span className="text-sm text-muted-foreground">/ 100</span>
                        </div>
                        {entry.evaluator_name && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            المُقيّم: {entry.evaluator_name}
                          </span>
                        )}
                      </div>
                      {entry.feedback && (
                        <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/50">
                          <span className="font-medium text-foreground block mb-1">الملاحظات:</span>
                          {entry.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:pl-4 md:border-l border-border/50 flex flex-col gap-2 min-w-[140px]">
                  {entry.submission_url && (
                    <button
                      onClick={() => startEvaluate(entry)}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                        entry.status === 'pending' 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {entry.status === 'pending' ? 'بدء التقييم' : 'تعديل التقييم'}
                    </button>
                  )}
                </div>
              </div>

              {/* Evaluation Form */}
              {evaluatingId === entry.id && (
                <form onSubmit={handleEvaluate} className="mt-6 pt-6 border-t border-border space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-foreground">نموذج التقييم</h4>
                  </div>
                  
                  {competition.type === 'tajweed' ? (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground">تقييم أحكام التجويد (من 10)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(competition.tajweed_rules || TAJWEED_RULES.map(r => r.key)).map(ruleKey => {
                          const ruleLabel = TAJWEED_RULES.find(r => r.key === ruleKey)?.label || ruleKey
                          return (
                            <div key={ruleKey} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors">
                              <label className="text-sm font-medium text-muted-foreground">{ruleLabel}</label>
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.5}
                                value={evalForm.tajweed_scores[ruleKey] || 0}
                                onChange={e => setEvalForm(prev => ({
                                  ...prev,
                                  tajweed_scores: { ...prev.tajweed_scores, [ruleKey]: parseFloat(e.target.value) || 0 },
                                }))}
                                className="w-16 px-2 py-1 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center transition-all"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-xs">
                      <label className="block text-sm font-semibold text-foreground">الدرجة النهائية (من 100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={evalForm.score}
                        onChange={e => setEvalForm(prev => ({ ...prev, score: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg font-medium"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">الملاحظات التوجيهية للطالب</label>
                    <textarea
                      value={evalForm.feedback}
                      onChange={e => setEvalForm(prev => ({ ...prev, feedback: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="أضف ملاحظاتك البناءة للطالب هنا..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEvaluatingId(null)}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center min-w-[120px] px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
                      حفظ التقييم
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}=> setEvaluatingId(null)}
                      className="px-4 py-2.5 bg-muted text-foreground rounded-xl font-bold transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

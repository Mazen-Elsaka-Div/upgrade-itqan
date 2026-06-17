'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import {
  MessageSquare, Plus, Trash2, Edit2, CheckCircle, X, Loader2, Clock,
  Search, Filter, User as UserIcon, Eye, EyeOff, Settings, ShieldCheck, FileText,
} from 'lucide-react'
import { FiqhFormSettingsModal } from '@/components/academy/fiqh-form-settings-modal'
import { useI18n } from '@/lib/i18n/context'

interface FiqhQuestion {
  id: string
  title?: string | null
  question: string
  answer: string | null
  category: string
  category_slug?: string | null
  category_name_ar?: string | null
  status?: string
  is_published: boolean
  is_anonymous?: boolean
  views_count?: number
  asked_at: string
  answered_at: string | null
  asker_name?: string | null
  asker_avatar?: string | null
  assigned_to_name?: string | null
  answerer_name?: string | null
  extra_data?: Record<string, any>
}

interface CountMap {
  all: number
  pending: number
  answered: number
  awaiting_consent: number
  published: number
  closed: number
}

interface Category {
  id: string
  slug: string
  name_ar: string
  name_en: string | null
}

type TabKey = 'pending' | 'answered' | 'awaiting_consent' | 'published' | 'closed' | 'all'

const emptyForm = { question: '', answer: '', category: '', is_published: false }

export default function AdminFiqhPage() {
  const { t, locale } = useI18n()
  const a = t.academyAdmin
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US'

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'pending',          label: a.fiqhPending },
    { key: 'awaiting_consent', label: a.fiqhAwaitingConsent },
    { key: 'answered',         label: a.fiqhAnswered },
    { key: 'published',        label: a.fiqhPublished },
    { key: 'closed',           label: a.fiqhClosed },
    { key: 'all',              label: a.fiqhAll },
  ]

  const [questions, setQuestions] = useState<FiqhQuestion[]>([])
  const [counts, setCounts] = useState<CountMap>({ all: 0, pending: 0, answered: 0, awaiting_consent: 0, published: 0, closed: 0 })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('pending')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editItem, setEditItem] = useState<FiqhQuestion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    fetch('/api/academy/fiqh/categories')
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: tab })
      if (categoryFilter) params.set('category', categoryFilter)
      if (searchDebounced) params.set('search', searchDebounced)
      const res = await fetch(`/api/academy/admin/fiqh?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.data || [])
        if (data.counts) setCounts({ all: 0, pending: 0, answered: 0, awaiting_consent: 0, published: 0, closed: 0, ...data.counts })
      }
    } catch (error) {
      console.error('Failed to fetch fiqh questions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuestions() }, [tab, categoryFilter, searchDebounced])

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (q: FiqhQuestion) => { setEditItem(q); setForm({ question: q.question, answer: q.answer || '', category: q.category || 'general', is_published: q.is_published || false }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.question) return
    setSaving(true)
    try {
      const url = editItem ? `/api/academy/admin/fiqh/${editItem.id}` : '/api/academy/admin/fiqh'
      const method = editItem ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setShowModal(false); fetchQuestions() }
      else { alert(a.fiqhSaveError) }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(a.fiqhDeleteConfirm)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/academy/admin/fiqh/${id}`, { method: 'DELETE' })
      if (res.ok) fetchQuestions()
      else alert(a.fiqhCannotDelete)
    } finally { setDeletingId(null) }
  }

  const handleTogglePublish = async (q: FiqhQuestion) => {
    if (!q.answer) { alert(a.fiqhCannotPublishWithoutAnswer); return }
    try {
      const res = await fetch(`/api/academy/admin/fiqh/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_published: !q.is_published }) })
      if (res.ok) fetchQuestions()
    } catch {}
  }

  const categoryLabel = (q: FiqhQuestion) => {
    if (q.category_name_ar) return q.category_name_ar
    const matched = categories.find((c) => c.slug === q.category || c.slug === q.category_slug)
    return matched?.name_ar || q.category || a.fiqhUncategorized
  }

  const formatDate = useMemo(() => (d: string) => new Date(d).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' }), [])

  const stats = [
    { key: 'pending',          label: a.fiqhPending,          value: counts.pending,          color: 'text-yellow-600' },
    { key: 'awaiting_consent', label: a.fiqhAwaitingConsent,   value: counts.awaiting_consent, color: 'text-orange-600' },
    { key: 'answered',         label: a.fiqhAnswered,          value: counts.answered,         color: 'text-blue-600'   },
    { key: 'published',        label: a.fiqhPublished,         value: counts.published,        color: 'text-green-600'  },
    { key: 'closed',           label: a.fiqhClosed,            value: counts.closed,           color: 'text-muted-foreground'  },
    { key: 'all',              label: a.fiqhTotal,             value: counts.all,              color: 'text-foreground' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <MessageSquare className="w-7 h-7 text-teal-600" />{a.fiqhTitle}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{a.fiqhDesc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border hover:border-teal-300 text-foreground rounded-xl font-bold transition-colors shadow-sm">
            <Settings className="w-4 h-4" />{a.fiqhFormSettings}
          </button>
          <Link href="/academy/admin/fiqh/officers" className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border hover:border-teal-300 text-foreground rounded-xl font-bold transition-colors shadow-sm">
            <ShieldCheck className="w-4 h-4" />{a.fiqhOfficers}
          </Link>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors shadow-sm">
            <Plus className="w-5 h-5" />{a.fiqhAddQuestion}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(stat => (
          <div key={stat.key} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {TABS.map(tabDef => {
          const active = tab === tabDef.key
          const count = counts[tabDef.key]
          return (
            <button key={tabDef.key} onClick={() => setTab(tabDef.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${active ? 'bg-teal-600 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
              {tabDef.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-background text-foreground'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={a.fiqhSearchPlaceholder}
            className="w-full pr-10 pl-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div className="relative flex items-center gap-2">
          <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="pr-10 pl-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[160px]">
            <option value="">{a.fiqhAllCategories}</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name_ar}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      ) : questions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <MessageSquare className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium mb-4">
            {searchDebounced || categoryFilter ? a.fiqhNoResults : a.fiqhNoQuestions}
          </p>
          {!searchDebounced && !categoryFilter && (
            <button onClick={openAdd} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors">
              <Plus className="w-4 h-4 inline ml-1" /> {a.fiqhAddFirst}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => {
            const isExpanded = expandedId === q.id
            const hasAnswer = !!q.answer
            return (
              <div key={q.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full font-medium">{categoryLabel(q)}</span>
                      {!hasAnswer && <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {a.fiqhPending}</span>}
                      {hasAnswer && q.is_published && <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {a.fiqhPublished}</span>}
                      {hasAnswer && !q.is_published && <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium flex items-center gap-1"><EyeOff className="w-3 h-3" /> {a.fiqhAnswered} ({a.fiqhUnpublish})</span>}
                    </div>
                    <p className="font-bold text-foreground leading-relaxed mb-2">{q.question}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{q.is_anonymous ? a.fiqhAnonymous : (q.asker_name || a.fiqhUnknown)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(q.asked_at)}</span>
                      {q.assigned_to_name && <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-sky-600" />{a.fiqhAssigned} {q.assigned_to_name}</span>}
                      {q.answerer_name && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-600" />{a.fiqhAnsweredBy} {q.answerer_name}</span>}
                    </div>
                    {q.extra_data && Object.keys(q.extra_data).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Object.entries(q.extra_data).map(([k, v]) => {
                          if (v === null || v === '') return null
                          return <span key={k} className="text-xs px-2 py-1 bg-muted rounded-md text-foreground flex items-center gap-1 border border-border"><FileText className="w-3 h-3 text-muted-foreground" /><span className="font-bold opacity-70">{k}:</span> {String(v)}</span>
                        })}
                      </div>
                    )}
                    {hasAnswer && (
                      <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800/50">
                        <p className={`text-sm text-teal-900 dark:text-teal-200 whitespace-pre-line ${isExpanded ? '' : 'line-clamp-3'}`}>{q.answer}</p>
                        {q.answer && q.answer.length > 180 && (
                          <button onClick={() => setExpandedId(isExpanded ? null : q.id)} className="text-xs text-teal-700 dark:text-teal-400 font-bold mt-2 hover:underline">
                            {isExpanded ? a.fiqhShowLess : a.fiqhShowMore}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                    {hasAnswer && (
                      <button onClick={() => handleTogglePublish(q)} title={q.is_published ? a.fiqhUnpublish : a.fiqhPublish}
                        className={`p-2.5 rounded-lg transition-colors ${q.is_published ? 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600' : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600'}`}>
                        {q.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => openEdit(q)} title={hasAnswer ? a.fiqhEdit : a.fiqhAnswerQuestion}
                      className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} disabled={deletingId === q.id} title={a.fiqhDelete}
                      className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500 disabled:opacity-50">
                      {deletingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold text-foreground">{editItem ? a.fiqhEditAnswer : a.fiqhAddFiqhQuestion}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {editItem?.asker_name && (
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5" />{a.fiqhAsker}
                  <span className="font-bold text-foreground">{editItem.is_anonymous ? a.fiqhAnonymous : editItem.asker_name}</span>
                </div>
              )}
              <div>
                <label className="text-sm font-bold block mb-1.5 text-foreground">{a.fiqhQuestionLabel} <span className="text-red-500">*</span></label>
                <textarea required rows={3} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder={a.fiqhQuestionPlaceholder}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5 text-foreground">{a.fiqhCategoryLabel}</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">{a.fiqhSelectCategory}</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1.5 text-foreground">{a.fiqhAnswerLabel}</label>
                <textarea rows={6} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder={a.fiqhAnswerPlaceholder}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 accent-teal-600 rounded" />
                <div className="flex-1">
                  <span className="text-sm font-bold text-foreground block">{a.fiqhPublishToStudents}</span>
                  <span className="text-xs text-muted-foreground">{a.fiqhPublishNote}</span>
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg font-bold hover:bg-muted transition-colors text-foreground">{t.cancel}</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {editItem ? a.fiqhSaveChanges : a.fiqhAddQuestionButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showSettingsModal && <FiqhFormSettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  )
}

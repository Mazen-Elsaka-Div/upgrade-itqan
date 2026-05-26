"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  Video,
  Trash2,
  Edit2,
  X,
  Loader2,
  GraduationCap,
  Radio,
  CalendarClock,
  Search,
  Sparkles,
  Shield,
  BookOpen,
  ChevronLeft,
} from 'lucide-react'
import { GENDER_LABELS, type HalaqaPlatform } from '@/lib/halaqat'

export interface HalaqaItem {
  id: string
  name: string
  description: string | null
  teacher_id: string | null
  teacher_name: string | null
  gender: string
  max_students: number
  current_students: number
  meeting_link: string | null
  livekit_room_name: string | null
  is_active: boolean
  platform: HalaqaPlatform
  scheduled_at: string | null
  duration_minutes: number | null
  is_live: boolean
  created_at: string
}

interface TeacherOption { id: string; name: string }

export type HalaqatViewerRole = 'admin' | 'host' | 'student'

interface Props {
  platform: HalaqaPlatform
  role: HalaqatViewerRole
  basePath: string
  teachersEndpoint?: string
  scope?: 'mine' | 'enrolled' | 'all'
}

const PLATFORM_THEME: Record<HalaqaPlatform, {
  accent: string
  badge: string
  icon: React.ReactNode
  label: string
  sublabel: string
  empty: string
  cardHover: string
}> = {
  academy: {
    accent: 'from-indigo-600/10 via-violet-500/5 to-transparent border-indigo-500/20',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    icon: <GraduationCap className="w-8 h-8 text-indigo-600" />,
    label: 'حلقات الأكاديمية',
    sublabel: 'بيئة تعليمية متكاملة للمدرسين والطلاب',
    empty: 'لا توجد حلقات بعد — أنشئ أول حلقة وابدأ رحلتك التعليمية',
    cardHover: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
  },
  maqraa: {
    accent: 'from-emerald-600/10 via-teal-500/5 to-transparent border-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: <BookOpen className="w-8 h-8 text-emerald-600" />,
    label: 'حلقات المقرأة',
    sublabel: 'حلقات تحفيظ وتجويد القرآن الكريم بإشراف مباشر',
    empty: 'لا توجد حلقات بعد — أنشئ حلقة وابدأ التلقي مع الطلاب',
    cardHover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
  },
}

const emptyForm = {
  name: '',
  description: '',
  teacher_id: '',
  gender: 'both',
  max_students: 20,
  meeting_link: '',
  scheduled_at: '',
  duration_minutes: 60,
}

function formatRelativeFromNow(value: string | null): string | null {
  if (!value) return null
  try {
    const d = new Date(value)
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return null
  }
}

export function HalaqatList({
  platform,
  role,
  basePath,
  teachersEndpoint,
  scope,
}: Props) {
  const theme = PLATFORM_THEME[platform]
  const isAdminViewer = role === 'admin'
  const canEdit = role === 'admin' || role === 'host'

  const [halaqat, setHalaqat] = useState<HalaqaItem[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'live' | 'inactive'>('all')

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<HalaqaItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchData() {
    const params = new URLSearchParams({ platform })
    if (scope) params.set('scope', scope)
    try {
      const promises: Promise<Response>[] = [
        fetch(`/api/halaqat?${params.toString()}`),
      ]
      if (isAdminViewer && teachersEndpoint) {
        promises.push(fetch(teachersEndpoint))
      }
      const [halaqaRes, teachersRes] = await Promise.all(promises)
      if (halaqaRes.ok) {
        const json = await halaqaRes.json()
        setHalaqat(json.data || [])
      }
      if (teachersRes && teachersRes.ok) {
        const json = await teachersRes.json()
        const list = Array.isArray(json) ? json : json.data || []
        setTeachers(list.map((t: any) => ({ id: t.id, name: t.name })))
      }
    } catch (e) {
      console.error('Failed to fetch halaqat', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, scope])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return halaqat.filter((h) => {
      if (filter === 'live' && !h.is_live) return false
      if (filter === 'inactive' && h.is_active !== false) return false
      if (term) {
        return (
          h.name.toLowerCase().includes(term) ||
          (h.description || '').toLowerCase().includes(term) ||
          (h.teacher_name || '').toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [halaqat, search, filter])

  const liveCount = halaqat.filter((h) => h.is_live).length
  const totalStudents = halaqat.reduce((sum, h) => sum + (h.current_students || 0), 0)

  function openAdd() {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }
  function openEdit(h: HalaqaItem) {
    setEditItem(h)
    setForm({
      name: h.name,
      description: h.description || '',
      teacher_id: h.teacher_id || '',
      gender: h.gender || 'both',
      max_students: h.max_students || 20,
      meeting_link: h.meeting_link || '',
      scheduled_at: h.scheduled_at ? h.scheduled_at.slice(0, 16) : '',
      duration_minutes: h.duration_minutes || 60,
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editItem ? `/api/halaqat/${editItem.id}` : '/api/halaqat'
      const method = editItem ? 'PATCH' : 'POST'
      const body: any = {
        ...form,
        platform,
        max_students: Number(form.max_students),
        duration_minutes: Number(form.duration_minutes),
      }
      if (!body.teacher_id) body.teacher_id = undefined
      if (!body.scheduled_at) body.scheduled_at = undefined
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowModal(false)
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'تعذر الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف الحلقة وجميع بياناتها؟ لا يمكن التراجع.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/halaqat/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
      else alert('تعذر الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">جاري تحميل الحلقات...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Premium Header Container */}
      <div className={`relative overflow-hidden rounded-3xl border bg-card/60 backdrop-blur-xl shadow-sm`}>
        <div className={`absolute inset-0 bg-gradient-to-l ${theme.accent} pointer-events-none`} />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 z-10">
          <div className="flex items-center gap-5">
            <div className="shrink-0 p-3 rounded-2xl bg-background border border-border shadow-inner">
              {theme.icon}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 flex-wrap text-foreground drop-shadow-sm">
                {theme.label}
                {liveCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    {liveCount} مباشر
                  </span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1.5 font-medium">{theme.sublabel}</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={openAdd}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5" /> إضافة حلقة
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الحلقات" value={halaqat.length} icon={<Users className="w-5 h-5" />} colorClass="text-blue-600 bg-blue-500/10" />
        <StatCard label="حلقات مباشرة الآن" value={liveCount} icon={<Radio className="w-5 h-5 animate-pulse" />} colorClass="text-red-600 bg-red-500/10 border-red-500/20" />
        <StatCard label="إجمالي الطلاب" value={totalStudents} icon={<GraduationCap className="w-5 h-5" />} colorClass="text-purple-600 bg-purple-500/10" />
        <StatCard label="حلقات نشطة" value={halaqat.filter(h => h.is_active !== false).length} icon={<Sparkles className="w-5 h-5" />} colorClass="text-emerald-600 bg-emerald-500/10" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-card/50 backdrop-blur-md p-2 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الحلقة أو المدرس…"
            className="w-full pr-12 pl-4 py-3 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
          />
        </div>
        <div className="flex bg-muted/50 rounded-xl p-1 shrink-0 overflow-x-auto">
          {(['all', 'live', 'inactive'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                filter === k 
                  ? 'bg-background shadow-sm text-primary border border-border/50' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {k === 'all' ? 'جميع الحلقات' : k === 'live' ? 'مباشر فقط' : 'متوقفة'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="bg-card/40 backdrop-blur-sm border border-dashed border-border/60 rounded-3xl p-16 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-primary/40" />
          </div>
          <h3 className="font-black text-2xl mb-3 text-foreground drop-shadow-sm">لا توجد حلقات لعرضها</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-base">{theme.empty}</p>
          {canEdit && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-1"
            >
              <Plus className="w-5 h-5" /> أضف حلقتك الأولى
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <HalaqaCard
              key={h.id}
              halaqa={h}
              themeBadge={theme.badge}
              hoverEffect={theme.cardHover}
              basePath={basePath}
              role={role}
              onEdit={canEdit ? openEdit : undefined}
              onDelete={canEdit ? handleDelete : undefined}
              deleting={deletingId === h.id}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && canEdit && (
        <HalaqaFormModal
          editItem={editItem}
          form={form}
          setForm={setForm}
          teachers={teachers}
          saving={saving}
          isAdmin={isAdminViewer}
          platform={platform}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  colorClass: string
}) {
  return (
    <div className="group bg-card hover:bg-muted/30 border border-border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        <div className={`p-2.5 rounded-xl ${colorClass} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black">{value}</p>
    </div>
  )
}

function HalaqaCard({
  halaqa: h,
  themeBadge,
  hoverEffect,
  basePath,
  role,
  onEdit,
  onDelete,
  deleting,
}: {
  halaqa: HalaqaItem
  themeBadge: string
  hoverEffect: string
  basePath: string
  role: HalaqatViewerRole
  onEdit?: (h: HalaqaItem) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}) {
  const scheduled = formatRelativeFromNow(h.scheduled_at)
  return (
    <div className={`group relative bg-card border border-border rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl ${hoverEffect} overflow-hidden flex flex-col`}>
      {h.is_live && (
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-red-500 to-orange-500" />
      )}
      
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-xl leading-tight truncate group-hover:text-primary transition-colors">{h.name}</h3>
            {h.is_live && (
              <span className="shrink-0 flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </div>
          {h.teacher_name && (
            <p className="text-sm font-medium text-muted-foreground truncate flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary/60" />
              {h.teacher_name}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-bold border ${
            h.is_active !== false
              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
              : 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {h.is_active !== false ? 'نشطة' : 'متوقفة'}
        </span>
      </div>

      <div className="flex-1">
        {h.description ? (
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2 mb-5">{h.description}</p>
        ) : (
          <div className="mb-5" />
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <span className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${themeBadge}`}>
          {GENDER_LABELS[h.gender] || 'مختلط'}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-secondary/70 text-secondary-foreground border border-border/50">
          <Users className="w-3.5 h-3.5 opacity-70" /> 
          <span dir="ltr">{h.current_students} / {h.max_students}</span>
        </span>
        {scheduled && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-secondary/70 text-secondary-foreground border border-border/50">
            <CalendarClock className="w-3.5 h-3.5 opacity-70" /> {scheduled}
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-border/50">
        <Link
          href={`${basePath}/${h.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl text-sm font-bold transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          {role === 'student' ? 'عرض الحلقة' : 'إدارة ومتابعة'}
        </Link>
        <Link
          href={`${basePath}/${h.id}/live`}
          className={`inline-flex items-center justify-center p-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            h.is_live
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 animate-pulse'
              : 'bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-500/20 dark:text-emerald-400'
          }`}
          title={h.is_live ? 'انضم للبث المباشر (تعمل الآن)' : 'دخول غرفة البث'}
        >
          <Video className="w-5 h-5" />
        </Link>
        {onEdit && (
          <button
            onClick={() => onEdit(h)}
            className="inline-flex items-center justify-center p-2.5 rounded-xl text-sm border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="تعديل الحلقة"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(h.id)}
            disabled={deleting}
            className="inline-flex items-center justify-center p-2.5 rounded-xl text-sm border border-red-200 dark:border-red-500/20 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            title="حذف الحلقة"
          >
            {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  )
}

function HalaqaFormModal({
  editItem,
  form,
  setForm,
  teachers,
  saving,
  isAdmin,
  platform,
  onClose,
  onSubmit,
}: {
  editItem: HalaqaItem | null
  form: typeof emptyForm
  setForm: (f: typeof emptyForm) => void
  teachers: TeacherOption[]
  saving: boolean
  isAdmin: boolean
  platform: HalaqaPlatform
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
          <h3 className="text-xl font-black flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Shield className="w-5 h-5" />
            </div>
            {editItem ? 'تعديل تفاصيل الحلقة' : 'إنشاء حلقة جديدة'}
          </h3>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-background rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <Field label="اسم الحلقة" required>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={platform === 'maqraa' ? 'حلقة تجويد الجزء الأول...' : 'حلقة السيرة النبوية...'}
              className="input-modern"
            />
          </Field>
          
          <Field label="الوصف">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="تفاصيل عن أهداف الحلقة، الجمهور المستهدف..."
              className="input-modern resize-none"
            />
          </Field>

          {isAdmin && teachers.length > 0 && (
            <Field label="المدرس / المشرف">
              <select
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                className="input-modern"
              >
                <option value="">-- اختر مدرساً من القائمة --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-5">
            <Field label="الجنس">
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input-modern"
              >
                <option value="both">مختلط (للجميع)</option>
                <option value="male">ذكور فقط</option>
                <option value="female">إناث فقط</option>
              </select>
            </Field>
            <Field label="الحد الأقصى للطلاب">
              <input
                type="number"
                min={1}
                max={500}
                value={form.max_students}
                onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })}
                className="input-modern"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="موعد البدء (اختياري)">
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="input-modern"
              />
            </Field>
            <Field label="المدة المتوقعة (بالدقائق)">
              <input
                type="number"
                min={5}
                max={360}
                step={5}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="input-modern"
              />
            </Field>
          </div>

          <Field label="رابط بث خارجي (اختياري)">
            <input
              type="url"
              value={form.meeting_link}
              onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
              placeholder="https://zoom.us/j/..."
              className="input-modern"
            />
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              يُستخدم نظام <b>LiveKit</b> المدمج للبث التفاعلي افتراضياً، اترك هذا الحقل فارغاً إلا إذا كنت ستستخدم رابطاً خارجياً.
            </p>
          </Field>
        </form>

        <div className="p-6 border-t border-border/50 bg-muted/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-background hover:bg-muted border border-border rounded-xl font-bold transition-colors"
          >
            إلغاء الأمر
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/25 inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {editItem ? 'حفظ التعديلات' : 'تأكيد الإنشاء'}
          </button>
        </div>
      </div>
      <style jsx>{`
        :global(.input-modern) {
          width: 100%;
          padding: 0.75rem 1rem;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border) / 0.8);
          border-radius: 0.75rem;
          outline: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        :global(.input-modern:focus) {
          border-color: hsl(var(--primary) / 0.5);
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1);
        }
        :global(.input-modern::placeholder) {
          color: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-bold text-foreground/90 block mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

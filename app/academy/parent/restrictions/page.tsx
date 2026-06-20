'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '@/lib/i18n/context'
import { BookOpen, Loader2, Route, Save, Shield } from 'lucide-react'
import { RestrictionsSkeleton } from '@/components/ui/skeletons'
import { toast } from 'sonner'

interface LinkedChild {
  child_id: string
  child_name: string
}

interface Option {
  id: string
  title: string
}

interface Restrictions {
  surah: string[]
  course: string[]
  tajweed_path: string[]
  memorization_path: string[]
}

interface RestrictionOptions {
  surahs: Option[]
  courses: Option[]
  tajweed_paths: Option[]
  memorization_paths: Option[]
}

const emptyRestrictions: Restrictions = {
  surah: [],
  course: [],
  tajweed_path: [],
  memorization_path: [],
}

const emptyOptions: RestrictionOptions = {
  surahs: [],
  courses: [],
  tajweed_paths: [],
  memorization_paths: [],
}

export default function ParentRestrictionsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [children, setChildren] = useState<LinkedChild[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [restrictions, setRestrictions] = useState<Restrictions>(emptyRestrictions)
  const [options, setOptions] = useState<RestrictionOptions>(emptyOptions)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadChildren() {
      try {
        const res = await fetch('/api/academy/parent/children')
        const data = await res.json()
        if (res.ok) {
          const list: LinkedChild[] = data.children || []
          setChildren(list)
          if (list[0]) setSelectedChildId(list[0].child_id)
        }
      } finally {
        setLoading(false)
      }
    }
    loadChildren()
  }, [])

  useEffect(() => {
    if (!selectedChildId) return
    async function loadRestrictions() {
      setLoading(true)
      try {
        const res = await fetch(`/api/academy/parent/restrictions?childId=${selectedChildId}`)
        const data = await res.json()
        if (res.ok) {
          setRestrictions(data.restrictions || emptyRestrictions)
          setOptions(data.options || emptyOptions)
        }
      } finally {
        setLoading(false)
      }
    }
    loadRestrictions()
  }, [selectedChildId])

  function toggle(key: keyof Restrictions, value: string) {
    setRestrictions(prev => {
      const current = new Set(prev[key])
      if (current.has(value)) current.delete(value)
      else current.add(value)
      return { ...prev, [key]: Array.from(current) }
    })
  }

  async function save() {
    if (!selectedChildId) return
    setSaving(true)
    try {
      const res = await fetch('/api/academy/parent/restrictions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selectedChildId, restrictions }),
      })
      const data = await res.json()
      if (res.ok) {
        setRestrictions(data.restrictions || restrictions)
        toast.success(t.parentPages.restrictions.restrictionsSaved)
      } else {
        toast.error(data.error || t.parentPages.restrictions.couldNotSave)
      }
    } finally {
      setSaving(false)
    }
  }

  function renderOptions(title: string, description: string, icon: React.ReactNode, key: keyof Restrictions, rows: Option[]) {
    return (
      <Card className="rounded-3xl border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
            <div>
              <h2 className="font-black text-lg">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.parentPages.restrictions.noOptionsAvailable}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {rows.map(row => (
                <label key={row.id} className="flex items-center gap-3 rounded-2xl border border-border p-3 cursor-pointer hover:bg-muted/30">
                  <Checkbox checked={restrictions[key].includes(row.id)} onCheckedChange={() => toggle(key, row.id)} />
                  <span className="text-sm font-semibold">{row.title}</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading && children.length === 0) {
    return <RestrictionsSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            {t.parentPages.restrictions.contentRestrictions}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t.parentPages.restrictions.allowedChildContent}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            {t.parentPages.restrictions.restrictionsDesc}
          </p>
        </div>
        <Button onClick={save} disabled={!selectedChildId || saving} className="h-12 rounded-2xl font-bold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />}
          {t.parentPages.restrictions.saveRestrictions}
        </Button>
      </div>

      {children.length === 0 ? (
        <Card className="rounded-3xl border-border/50">
          <CardContent className="p-12 text-center text-muted-foreground font-medium">
            {t.parentPages.restrictions.noChildrenToManage}
          </CardContent>
        </Card>
      ) : (
        <>
          <select
            value={selectedChildId}
            onChange={e => setSelectedChildId(e.target.value)}
            className="w-full md:w-96 h-14 rounded-2xl border border-border bg-card px-4 font-bold"
          >
            {children.map(child => (
              <option key={child.child_id} value={child.child_id}>{child.child_name}</option>
            ))}
          </select>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              {renderOptions(t.parentPages.restrictions.allowedSurahs, t.parentPages.restrictions.surahsDesc, <BookOpen className="w-5 h-5" />, 'surah', options.surahs)}
              {renderOptions(t.parentPages.restrictions.allowedCourses, t.parentPages.restrictions.coursesDesc, <BookOpen className="w-5 h-5" />, 'course', options.courses)}
              {renderOptions(t.parentPages.restrictions.allowedTajweedPaths, t.parentPages.restrictions.tajweedPathsDesc, <Route className="w-5 h-5" />, 'tajweed_path', options.tajweed_paths)}
              {renderOptions(t.parentPages.restrictions.allowedMemorizationPaths, t.parentPages.restrictions.memorizationPathsDesc, <Route className="w-5 h-5" />, 'memorization_path', options.memorization_paths)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Loader2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  MessageSquare,
  Calendar,
  Mic,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { SURAHS } from '@/lib/quran-surahs'
import { toast } from 'sonner'

interface Restriction {
  id: string
  restriction_type: string
  target_id: string
  created_at: string
}

interface PathOption {
  id: string
  title: string
  level: string | null
}

interface CourseOption {
  id: string
  title: string
}

const FEATURES = [
  { id: 'messaging', icon: MessageSquare, color: 'blue' as const },
  { id: 'scheduling', icon: Calendar, color: 'emerald' as const },
]

const featureLabels: Record<string, { ar: string; en: string }> = {
  messaging: { ar: 'الرسائل', en: 'Messaging' },
  scheduling: { ar: 'الجدولة', en: 'Scheduling' },
}

const featureDescriptions: Record<string, { ar: string; en: string }> = {
  messaging: {
    ar: 'منع الابن من إرسال واستقبال الرسائل',
    en: 'Prevent your child from sending and receiving messages',
  },
  scheduling: {
    ar: 'منع الابن من حجز جلسات جديدة',
    en: 'Prevent your child from booking new sessions',
  },
}

export default function RestrictionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [memPaths, setMemPaths] = useState<PathOption[]>([])
  const [tajPaths, setTajPaths] = useState<PathOption[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/restrictions`)
      const data = await res.json()
      if (res.ok) {
        setRestrictions(data.restrictions || [])
        setMemPaths(data.paths?.memorization || [])
        setTajPaths(data.paths?.tajweed || [])
        setCourses(data.courses || [])
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const isBlocked = (type: string, targetId: string) =>
    restrictions.some(
      (r) => r.restriction_type === type && r.target_id === targetId.toString()
    )

  const toggle = async (type: string, targetId: string, nextBlocked: boolean) => {
    const key = `${type}:${targetId}`
    setSavingKey(key)
    try {
      const res = await fetch(`/api/academy/parent/children/${id}/restrictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restriction_type: type,
          target_id: targetId.toString(),
          blocked: nextBlocked,
        }),
      })
      if (res.ok) {
        await load()
        toast.success(isAr ? 'تم الحفظ' : 'Saved')
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    } finally {
      setSavingKey(null)
    }
  }

  const filteredSurahs = SURAHS.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.name_ar.includes(search) ||
      s.name_en.toLowerCase().includes(q) ||
      s.number.toString() === search
    )
  })

  const blockedCount = restrictions.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back Link */}
      <Link
        href={`/academy/parent/children/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronIcon className="w-4 h-4" />
        {isAr ? 'العودة لصفحة الابن' : 'Back to child'}
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          {isAr ? 'تقييد المحتوى' : 'Content Restrictions'}
        </div>
        <h1 className="text-3xl font-black text-foreground">
          {isAr ? 'إعدادات المحتوى' : 'Content Settings'}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {isAr
            ? 'تحكم في المحتوى المتاح لابنك. بشكل افتراضي يستطيع الوصول لكل المحتوى.'
            : 'Control what content your child can access. By default, they can access everything.'}
        </p>
      </div>

      {/* Active Restrictions Banner */}
      {blockedCount > 0 && (
        <Card className="rounded-2xl border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-foreground">
              {isAr
                ? `لديك ${blockedCount} تقييد نشط`
                : `You have ${blockedCount} active restrictions`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="features" className="text-xs">
            {isAr ? 'الميزات' : 'Features'}
          </TabsTrigger>
          <TabsTrigger value="courses" className="text-xs">
            {isAr ? 'المقررات' : 'Courses'}
          </TabsTrigger>
          <TabsTrigger value="surahs" className="text-xs">
            {isAr ? 'السور' : 'Surahs'}
          </TabsTrigger>
          <TabsTrigger value="paths" className="text-xs">
            {isAr ? 'المسارات' : 'Paths'}
          </TabsTrigger>
        </TabsList>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-6">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/50">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                const blocked = isBlocked('feature', feature.id)
                const key = `feature:${feature.id}`
                const colorClasses = {
                  blue: 'bg-blue-500/10 text-blue-500',
                  emerald: 'bg-emerald-500/10 text-emerald-500',
                  violet: 'bg-violet-500/10 text-violet-500',
                }

                return (
                  <div
                    key={feature.id}
                    className="flex items-center gap-4 p-5 hover:bg-muted/20 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[feature.color]}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-foreground">
                        {featureLabels[feature.id]?.[locale] || feature.id}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {featureDescriptions[feature.id]?.[locale] || ''}
                      </p>
                    </div>
                    <Switch
                      checked={!blocked}
                      disabled={savingKey === key}
                      onCheckedChange={(checked) =>
                        toggle('feature', feature.id, !checked)
                      }
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-3 px-1">
            {isAr
              ? 'الميزات المفعلة متاحة للابن. أغل الميزة لمنع الوصول.'
              : 'Enabled features are accessible to your child. Toggle off to restrict access.'}
          </p>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="mt-6">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardContent className="p-0">
              {courses.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <GraduationCap className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm">
                    {isAr ? 'الابن غير مسجل في أي مقرر.' : 'Your child is not enrolled in any courses.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {courses.map((course) => {
                    const blocked = isBlocked('course', course.id)
                    const key = `course:${course.id}`

                    return (
                      <div
                        key={course.id}
                        className="flex items-center gap-4 p-5 hover:bg-muted/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {course.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {blocked
                              ? isAr
                                ? 'محظور — الابن لا يستطيع الوصول'
                                : 'Blocked — child cannot access'
                              : isAr
                              ? 'متاح — الابن يستطيع الوصول'
                              : 'Accessible — child can access'}
                          </p>
                        </div>
                        {blocked && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">
                            {isAr ? 'محظور' : 'Blocked'}
                          </Badge>
                        )}
                        <Switch
                          checked={!blocked}
                          disabled={savingKey === key}
                          onCheckedChange={(checked) =>
                            toggle('course', course.id, !checked)
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surahs Tab */}
        <TabsContent value="surahs" className="mt-6 space-y-4">
          <div className="relative">
            <Search
              className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
            />
            <Input
              placeholder={isAr ? 'ابحث باسم السورة أو رقمها...' : 'Search by name or number...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`h-11 rounded-xl ${isAr ? 'pr-10' : 'pl-10'}`}
            />
          </div>

          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="max-h-[50vh] overflow-y-auto">
                <div className="divide-y divide-border/50">
                  {filteredSurahs.map((s) => {
                    const blocked = isBlocked('surah', s.number.toString())
                    const key = `surah:${s.number}`

                    return (
                      <div
                        key={s.number}
                        className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Mic className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground">
                            {isAr ? s.name_ar : s.name_en}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {isAr ? 'سورة' : 'Surah'} {s.number}
                          </p>
                        </div>
                        {blocked && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">
                            {isAr ? 'محظورة' : 'Blocked'}
                          </Badge>
                        )}
                        <Switch
                          checked={!blocked}
                          disabled={savingKey === key}
                          onCheckedChange={(checked) =>
                            toggle('surah', s.number.toString(), !checked)
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paths Tab */}
        <TabsContent value="paths" className="mt-6 space-y-6">
          {/* Memorization Paths */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {isAr ? 'مسارات الحفظ' : 'Memorization Paths'}
            </h3>
            {memPaths.length === 0 ? (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  {isAr ? 'لا توجد مسارات متاحة.' : 'No paths available.'}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-border/50 overflow-hidden">
                <CardContent className="p-0 divide-y divide-border/50">
                  {memPaths.map((p) => {
                    const blocked = isBlocked('memorization_path', p.id)
                    const key = `memorization_path:${p.id}`

                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 p-5 hover:bg-muted/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground">{p.title}</h4>
                          {p.level && (
                            <p className="text-xs text-muted-foreground mt-0.5">{p.level}</p>
                          )}
                        </div>
                        {blocked && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">
                            {isAr ? 'محظور' : 'Blocked'}
                          </Badge>
                        )}
                        <Switch
                          checked={!blocked}
                          disabled={savingKey === key}
                          onCheckedChange={(checked) =>
                            toggle('memorization_path', p.id, !checked)
                          }
                        />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tajweed Paths */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {isAr ? 'مسارات التجويد' : 'Tajweed Paths'}
            </h3>
            {tajPaths.length === 0 ? (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  {isAr ? 'لا توجد مسارات متاحة.' : 'No paths available.'}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-border/50 overflow-hidden">
                <CardContent className="p-0 divide-y divide-border/50">
                  {tajPaths.map((p) => {
                    const blocked = isBlocked('tajweed_path', p.id)
                    const key = `tajweed_path:${p.id}`

                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 p-5 hover:bg-muted/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground">{p.title}</h4>
                          {p.level && (
                            <p className="text-xs text-muted-foreground mt-0.5">{p.level}</p>
                          )}
                        </div>
                        {blocked && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">
                            {isAr ? 'محظور' : 'Blocked'}
                          </Badge>
                        )}
                        <Switch
                          checked={!blocked}
                          disabled={savingKey === key}
                          onCheckedChange={(checked) =>
                            toggle('tajweed_path', p.id, !checked)
                          }
                        />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

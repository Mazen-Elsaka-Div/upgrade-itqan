'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { Layers, BookOpen, Route, Search, Loader2 } from 'lucide-react'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import Link from 'next/link'

interface Series {
  id: string
  title: string
  description: string
  subject: string
  teacher_name: string
  items_count: number
  courses_count: number
  paths_count: number
  thumbnail_url: string | null
}

export default function StudentSeriesPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  useEffect(() => {
    async function fetchSeries() {
      try {
        const res = await fetch('/api/academy/student/series')
        if (res.ok) {
          const data = await res.json()
          setSeriesList(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch series:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSeries()
  }, [])

  const subjects = [
    { value: '', label: t.studentPages?.series?.subjects?.all || 'الكل' },
    { value: 'quran', label: t.studentPages?.series?.subjects?.quran || 'القرآن الكريم' },
    { value: 'tajweed', label: t.studentPages?.series?.subjects?.tajweed || 'التجويد' },
    { value: 'fiqh', label: t.studentPages?.series?.subjects?.fiqh || 'الفقه' },
    { value: 'aqeedah', label: t.studentPages?.series?.subjects?.aqeedah || 'العقيدة' },
    { value: 'seerah', label: t.studentPages?.series?.subjects?.seerah || 'السيرة النبوية' },
    { value: 'tafseer', label: t.studentPages?.series?.subjects?.tafseer || 'التفسير' },
    { value: 'arabic', label: t.studentPages?.series?.subjects?.arabic || 'اللغة العربية' },
    { value: 'general', label: t.studentPages?.series?.subjects?.general || 'عام' },
  ]

  const filtered = seriesList.filter(s => {
    const matchesSubject = !subjectFilter || s.subject === subjectFilter
    const matchesSearch = !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.teacher_name && s.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSubject && matchesSearch
  })

  const getSubjectLabel = (val: string) => subjects.find(s => s.value === val)?.label || val || t.studentPages?.series?.subjects?.general || 'عام'

  if (loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-7 h-7 text-emerald-600" />
          {t.studentPages?.series?.title || 'السلاسل التعليمية'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.studentPages?.series?.desc || 'تصفح سلاسل الدروس المتاحة'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isAr ? "right-3" : "left-3")} />
          <input
            type="text"
            placeholder={t.studentPages?.series?.searchPlaceholder || 'ابحث بالعنوان أو اسم الشيخ...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn(
              "w-full py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500",
              isAr ? "pr-10 pl-3" : "pl-10 pr-3"
            )}
          />
        </div>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {subjects.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Layers className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium">
            {searchQuery || subjectFilter 
              ? (t.studentPages?.series?.noResults || 'لا توجد نتائج مطابقة') 
              : (t.studentPages?.series?.noSeriesYet || 'لا توجد سلاسل متاحة حالياً')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((series) => (
            <Link
              key={series.id}
              href={`/academy/student/series/${series.id}`}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group text-start"
            >
              <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-600 transition-colors">{series.title}</h3>
              {series.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{series.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="bg-muted px-2 py-0.5 rounded-full">{getSubjectLabel(series.subject)}</span>
                {series.teacher_name && <span className="truncate">{series.teacher_name}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {(t.studentPages?.series?.coursesCount || '{count} دورة').replace('{count}', String(series.courses_count || 0))}
                </span>
                <span className="flex items-center gap-1">
                  <Route className="w-3.5 h-3.5" />
                  {(t.studentPages?.series?.pathsCount || '{count} مسار').replace('{count}', String(series.paths_count || 0))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

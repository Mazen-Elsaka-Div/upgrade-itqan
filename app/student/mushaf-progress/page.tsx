'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen, Loader2, ChevronDown, ChevronUp,
  BarChart3, Star, Target, Award, ArrowLeft, Layers, Grid3x3,
  Clock, Trophy, Crown, Sparkles, CheckCircle,
} from 'lucide-react'
import { SURAHS, juzName } from '@/lib/quran-data'
import { SURAHS as SURAHS_EN } from '@/lib/quran-surahs'
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton"
import { useI18n } from '@/lib/i18n/context'

type PageStatus = 'mastered' | 'reviewing' | 'none'

interface PageData {
  page: number
  status: PageStatus
}

interface JuzProgress {
  juz: number
  fromPage: number
  toPage: number
  totalPages: number
  masteredPages: number
  reviewingPages: number
  percentage: number
}

interface SurahProgress {
  number: number
  name: string
  totalAyahs: number
  masteredAyahs: number
  reviewingAyahs: number
  startPage: number
}

interface ProgressStats {
  totalPages: number
  masteredPages: number
  reviewingPages: number
  totalAyahs: number
  totalMasteredAyahs: number
  totalReviewingAyahs: number
  completedSurahs: number
  totalSurahs: number
  completedJuz: number
  totalJuz: number
  overallPercentage: number
}

interface RecentActivity {
  surah_name: string
  surah_number: number
  ayah_from: number
  ayah_to: number
  status: string
  created_at: string
}

interface Milestone {
  label: string
  achieved: boolean
  icon: string
}

interface ProgressData {
  pages: PageData[]
  juzProgress: JuzProgress[]
  surahProgress: SurahProgress[]
  stats: ProgressStats
  recentActivity: RecentActivity[]
  milestones: Milestone[]
}

function toArabicDigits(n: number | string): string {
  return String(n).replace(/\d/g, d => '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669'[Number(d)])
}

export default function MushafProgressPage() {
  const { t, locale, dir } = useI18n()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'pages' | 'surahs'>('pages')
  const [expandedJuz, setExpandedJuz] = useState<Set<number>>(new Set())
  const [hoveredPage, setHoveredPage] = useState<number | null>(null)

  const formatDigits = (n: number | string) => {
    if (locale === 'en') return String(n)
    return toArabicDigits(n)
  }

  const getSurahName = (num: number, arName: string) => {
    if (locale === 'ar') return arName
    const found = SURAHS_EN.find(s => s.number === num)
    return found ? found.name_en : arName
  }

  const getJuzLabel = (num: number) => {
    if (locale === 'ar') {
      return juzName(num)
    }
    return num === 30 ? 'Juz Amma' : `Juz ${num}`
  }

  const getMilestoneLabel = (label: string) => {
    if (locale === 'ar') return label
    const mapping: Record<string, string> = {
      "حفظ أول صفحة": "Memorize first page",
      "حفظ أول جزء": "Memorize first Juz",
      "حفظ ٥ أجزاء": "Memorize 5 Juz",
      "حفظ ١٠ أجزاء": "Memorize 10 Juz",
      "حفظ نصف القرآن": "Memorize half of the Quran",
      "حفظ القرآن كاملاً": "Memorize the entire Quran",
    }
    return mapping[label] || label
  }

  const formatRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t.mushafProgressPage.relativeToday || t.addedTranslations_2026?.["اليوم"] || 'اليوم'
    if (diffDays === 1) return t.mushafProgressPage.relativeYesterday || t.addedTranslations_2026?.["أمس"] || 'أمس'
    if (diffDays < 7) {
      return t.mushafProgressPage.relativeDaysAgo
        ? t.mushafProgressPage.relativeDaysAgo.replace('{days}', formatDigits(diffDays))
        : `منذ ${formatDigits(diffDays)} أيام`
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return t.mushafProgressPage.relativeWeeksAgo
        ? t.mushafProgressPage.relativeWeeksAgo.replace('{weeks}', formatDigits(weeks))
        : `منذ ${formatDigits(weeks)} أسابيع`
    }
    const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US'
    return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
  }

  useEffect(() => {
    fetch('/api/student/mushaf-progress')
      .then(r => r.ok ? r.json() : null)
      .then((d: ProgressData | null) => {
        if (d) setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pageMap = useMemo(() => {
    if (!data) return new Map<number, PageStatus>()
    const m = new Map<number, PageStatus>()
    for (const p of data.pages) {
      m.set(p.page, p.status)
    }
    return m
  }, [data])

  // Get surah name for a given page
  const getSurahForPage = (page: number): string => {
    for (let i = SURAHS.length - 1; i >= 0; i--) {
      if (SURAHS[i].startPage <= page) return getSurahName(SURAHS[i].number, SURAHS[i].name)
    }
    return ''
  }

  const toggleJuz = (j: number) => {
    setExpandedJuz(prev => {
      const next = new Set(prev)
      if (next.has(j)) next.delete(j)
      else next.add(j)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageLoadingSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t.student.mushafError || t.addedTranslations_2026?.["تعذر تحميل البيانات"] || "تعذر تحميل البيانات"}</p>
      </div>
    )
  }

  const { stats, juzProgress, surahProgress } = data

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8" dir={dir}>
      {/* Back button */}
      <Link href="/student" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ChevronDown className="w-4 h-4 rotate-90" />
        {t.student.backToDashboard || t.addedTranslations_2026?.["العودة للوحة الطالب"] || "العودة للوحة الطالب"}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-foreground">{t.mushafProgressPage.title || t.addedTranslations_2026?.["خريطة مصحفي"] || "خريطة مصحفي"}</h1>
            <p className="text-sm text-muted-foreground font-medium">
              {t.mushafProgressPage.subtitle || t.addedTranslations_2026?.["تتبع تقدمك في حفظ ومراجعة القرآن الكريم"] || "تتبع تقدمك في حفظ ومراجعة القرآن الكريم"}
            </p>
          </div>
        </div>
        <Link
          href="/student/mushaf"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-bold transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          {t.mushafProgressPage.openMushaf || t.addedTranslations_2026?.["فتح المصحف"] || "فتح المصحف"}
          <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? '' : 'rotate-180'}`} />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label={t.student.completionRate || t.addedTranslations_2026?.["نسبة الإنجاز"] || "نسبة الإنجاز"}
          value={`${formatDigits(stats.overallPercentage)}٪`}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label={t.mushafProgressPage.legendMastered || t.addedTranslations_2026?.["صفحات محفوظة"] || "صفحات محفوظة"}
          value={formatDigits(stats.masteredPages)}
          sub={t.student.fromStages ? t.student.fromStages.replace('{done}', '').replace('{total}', formatDigits(stats.totalPages)) : `من ${formatDigits(stats.totalPages)}`}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label={t.student.completedJparts || t.addedTranslations_2026?.["أجزاء مكتملة"] || "أجزاء مكتملة"}
          value={formatDigits(stats.completedJuz)}
          sub={t.student.fromStages ? t.student.fromStages.replace('{done}', '').replace('{total}', formatDigits(stats.totalJuz)) : `من ${formatDigits(stats.totalJuz)}`}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label={t.student.masteredSurahs || t.addedTranslations_2026?.["سور مكتملة"] || "سور مكتملة"}
          value={formatDigits(stats.completedSurahs)}
          sub={t.student.fromStages ? t.student.fromStages.replace('{done}', '').replace('{total}', formatDigits(stats.totalSurahs)) : `من ${formatDigits(stats.totalSurahs)}`}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-500/10"
        />
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">{t.mushafProgressPage.totalProgress || t.addedTranslations_2026?.["التقدم الإجمالي"] || "التقدم الإجمالي"}</span>
          <span className="text-xs font-bold text-muted-foreground">
            {t.mushafProgressPage.masteredAyahsCount
              ? t.mushafProgressPage.masteredAyahsCount.replace('{count}', formatDigits(stats.totalMasteredAyahs)).replace('{total}', formatDigits(stats.totalAyahs))
              : `${formatDigits(stats.totalMasteredAyahs)} آية محفوظة من ${formatDigits(stats.totalAyahs)}`}
          </span>
        </div>
        <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex" dir="ltr">
          <div
            className="h-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${(stats.masteredPages / stats.totalPages) * 100}%` }}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-700"
            style={{ width: `${(stats.reviewingPages / stats.totalPages) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-6 mt-3 flex-wrap">
          <LegendItem color="bg-emerald-500" label={t.mushafProgressPage.legendMastered || t.addedTranslations_2026?.["محفوظ"] || "محفوظ"} />
          <LegendItem color="bg-amber-400" label={t.mushafProgressPage.legendReviewing || t.addedTranslations_2026?.["قيد المراجعة"] || "قيد المراجعة"} />
          <LegendItem color="bg-muted" label={t.mushafProgressPage.legendNone || t.addedTranslations_2026?.["لم يُحفظ بعد"] || "لم يُحفظ بعد"} />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setView('pages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            view === 'pages'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Grid3x3 className="w-4 h-4" />
          {t.mushafProgressPage.viewPages || t.addedTranslations_2026?.["عرض الصفحات"] || "عرض الصفحات"}
        </button>
        <button
          onClick={() => setView('surahs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            view === 'surahs'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          {t.mushafProgressPage.viewSurahs || t.addedTranslations_2026?.["عرض السور"] || "عرض السور"}
        </button>
      </div>

      {/* Page View */}
      {view === 'pages' && (
        <div className="space-y-4">
          {juzProgress.map(juz => {
            const isExpanded = expandedJuz.has(juz.juz)
            const hasProgress = juz.masteredPages > 0 || juz.reviewingPages > 0

            return (
              <div
                key={juz.juz}
                className="bg-card border border-border rounded-2xl overflow-hidden text-right"
              >
                {/* Juz Header */}
                <button
                  onClick={() => toggleJuz(juz.juz)}
                  className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                      juz.percentage === 100
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : juz.percentage > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {formatDigits(juz.juz)}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{getJuzLabel(juz.juz)}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.mushafProgressPage.pageRange
                          ? t.mushafProgressPage.pageRange.replace('{from}', formatDigits(juz.fromPage)).replace('{to}', formatDigits(juz.toPage))
                          : `صفحة ${formatDigits(juz.fromPage)} - ${formatDigits(juz.toPage)}`}
                        {hasProgress && (
                          <span className="mr-2">
                            · {formatDigits(juz.percentage)}٪
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini progress */}
                    <div className="hidden sm:flex w-24 h-2 bg-muted rounded-full overflow-hidden" dir="ltr">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${(juz.masteredPages / juz.totalPages) * 100}%` }}
                      />
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${(juz.reviewingPages / juz.totalPages) * 100}%` }}
                      />
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Page Grid */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 mt-3" dir="rtl">
                      {Array.from({ length: juz.toPage - juz.fromPage + 1 }, (_, i) => {
                        const page = juz.fromPage + i
                        const status = pageMap.get(page) || 'none'
                        const isHovered = hoveredPage === page
                        const tooltip = t.mushafProgressPage.pageTooltip
                          ? t.mushafProgressPage.pageTooltip.replace('{page}', formatDigits(page)).replace('{surah}', getSurahForPage(page))
                          : `صفحة ${formatDigits(page)} - ${getSurahForPage(page)}`
                        return (
                          <Link
                            key={page}
                            href={`/student/mushaf?page=${page}`}
                            onMouseEnter={() => setHoveredPage(page)}
                            onMouseLeave={() => setHoveredPage(null)}
                            className={`
                              relative aspect-[3/4] rounded-md border text-center flex items-center justify-center
                              text-[10px] font-bold transition-all cursor-pointer
                              ${status === 'mastered'
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/60 hover:shadow-sm hover:shadow-emerald-500/20'
                                : status === 'reviewing'
                                ? 'bg-amber-400/20 border-amber-400/40 text-amber-700 dark:text-amber-300 hover:bg-amber-400/30 hover:border-amber-400/60 hover:shadow-sm hover:shadow-amber-400/20'
                                : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60 hover:border-border'
                              }
                              ${isHovered ? 'scale-110 z-10' : ''}
                            `}
                            title={tooltip}
                          >
                            {formatDigits(page)}
                          </Link>
                        )
                      })}
                    </div>
                    {hoveredPage !== null && hoveredPage >= juz.fromPage && hoveredPage <= juz.toPage && (
                      <div className="mt-2 text-center text-xs text-muted-foreground font-medium">
                        {t.mushafProgressPage.pageTooltip
                          ? t.mushafProgressPage.pageTooltip.replace('{page}', formatDigits(hoveredPage)).replace('{surah}', getSurahForPage(hoveredPage))
                          : `صفحة ${formatDigits(hoveredPage)} — ${getSurahForPage(hoveredPage)}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Surah View */}
      {view === 'surahs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {surahProgress.map(surah => {
            const percentage = surah.totalAyahs > 0
              ? Math.round((surah.masteredAyahs / surah.totalAyahs) * 100)
              : 0
            const reviewPercentage = surah.totalAyahs > 0
              ? Math.round((surah.reviewingAyahs / surah.totalAyahs) * 100)
              : 0
            const isComplete = percentage === 100

            return (
              <Link
                key={surah.number}
                href={`/student/mushaf?page=${surah.startPage}`}
                className={`
                  bg-card border rounded-xl p-4 hover:shadow-sm transition-all group text-right
                  ${isComplete
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : percentage > 0 || reviewPercentage > 0
                    ? 'border-amber-400/30 hover:border-amber-400/50'
                    : 'border-border hover:border-border/80'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                      isComplete
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : percentage > 0 || reviewPercentage > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {formatDigits(surah.number)}
                    </span>
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {getSurahName(surah.number, surah.name)}
                    </span>
                  </div>
                  {isComplete && (
                    <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t.mushafProgressPage.versesCount
                    ? t.mushafProgressPage.versesCount.replace('{count}', formatDigits(surah.totalAyahs))
                    : `${formatDigits(surah.totalAyahs)} آية`}
                  {surah.masteredAyahs > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 mr-1">
                      · {formatDigits(surah.masteredAyahs)} {t.mushafProgressPage.legendMastered || t.addedTranslations_2026?.["محفوظة"] || "محفوظة"}
                    </span>
                  )}
                  {surah.reviewingAyahs > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 mr-1">
                      · {formatDigits(surah.reviewingAyahs)} {t.mushafProgressPage.legendReviewing || t.addedTranslations_2026?.["قيد المراجعة"] || "قيد المراجعة"}
                    </span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden" dir="ltr">
                  <div className="h-full flex">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${reviewPercentage}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Milestones & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Milestones */}
        <div className="bg-card border border-border rounded-2xl p-5 text-right">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            {t.mushafProgressPage.milestonesTitle || t.addedTranslations_2026?.["الإنجازات"] || "الإنجازات"}
          </h3>
          <div className="space-y-3">
            {data.milestones.map((m, i) => {
              const MilestoneIcon = m.icon === 'crown' ? Crown
                : m.icon === 'trophy' ? Trophy
                : m.icon === 'star' ? Sparkles
                : CheckCircle
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  m.achieved
                    ? 'bg-emerald-500/5 border border-emerald-500/20'
                    : 'bg-muted/30 border border-transparent opacity-50'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    m.achieved
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <MilestoneIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold ${
                    m.achieved ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {getMilestoneLabel(m.label)}
                  </span>
                  {m.achieved && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-auto" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-2xl p-5 text-right">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {t.mushafProgressPage.recentActivitiesTitle || t.addedTranslations_2026?.["آخر النشاطات"] || "آخر النشاطات"}
          </h3>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t.mushafProgressPage.noActivitiesYet || t.addedTranslations_2026?.["لا توجد نشاطات بعد"] || "لا توجد نشاطات بعد"}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.mushafProgressPage.startRecitationHint || t.addedTranslations_2026?.["ابدأ بتسميع تلاوتك لرؤية تقدمك هنا"] || "ابدأ بتسميع تلاوتك لرؤية تقدمك هنا"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    a.status === 'mastered' ? 'bg-emerald-500'
                    : a.status === 'rejected' ? 'bg-red-500'
                    : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">
                      {a.surah_name ? getSurahName(a.surah_number, a.surah_name) : (locale === 'ar' ? `سورة ${formatDigits(a.surah_number)}` : `Surah ${formatDigits(a.surah_number)}`)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {locale === 'ar'
                        ? `الآيات ${formatDigits(a.ayah_from)} - ${formatDigits(a.ayah_to)}`
                        : `Verses ${formatDigits(a.ayah_from)} - ${formatDigits(a.ayah_to)}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.status === 'mastered'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : a.status === 'rejected'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {a.status === 'mastered' ? (t.student.statusMastered || t.addedTranslations_2026?.["متقن"] || 'متقن')
                        : a.status === 'in_review' ? (t.student.statusInReview || t.addedTranslations_2026?.["قيد المراجعة"] || 'قيد المراجعة')
                        : a.status === 'pending' ? (t.student.statusPending || t.addedTranslations_2026?.["معلق"] || 'معلق')
                        : a.status === 'rejected' ? (t.rejected || t.addedTranslations_2026?.["مرفوض"] || 'مرفوض')
                        : a.status === 'needs_session' ? (t.student.statusNeedsSession || t.addedTranslations_2026?.["يحتاج جلسة"] || 'يحتاج جلسة')
                        : a.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeDate(a.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ayahs stats footer */}
      <div className="bg-card border border-border rounded-2xl p-5 text-right">
        <h3 className="text-sm font-bold text-foreground mb-3">{t.mushafProgressPage.ayahsSummaryTitle || t.addedTranslations_2026?.["ملخص الآيات"] || "ملخص الآيات"}</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatDigits(stats.totalMasteredAyahs)}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">{t.mushafProgressPage.ayahsMastered || t.addedTranslations_2026?.["آية محفوظة"] || "آية محفوظة"}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatDigits(stats.totalReviewingAyahs)}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">{t.mushafProgressPage.ayahsReviewing || t.addedTranslations_2026?.["آية قيد المراجعة"] || "آية قيد المراجعة"}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-muted-foreground">
              {formatDigits(stats.totalAyahs - stats.totalMasteredAyahs - stats.totalReviewingAyahs)}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">{t.mushafProgressPage.ayahsRemaining || t.addedTranslations_2026?.["آية متبقية"] || "آية متبقية"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
  bgColor: string
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 text-right">
      <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center ${color} mb-3`}>
        {icon}
      </div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className={`text-2xl font-black ${color} mt-0.5`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  )
}

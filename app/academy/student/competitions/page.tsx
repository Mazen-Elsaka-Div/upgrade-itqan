'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton'
import { Trophy, Calendar, Users, Star, Clock, ChevronLeft, Loader2, Filter, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface Competition {
  id: string
  title: string
  description: string | null
  type: string
  start_date: string
  end_date: string
  status: string
  max_participants: number | null
  prizes_description: string | null
  is_featured: boolean
  participants_count: number
  has_joined: boolean
}

const TYPE_CONFIG: Record<string, { labelKey: string; icon: string; color: string }> = {
  monthly: { labelKey: 'monthly', icon: '📅', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ramadan: { labelKey: 'ramadan', icon: '🌙', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  tajweed: { labelKey: 'tajweed', icon: '⭐', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  memorization: { labelKey: 'memorization', icon: '📖', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  weekly: { labelKey: 'weekly', icon: '🗓️', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  special: { labelKey: 'special', icon: '🏆', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const STATUS_CONFIG: Record<string, { labelKey: string; cls: string }> = {
  upcoming: { labelKey: 'upcoming', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { labelKey: 'active', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ended: { labelKey: 'ended', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  cancelled: { labelKey: 'cancelled', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function StudentCompetitionsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const fetchCompetitions = async () => {
    try {
      const res = await fetch('/api/academy/student/competitions')
      if (res.ok) {
        const json = await res.json()
        setCompetitions(json.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompetitions() }, [])

  const handleJoin = async (compId: string) => {
    setJoiningId(compId)
    try {
      const res = await fetch(`/api/academy/student/competitions/${compId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        fetchCompetitions()
      } else {
        const data = await res.json()
        alert(data.error || (t.student?.competitionsPage?.toastError || (t.addedTranslations_2026?.['حدث خطأ'] || 'حدث خطأ')))
      }
    } finally {
      setJoiningId(null)
    }
  }

  const filtered = competitions.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    return true
  })

  const activeCount = competitions.filter(c => c.status === 'active').length
  const myJoinedCount = competitions.filter(c => c.has_joined).length

  if (loading) {
    return <PageLoadingSkeleton />
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Dynamic Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-white p-8 sm:p-12 shadow-xl border border-amber-500/20">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-full bg-white/20 backdrop-blur-md border border-white/20">
              <Trophy className="w-4 h-4 text-amber-200" />
              <span>{t.student?.competitionsPage?.title || (t.addedTranslations_2026?.['مسابقات المقرأة'] || 'مسابقات المقرأة')}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {isAr ? (
                <>{(t.addedTranslations_2026?.['تحدَّ نفسك،'] || 'تحدَّ نفسك،')} <br /><span className="text-amber-200">{(t.addedTranslations_2026?.['وارتقِ بمستواك'] || 'وارتقِ بمستواك')}</span></>
              ) : (
                <>Challenge Yourself, <br /><span className="text-amber-200">Elevate Your Level</span></>
              )}
            </h1>
            <p className="text-white/80 text-base sm:text-lg font-medium leading-relaxed">
              {t.student?.competitionsPage?.desc || (t.addedTranslations_2026?.['شارك في المسابقات القرآنية والعلمية، واختبر حفظك وإتقانك، وتنافس مع زملائك للفوز بالجوائز القيمة والشارات المميزة.'] || 'شارك في المسابقات القرآنية والعلمية، واختبر حفظك وإتقانك، وتنافس مع زملائك للفوز بالجوائز القيمة والشارات المميزة.')}
            </p>
          </div>

          <div className="flex gap-4 shrink-0 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex-1 md:w-36 flex flex-col items-center justify-center text-center">
              <Star className="w-8 h-8 text-amber-300 mb-2" />
              <span className="text-3xl font-black text-white mb-1">{activeCount}</span>
              <span className="text-xs font-bold text-white/70">{t.student?.competitionsPage?.activeCompetitions || (t.addedTranslations_2026?.['مسابقة نشطة'] || 'مسابقة نشطة')}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex-1 md:w-36 flex flex-col items-center justify-center text-center">
              <Users className="w-8 h-8 text-amber-300 mb-2" />
              <span className="text-3xl font-black text-white mb-1">{myJoinedCount}</span>
              <span className="text-xs font-bold text-white/70">{t.student?.competitionsPage?.myParticipations || (t.addedTranslations_2026?.['مشاركاتي'] || 'مشاركاتي')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm">
        <div className="flex overflow-x-auto custom-scrollbar w-full sm:w-auto pb-2 sm:pb-0 gap-1 p-1">
          {(['all', 'active', 'upcoming', 'ended'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap",
                filter === f 
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f === 'all' 
                ? (t.student?.competitionsPage?.filterAll || (t.addedTranslations_2026?.['جميع المسابقات'] || 'جميع المسابقات')) 
                : f === 'active' 
                  ? (t.student?.competitionsPage?.filterActive || (t.addedTranslations_2026?.['نشطة الآن'] || 'نشطة الآن')) 
                  : f === 'upcoming' 
                    ? (t.student?.competitionsPage?.filterUpcoming || (t.addedTranslations_2026?.['قادمة'] || 'قادمة')) 
                    : (t.student?.competitionsPage?.filterEnded || (t.addedTranslations_2026?.['منتهية'] || 'منتهية'))}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-auto shrink-0 px-2 sm:px-0">
          <Filter className="absolute right-3 sm:right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full sm:w-48 pl-4 pr-10 py-2.5 rounded-xl text-sm bg-muted/50 border border-transparent hover:border-border focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium appearance-none cursor-pointer"
          >
            <option value="all">{(t.addedTranslations_2026?.['كل التصنيفات'] || 'كل التصنيفات')}</option>
            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {t.student?.competitionsPage?.types?.[config.labelKey] || config.labelKey}
              </option>
            ))}
          </select>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* Competition Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {t.student?.competitionsPage?.noCompetitions || (t.addedTranslations_2026?.['لا توجد مسابقات حالياً'] || 'لا توجد مسابقات حالياً')}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {(t.addedTranslations_2026?.['لم نعثر على أي مسابقات تطابق معايير البحث الحالية. يمكنك تغيير الفلاتر أو العودة لاحقاً.'] || 'لم نعثر على أي مسابقات تطابق معايير البحث الحالية. يمكنك تغيير الفلاتر أو العودة لاحقاً.')}
          </p>
          <button 
            onClick={() => { setFilter('all'); setTypeFilter('all'); }}
            className="mt-6 px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold transition-colors"
          >
            {t.student?.competitionsPage?.filterAll || (t.addedTranslations_2026?.['عرض الكل'] || 'عرض الكل')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(comp => {
            const typeConf = TYPE_CONFIG[comp.type] || TYPE_CONFIG.special
            const statusConf = STATUS_CONFIG[comp.status] || STATUS_CONFIG.upcoming
            const startDate = new Date(comp.start_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })
            const endDate = new Date(comp.end_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })

            // Generate a subtle gradient background based on type
            const gradientMap: Record<string, string> = {
              monthly: 'from-blue-500/10 to-transparent',
              ramadan: 'from-purple-500/10 to-transparent',
              tajweed: 'from-pink-500/10 to-transparent',
              memorization: 'from-green-500/10 to-transparent',
              weekly: 'from-amber-500/10 to-transparent',
              special: 'from-red-500/10 to-transparent',
            }
            const bgGradient = gradientMap[comp.type] || gradientMap.special

            return (
              <div key={comp.id} className={cn(
                "group relative bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col",
                comp.is_featured && "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
              )}>
                {/* Decorative Top Gradient */}
                <div className={cn("absolute top-0 left-0 right-0 h-32 bg-gradient-to-b opacity-50 dark:opacity-20", bgGradient)} />
                
                {/* Featured Badge */}
                {comp.is_featured && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-amber-500/20">
                      <Star className="w-3 h-3 fill-white" /> {t.student?.competitionsPage?.featuredCompetition || (t.addedTranslations_2026?.['مميزة'] || 'مميزة')}
                    </span>
                  </div>
                )}

                <div className="p-6 relative z-10 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={cn("px-3 py-1 rounded-lg text-xs font-bold border", typeConf.color, "border-current/10 bg-current/5")}>
                      <span className="mr-1">{typeConf.icon}</span> {t.student?.competitionsPage?.types?.[typeConf.labelKey] || typeConf.labelKey}
                    </span>
                    <span className={cn("px-3 py-1 rounded-lg text-xs font-bold", statusConf.cls)}>
                      {t.student?.competitionsPage?.statuses?.[statusConf.labelKey] || statusConf.labelKey}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-foreground mb-3 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors">
                    {comp.title}
                  </h3>

                  {comp.description && (
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                      {comp.description}
                    </p>
                  )}

                  <div className="mt-auto space-y-4">
                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2.5 rounded-xl">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase">{(t.addedTranslations_2026?.['المدة'] || 'المدة')}</span>
                          <span className="font-medium text-foreground">{startDate} - {endDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2.5 rounded-xl">
                        <Users className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase">{(t.addedTranslations_2026?.['المشاركين'] || 'المشاركين')}</span>
                          <span className="font-medium text-foreground">
                            {comp.participants_count} {comp.max_participants && <span className="opacity-50">/ {comp.max_participants}</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prizes */}
                    {comp.prizes_description && (
                      <div className="flex items-start gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-3.5 rounded-xl border border-amber-500/20">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">{(t.addedTranslations_2026?.['الجوائز والمكافآت'] || 'الجوائز والمكافآت')}</span>
                          <p className="text-sm font-medium text-foreground">{comp.prizes_description}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2">
                      {comp.has_joined ? (
                        <Link
                          href={`/academy/student/competitions/${comp.id}`}
                          className="flex items-center justify-center w-full px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 text-sm gap-2"
                        >
                          <Mic className="w-4 h-4" />
                          {t.student?.competitionsPage?.viewSubmitParticipation || (t.addedTranslations_2026?.['عرض وتقديم المشاركة'] || 'عرض وتقديم المشاركة')}
                        </Link>
                      ) : comp.status === 'active' ? (
                        <button
                          onClick={() => handleJoin(comp.id)}
                          disabled={joiningId === comp.id}
                          className="flex items-center justify-center w-full px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 text-sm gap-2 disabled:opacity-70"
                        >
                          {joiningId === comp.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trophy className="w-5 h-5" />
                          )}
                          {t.student?.competitionsPage?.registerBtn || (t.addedTranslations_2026?.['سجل وانضم للمنافسة'] || 'سجل وانضم للمنافسة')}
                        </button>
                      ) : (
                        <Link
                          href={`/academy/student/competitions/${comp.id}`}
                          className="flex items-center justify-center w-full px-4 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold transition-colors text-sm"
                        >
                          {t.student?.competitionsPage?.viewDetailsBtn || (t.addedTranslations_2026?.['عرض التفاصيل'] || 'عرض التفاصيل')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

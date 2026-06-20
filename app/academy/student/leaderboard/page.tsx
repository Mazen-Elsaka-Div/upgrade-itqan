"use client"

import { useEffect, useMemo, useState } from 'react'
import { Award, Crown, Flame, Loader2, Medal, Sparkles, Star, Target, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  avatar_url?: string | null
  halaqa_name?: string | null
  total_points: number
  current_level: number
  streak_days: number
  is_current_user: boolean
}

const PERIODS = [
  { value: 'weekly', labelKey: 'periodWeekly', hintKey: 'periodWeeklyHint' },
  { value: 'monthly', labelKey: 'periodMonthly', hintKey: 'periodMonthlyHint' },
  { value: 'all_time', labelKey: 'periodAllTime', hintKey: 'periodAllTimeHint' },
] as const

const SCOPES = [
  { value: 'platform', labelKey: 'scopePlatform', icon: Trophy },
  { value: 'halaqa', labelKey: 'scopeHalaqa', icon: Users },
] as const

export default function LeaderboardPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly')
  const [scope, setScope] = useState<'platform' | 'halaqa'>('platform')

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ period, scope, limit: '50' })
        const res = await fetch(`/api/academy/leaderboard?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setLeaderboard(data.data || [])
          setCurrentUserRank(data.current_user || null)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [period, scope])

  const topThree = leaderboard.slice(0, 3)
  const stats = useMemo(() => ({
    participants: leaderboard.length,
    points: leaderboard.reduce((sum, row) => sum + row.total_points, 0),
    bestStreak: leaderboard.reduce((max, row) => Math.max(max, row.streak_days), 0),
  }), [leaderboard])

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f3d2e] via-[#185b48] to-[#d89b28] p-8 text-white shadow-xl">
        <div className="absolute -left-12 top-8 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold backdrop-blur">
              <Sparkles className="h-4 w-4" /> {t.studentPages?.leaderboard?.heroBadge || 'تنافس شريف وإنجاز مستمر'}
            </div>
            <h1 className="text-3xl font-black lg:text-4xl">{t.studentPages?.leaderboard?.title || 'لوحة المتصدرين'}</h1>
            <p className="text-sm leading-7 text-white/80 lg:text-base">{t.studentPages?.leaderboard?.heroDesc || 'تابع ترتيبك حسب النقاط على مستوى الحلقة أو المنصة كاملة، وغيّر الفترة بسهولة.'}</p>
          </div>
          {currentUserRank && (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur">
              <p className="text-sm text-white/75">{t.studentPages?.leaderboard?.yourRank || 'ترتيبك الحالي'}</p>
              <p className="mt-1 text-4xl font-black">#{currentUserRank.rank}</p>
              <p className="mt-1 text-sm text-white/80">{currentUserRank.total_points.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {t.studentPages?.leaderboard?.pointSuffix || 'نقطة'}</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Users} label={t.studentPages?.leaderboard?.participants || 'المشاركون'} value={stats.participants} isAr={isAr} />
        <SummaryCard icon={Star} label={t.studentPages?.leaderboard?.totalPoints || 'إجمالي النقاط'} value={stats.points} isAr={isAr} />
        <SummaryCard icon={Flame} label={t.studentPages?.leaderboard?.bestStreak || 'أفضل سلسلة'} value={stats.bestStreak} suffix={t.studentPages?.leaderboard?.daySuffix || 'يوم'} isAr={isAr} />
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.value}
                onClick={() => setScope(item.value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition',
                  scope === item.value ? 'bg-emerald-600 text-white shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" /> {t.studentPages?.leaderboard?.[item.labelKey] || item.value}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={cn(
                'rounded-2xl px-4 py-2 text-right transition',
                period === item.value ? 'bg-amber-500 text-white shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <p className="text-sm font-black">{t.studentPages?.leaderboard?.[item.labelKey] || item.value}</p>
              <p className="text-[11px] opacity-80">{t.studentPages?.leaderboard?.[item.hintKey] || ''}</p>
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-border/50 bg-card p-5 text-center shadow-sm animate-pulse space-y-4">
                <div className="mx-auto h-20 w-20 rounded-full bg-muted" />
                <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                <div className="h-3 bg-muted rounded w-1/3 mx-auto" />
                <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-border/40 bg-background p-4 animate-pulse">
                <div className="h-11 w-11 rounded-2xl bg-muted shrink-0" />
                <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
                <div className="h-8 w-16 bg-muted rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
          <Trophy className="mx-auto mb-4 h-14 w-14 text-muted-foreground/40" />
          <p className="font-black">{t.studentPages?.leaderboard?.noPointsYet || 'لا توجد نقاط بعد'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.studentPages?.leaderboard?.noPointsDesc || 'ابدأ بإنجاز المهام والتلاوات لتظهر في الترتيب.'}</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            {topThree.map((entry) => <PodiumCard key={entry.user_id} entry={entry} t={t} isAr={isAr} />)}
          </section>

          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="text-xl font-black">{t.studentPages?.leaderboard?.detailedRank || 'الترتيب التفصيلي'}</h2>
              <span className="text-sm text-muted-foreground">{scope === 'halaqa' ? (t.studentPages?.leaderboard?.halaqaLevel || 'مستوى الحلقة') : (t.studentPages?.leaderboard?.platformLevel || 'مستوى المنصة')}</span>
            </div>
            <div className="space-y-3">
              {leaderboard.map((entry) => <LeaderboardRow key={entry.user_id} entry={entry} t={t} isAr={isAr} />)}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, suffix, isAr }: { icon: typeof Trophy; label: string; value: number; suffix?: string; isAr: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black">{value.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {suffix || ''}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Icon className="h-6 w-6" /></div>
      </div>
    </div>
  )
}

function Avatar({ entry, className }: { entry: LeaderboardEntry; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 font-black text-emerald-800', className)}>
      {entry.avatar_url ? <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" /> : entry.user_name.slice(0, 1)}
    </div>
  )
}

function PodiumCard({ entry, t, isAr }: { entry: LeaderboardEntry; t: any; isAr: boolean }) {
  const colors = entry.rank === 1 ? 'border-amber-300 bg-amber-50/70' : entry.rank === 2 ? 'border-slate-300 bg-slate-50/70' : 'border-orange-300 bg-orange-50/70'
  return (
    <div className={cn('rounded-3xl border p-5 text-center shadow-sm', colors, entry.is_current_user && 'ring-2 ring-emerald-500')}>
      <div className="mb-3 flex justify-center">
        {entry.rank === 1 ? <Crown className="h-10 w-10 text-amber-500" /> : <Medal className="h-10 w-10 text-slate-500" />}
      </div>
      <Avatar entry={entry} className="mx-auto h-20 w-20 text-2xl" />
      <h3 className="mt-3 truncate font-black">{entry.user_name}</h3>
      <p className="text-sm text-muted-foreground">#{entry.rank} • {(t.studentPages?.leaderboard?.levelLabel || 'مستوى {level}').replace('{level}', String(entry.current_level))}</p>
      <p className="mt-3 text-2xl font-black text-amber-600">{entry.total_points.toLocaleString(isAr ? 'ar-EG' : 'en-US')}</p>
      <p className="text-xs text-muted-foreground">{t.studentPages?.leaderboard?.pointSuffix || 'نقطة'}</p>
    </div>
  )
}

function LeaderboardRow({ entry, t, isAr }: { entry: LeaderboardEntry; t: any; isAr: boolean }) {
  return (
    <div className={cn('flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition hover:shadow-sm', entry.is_current_user && 'border-emerald-400 bg-emerald-50/60')}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-lg font-black">
        {entry.rank <= 3 ? (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉') : entry.rank}
      </div>
      <Avatar entry={entry} className="h-12 w-12" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-black">{entry.user_name}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {(t.studentPages?.leaderboard?.levelLabel || 'مستوى {level}').replace('{level}', String(entry.current_level))}</span>
          <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-500" /> {entry.streak_days} {t.studentPages?.leaderboard?.daySuffix || 'يوم'}</span>
          {entry.halaqa_name && <span className="inline-flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {entry.halaqa_name}</span>}
        </div>
      </div>
      <div className="text-left">
        <p className="text-xl font-black text-amber-600">{entry.total_points.toLocaleString(isAr ? 'ar-EG' : 'en-US')}</p>
        <p className="text-xs text-muted-foreground">{t.studentPages?.leaderboard?.pointSuffix || 'نقطة'}</p>
      </div>
    </div>
  )
}

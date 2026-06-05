"use client"

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { Award, Lock, Star, CheckCircle2, Trophy, Flame, BookOpen, Target } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon?: string | null
  icon_url?: string
  points_required?: number
  criteria_type: string
  criteria_value?: number
  earned_at?: string
  is_earned: boolean
}

interface BadgeCategory {
  name: string
  badges: Badge[]
}

export default function BadgesPage() {
  const { t } = useI18n()
  const [categories, setCategories] = useState<BadgeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  useEffect(() => {
    async function fetchBadges() {
      try {
        const res = await fetch('/api/academy/student/badges')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Failed to fetch badges:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBadges()
  }, [])

  const getBadgeIcon = (criteriaType: string) => {
    switch (criteriaType) {
      case 'points': return Star
      case 'streak': return Flame
      case 'courses': return BookOpen
      case 'tasks': return Target
      case 'memorization': return BookOpen
      default: return Award
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const totalBadges = categories.reduce((sum, cat) => sum + cat.badges.length, 0)
  const earnedBadges = categories.reduce((sum, cat) => sum + cat.badges.filter(b => b.is_earned).length, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Hero / Progress Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl border border-indigo-500/20">
        {/* Abstract Background Elements */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl text-center md:text-start">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-indigo-100">لوحة الشرف والإنجازات</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              أوسمة <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">التميز</span>
            </h1>
            <p className="text-indigo-200/80 text-base sm:text-lg font-medium leading-relaxed">
              اجمع الشارات، وتجاوز التحديات، وارتقِ في مسيرتك القرآنية والعلمية. كل شارة تروي قصة نجاحك.
            </p>
          </div>

          <div className="flex flex-col items-center shrink-0 w-full md:w-auto relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full group-hover:bg-yellow-500/30 transition-colors duration-500" />
            
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-2xl min-w-[200px] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600" />
              <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-black text-white">{earnedBadges}</span>
                <span className="text-xl font-bold text-indigo-300">/ {totalBadges}</span>
              </div>
              <span className="text-sm font-bold text-indigo-200">شارة مكتسبة</span>
              
              {/* Progress Bar inside card */}
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mt-6">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${totalBadges ? (earnedBadges / totalBadges) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] -skew-x-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Categories */}
      <div className="space-y-12">
        {categories.map((category, idx) => (
          <div key={category.name} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border/60" />
              <h2 className="text-xl font-black text-foreground flex items-center gap-2 bg-card px-4 py-2 rounded-2xl border border-border shadow-sm">
                <Award className="w-5 h-5 text-indigo-500" />
                {category.name}
              </h2>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {category.badges.map((badge) => {
                const BadgeIcon = getBadgeIcon(badge.criteria_type)
                
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={cn(
                      "group relative w-full aspect-[4/5] rounded-[2rem] p-4 flex flex-col items-center justify-center transition-all duration-500",
                      badge.is_earned
                        ? "bg-gradient-to-b from-yellow-50 to-amber-100/50 dark:from-yellow-900/20 dark:to-amber-900/10 border-2 border-yellow-400/50 hover:border-yellow-400 hover:shadow-[0_10px_30px_-10px_rgba(250,204,21,0.4)] hover:-translate-y-2"
                        : "bg-muted/30 border-2 border-dashed border-border hover:bg-muted/50 hover:border-border/80"
                    )}
                  >
                    {/* Earned Background Glow */}
                    {badge.is_earned && (
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-yellow-400/5 to-amber-500/10 rounded-[2rem] pointer-events-none" />
                    )}

                    <div className={cn(
                      "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                      badge.is_earned
                        ? "bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-800 dark:to-yellow-600 shadow-xl shadow-yellow-500/20"
                        : "bg-muted shadow-inner"
                    )}>
                      {badge.is_earned ? (
                        <div className="absolute inset-0 rounded-full border border-white/40 border-t-white/80" />
                      ) : null}

                      {badge.is_earned ? (
                        badge.icon_url || badge.icon?.startsWith('http') ? (
                          <img src={badge.icon_url || badge.icon || ''} alt={badge.name} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" />
                        ) : badge.icon ? (
                          <span className="text-4xl sm:text-5xl drop-shadow-md">{badge.icon}</span>
                        ) : (
                          <BadgeIcon className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 dark:text-yellow-100 drop-shadow-md" />
                        )
                      ) : (
                        <Lock className="w-8 h-8 text-muted-foreground/50" />
                      )}

                      {/* Small Checkmark Badge for Earned */}
                      {badge.is_earned && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900 shadow-md">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <p className={cn(
                      "font-bold text-center text-sm sm:text-base leading-tight mb-1",
                      badge.is_earned ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {badge.name}
                    </p>
                    
                    {!badge.is_earned && (
                      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                        {t.academy?.locked || 'مقفلة'}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="bg-card border border-border border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Award className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد شارات حالياً</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              سيتم إضافة شارات وإنجازات جديدة قريباً لتتمكن من المنافسة عليها.
            </p>
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedBadge(null)} 
          />
          
          <div className="relative bg-card rounded-[2.5rem] border border-border p-8 w-full max-w-md text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            
            {/* Modal Background Effect for Earned Badges */}
            {selectedBadge.is_earned && (
              <div className="absolute -top-32 -inset-x-10 h-64 bg-gradient-to-b from-yellow-400/20 to-transparent pointer-events-none blur-2xl" />
            )}

            <div className={cn(
              "relative w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center transition-transform",
              selectedBadge.is_earned
                ? "bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-800 dark:to-yellow-600 shadow-2xl shadow-yellow-500/30 scale-110"
                : "bg-muted shadow-inner"
            )}>
              {selectedBadge.is_earned && (
                <div className="absolute inset-0 rounded-full border-2 border-white/40 border-t-white/80" />
              )}
              {selectedBadge.is_earned ? (
                selectedBadge.icon_url || selectedBadge.icon?.startsWith('http') ? (
                  <img src={selectedBadge.icon_url || selectedBadge.icon || ''} alt={selectedBadge.name} className="w-20 h-20 object-contain drop-shadow-xl" />
                ) : selectedBadge.icon ? (
                  <span className="text-6xl drop-shadow-xl">{selectedBadge.icon}</span>
                ) : (
                  <Award className="w-16 h-16 text-yellow-600 dark:text-yellow-100 drop-shadow-xl" />
                )
              ) : (
                <Lock className="w-12 h-12 text-muted-foreground/50" />
              )}
            </div>

            <h2 className="text-2xl font-black mb-3">{selectedBadge.name}</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm sm:text-base">{selectedBadge.description}</p>

            {selectedBadge.is_earned ? (
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4 mb-8">
                <p className="text-green-700 dark:text-green-400 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  {t.academy?.earnedOn || 'تم الحصول عليها في'} {formatDate(selectedBadge.earned_at!)}
                </p>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-2xl p-4 mb-8 border border-border/50">
                <p className="text-sm font-bold text-muted-foreground flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  {selectedBadge.points_required ? (
                    <>يتطلب {selectedBadge.points_required} نقطة لفتح هذه الشارة</>
                  ) : selectedBadge.criteria_value ? (
                    <>يتطلب إكمال {selectedBadge.criteria_value} من {selectedBadge.criteria_type}</>
                  ) : (
                    <>هذه الشارة مقفلة حالياً</>
                  )}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-4 bg-muted hover:bg-foreground hover:text-background rounded-xl font-bold transition-all duration-300"
            >
              {t.close || 'إغلاق'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

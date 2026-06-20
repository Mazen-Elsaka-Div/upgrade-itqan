"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { 
  BookOpen, Search, PlayCircle,
  CheckCircle2, GraduationCap, Compass,
  TrendingUp, Star, Award, Layers, Sparkles
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  teacher_id: string
  teacher_name?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  progress_percent: number
  completed_lessons: number
  total_lessons: number
  status: 'active' | 'completed' | 'dropped'
  enrolled_at: string
}

export default function StudentCoursesPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/academy/student/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'all' || course.status === filter
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = useMemo(() => {
    return {
      total: courses.length,
      active: courses.filter(c => c.status === 'active').length,
      completed: courses.filter(c => c.status === 'completed').length,
      overallProgress: courses.length 
        ? Math.round(courses.reduce((acc, c) => acc + c.progress_percent, 0) / courses.length) 
        : 0
    }
  }, [courses])

  const levelLabels = {
    beginner: t.academy?.beginner || 'مبتدئ',
    intermediate: t.academy?.intermediate || 'متوسط',
    advanced: t.academy?.advanced || 'متقدم'
  }

  const levelColors = {
    beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    advanced: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">{t.studentPages?.courses?.loading || 'جاري تحميل الدورات...'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-950 text-white p-8 sm:p-12 shadow-2xl border border-blue-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute left-0 bottom-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-blue-100 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>{t.studentPages?.courses?.welcome || 'مرحباً بك في رحلتك التعليمية'}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              {t.academy?.myCourses || 'دوراتي التعليمية'}
            </h1>
            <p className="text-blue-100/80 text-lg leading-relaxed max-w-xl">
              {t.academy?.coursesDesc || 'تابع تقدمك في الدورات المسجلة، واصل التعلم وحقق أهدافك المعرفية بخطى ثابتة.'}
            </p>
          </div>
          
          <Link
            href="/academy/student/courses/browse"
            className="group relative inline-flex items-center justify-center gap-3 bg-white text-blue-900 px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 self-start md:self-auto overflow-hidden shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 shadow-sm group-hover:rotate-12 transition-transform">
              <Compass className="w-4 h-4" />
            </span>
            <span className="relative z-10">{t.academy?.browseCourses || 'استكشف دورات جديدة'}</span>
          </Link>
        </div>
      </div>

      {/* Advanced Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.academy?.totalCourses || 'إجمالي الدورات'}</p>
              <h3 className="text-2xl font-black text-foreground">{stats.total}</h3>
            </div>
          </div>
        </div>
 
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.academy?.completedCourses || 'مكتملة'}</p>
              <h3 className="text-2xl font-black text-foreground">{stats.completed}</h3>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.academy?.inProgress || 'قيد التقدم'}</p>
              <h3 className="text-2xl font-black text-foreground">{stats.active}</h3>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Star className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.studentPages?.courses?.averageProgress || 'متوسط الإنجاز'}</p>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-black text-foreground">{stats.overallProgress}%</h3>
              </div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all duration-1000"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/50 p-2 sm:p-3 rounded-2xl shadow-sm">
        <div className="flex overflow-x-auto custom-scrollbar gap-2 p-1">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap",
                filter === f
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 shadow-sm"
                  : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f === 'all' && (t.academy?.all || 'الكل')}
              {f === 'active' && (t.academy?.inProgress || 'قيد التقدم')}
              {f === 'completed' && (t.academy?.completed || 'مكتملة')}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder={t.academy?.searchCourses || 'ابحث عن دورة...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-muted/50 border border-transparent focus:border-blue-500/30 focus:bg-background rounded-xl text-sm font-medium outline-none transition-all focus:ring-4 focus:ring-blue-500/10 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border/50 border-dashed rounded-3xl text-center px-4">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <GraduationCap className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {searchQuery 
              ? (t.academy?.noSearchResults || 'لا توجد نتائج مطابقة لبحثك')
              : (t.academy?.noCoursesYet || 'لم تسجل in أي دورة بعد')
            }
          </h3>
          <p className="text-muted-foreground max-w-sm mb-8">
            {searchQuery 
              ? (t.studentPages?.courses?.trySearchKeywords || 'حاول استخدام كلمات مفتاحية مختلفة للبحث.')
              : (t.academy?.exploreAndEnroll || 'استكشف مكتبتنا الغنية بالدورات وابدأ رحلة التعلم الآن.')}
          </p>
          {!searchQuery && (
            <Link
              href="/academy/student/courses/browse"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
            >
              <Compass className="w-5 h-5" />
              {t.studentPages?.courses?.browseAvailableCourses || 'تصفح الدورات المتاحة'}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/academy/student/courses/${course.id}`}
              className="group flex flex-col bg-card rounded-3xl border border-border/60 overflow-hidden hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Premium Thumbnail */}
              <div className="relative h-48 sm:h-52 bg-muted overflow-hidden shrink-0">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                    <BookOpen className="w-16 h-16 text-blue-500/20" />
                  </div>
                )}
                
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-500" />
                
                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold shadow-sm border backdrop-blur-md",
                    levelColors[course.level]
                  )}>
                    {levelLabels[course.level]}
                  </span>
                </div>

                {course.status === 'completed' && (
                  <div className="absolute top-4 left-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg border border-emerald-400">
                    <Award className="w-4 h-4" />
                  </div>
                )}
                
                {/* Title inside Thumbnail */}
                <div className="absolute bottom-4 right-4 left-4">
                  <h3 className="font-bold text-white text-lg sm:text-xl leading-snug line-clamp-2 group-hover:text-blue-200 transition-colors">
                    {course.title}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-col flex-1 p-5 sm:p-6 bg-card relative">
                {course.teacher_name && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      {course.teacher_name}
                    </p>
                  </div>
                )}

                <div className="mt-auto">
                  {/* Progress Section */}
                  <div className="mb-4 bg-muted/30 rounded-2xl p-4 border border-border/50">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-bold text-foreground">
                        {course.status === 'completed' 
                          ? (t.studentPages?.courses?.completedSuccessfully || 'مكتملة بنجاح') 
                          : (t.studentPages?.courses?.progressLabel || 'نسبة الإنجاز')}
                      </span>
                      <span className={cn(
                        "font-black",
                        course.status === 'completed' ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                      )}>
                        {course.progress_percent}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                          course.status === 'completed' 
                            ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
                            : "bg-gradient-to-r from-blue-500 to-indigo-500"
                        )}
                        style={{ width: `${course.progress_percent}%` }}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                      </div>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      {(t.studentPages?.courses?.lessonsCount || '{completed} من {total} دروس')
                        .replace('{completed}', String(course.completed_lessons))
                        .replace('{total}', String(course.total_lessons))}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  GraduationCap, Plus, Loader2, Users, CheckCircle2, Eye, EyeOff, Trash2,
  ChevronRight, Layers, BarChart3, BookOpen, Search,
} from "lucide-react"
import { PathsListSkeleton } from "@/components/ui/skeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

type Path = {
  id: string
  title: string
  description: string | null
  level: string
  total_stages: number
  estimated_days: number | null
  require_audio: boolean
  is_published: boolean
  is_active: boolean
  created_at: string
  stats?: { enrolled: string; active: string; completed: string; avg_progress: string }
}

export default function ReaderLearningPathsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const tp = (t as any).tajweedPaths

  const LEVEL_LABELS: Record<string, string> = {
    beginner: (t.addedTranslations_2026?.['مبتدئ'] || (t.addedTranslations_2026?.['مبتدئ'] || 'مبتدئ')),
    intermediate: (t.addedTranslations_2026?.['متوسط'] || (t.addedTranslations_2026?.['متوسط'] || 'متوسط')),
    advanced: (t.addedTranslations_2026?.['متقدم'] || (t.addedTranslations_2026?.['متقدم'] || 'متقدم')),
  }

  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [migrationMissing, setMigrationMissing] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")

  const [form, setForm] = useState({
    title: "", description: "", level: "beginner",
    require_audio: false, estimated_days: "",
    is_published: false, enrollment_type: "open",
  })

  const filtered = paths.filter(p => {
    if (statusFilter === "published" && !p.is_published) return false
    if (statusFilter === "draft" && p.is_published) return false
    if (query.trim() && !p.title.toLowerCase().includes(query.trim().toLowerCase())) return false
    return true
  })

  const totals = {
    paths: paths.length,
    published: paths.filter(p => p.is_published).length,
    enrolled: paths.reduce((s, p) => s + (Number(p.stats?.enrolled) || 0), 0),
    stages: paths.reduce((s, p) => s + (Number(p.total_stages) || 0), 0),
  }

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/reader/tajweed-paths?include_stats=1&scope=tajweed")
      const data = await res.json()
      if (data.notice === "migration_not_applied") setMigrationMissing(true)
      setPaths(data.paths || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function submit() {
    if (!form.title.trim()) {
      toast.error((t.addedTranslations_2026?.['اكتب عنوان المسار أولاً'] || (t.addedTranslations_2026?.['اكتب عنوان المسار أولاً'] || 'اكتب عنوان المسار أولاً')))
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/reader/tajweed-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          level: form.level,
          subject: "tajweed",
          require_audio: form.require_audio,
          estimated_days: form.estimated_days ? parseInt(form.estimated_days, 10) : null,
          is_published: form.is_published,
          enrollment_type: form.enrollment_type,
          seed_default_stages: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || ((t.addedTranslations_2026?.['فشل إنشاء المسار'] || (t.addedTranslations_2026?.['فشل إنشاء المسار'] || 'فشل إنشاء المسار'))))
        return
      }
      toast.success(form.is_published 
        ? ((t.addedTranslations_2026?.['تم إنشاء المسار ونُشر للطلاب'] || (t.addedTranslations_2026?.['تم إنشاء المسار ونُشر للطلاب'] || 'تم إنشاء المسار ونُشر للطلاب'))) 
        : ((t.addedTranslations_2026?.['تم إنشاء المسار كمسودة'] || (t.addedTranslations_2026?.['تم إنشاء المسار كمسودة'] || 'تم إنشاء المسار كمسودة'))))
      setOpenCreate(false)
      setForm({ title: "", description: "", level: "beginner", require_audio: false, estimated_days: "", is_published: false, enrollment_type: "open" })
      await load()
    } catch {
      toast.error((t.addedTranslations_2026?.['تعذّر الاتصال بالخادم'] || (t.addedTranslations_2026?.['تعذّر الاتصال بالخادم'] || 'تعذّر الاتصال بالخادم')))
    } finally {
      setCreating(false)
    }
  }

  async function togglePublish(p: Path) {
    const next = !p.is_published
    await fetch(`/api/reader/tajweed-paths/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: next }),
    })
    toast.success(next 
      ? ((t.addedTranslations_2026?.['تم نشر المسار للطلاب'] || (t.addedTranslations_2026?.['تم نشر المسار للطلاب'] || 'تم نشر المسار للطلاب'))) 
      : ((t.addedTranslations_2026?.['تم إخفاء المسار'] || (t.addedTranslations_2026?.['تم إخفاء المسار'] || 'تم إخفاء المسار'))))
    await load()
  }

  async function remove(p: Path) {
    const confirmMsg = (t.addedTranslations_2026?.['حذف المسار "${p.title}" نهائياً؟ سيُحذف معه تقدّم الطلاب المشتركين.'] || 'حذف المسار "${p.title}" نهائياً؟ سيُحذف معه تقدّم الطلاب المشتركين.')
    if (!confirm(confirmMsg)) return
    const res = await fetch(`/api/reader/tajweed-paths/${p.id}`, { method: "DELETE" })
    if (res.ok) toast.success((t.addedTranslations_2026?.['تم حذف المسار'] || (t.addedTranslations_2026?.['تم حذف المسار'] || 'تم حذف المسار')))
    else toast.error((t.addedTranslations_2026?.['تعذّر حذف المسار'] || (t.addedTranslations_2026?.['تعذّر حذف المسار'] || 'تعذّر حذف المسار')))
    await load()
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </span>
            {(t.addedTranslations_2026?.['مسارات التعلم'] || (t.addedTranslations_2026?.['مسارات التعلم'] || 'مسارات التعلم'))}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {(t.addedTranslations_2026?.['أنشئ مسارات تعلم متدرجة لطلابك — كل مرحلة (درس) تُفتح بعد اجتياز التي قبلها.'] || (t.addedTranslations_2026?.['أنشئ مسارات تعلم متدرجة لطلابك — كل مرحلة (درس) تُفتح بعد اجتياز التي قبلها.'] || 'أنشئ مسارات تعلم متدرجة لطلابك — كل مرحلة (درس) تُفتح بعد اجتياز التي قبلها.'))}
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2 shadow-sm rounded-xl px-6 py-5 h-auto text-base font-semibold">
          <Plus className="h-5 w-5" /> {(t.addedTranslations_2026?.['إنشاء مسار جديد'] || (t.addedTranslations_2026?.['إنشاء مسار جديد'] || 'إنشاء مسار جديد'))}
        </Button>
      </div>

      {migrationMissing && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2 rounded-xl">
          {tp?.migrationMissingPrefix || ((t.addedTranslations_2026?.['الرجاء تشغيل ملف الهجرة:'] || (t.addedTranslations_2026?.['الرجاء تشغيل ملف الهجرة:'] || 'الرجاء تشغيل ملف الهجرة:')))}
          <code className="bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded text-xs font-mono">scripts/023-tajweed-paths.sql</code>
        </Card>
      )}

      {loading ? (
        <PathsListSkeleton />
      ) : paths.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card/50 border border-dashed border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">{(t.addedTranslations_2026?.['لم تنشئ أي مسار تعلم بعد'] || (t.addedTranslations_2026?.['لم تنشئ أي مسار تعلم بعد'] || 'لم تنشئ أي مسار تعلم بعد'))}</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {(t.addedTranslations_2026?.['ابدأ بإنشاء مسار، ثم أضف مراحله (دروسه) واحدة تلو الأخرى — تماماً كإنشاء دروس داخل دورة.'] || (t.addedTranslations_2026?.['ابدأ بإنشاء مسار، ثم أضف مراحله (دروسه) واحدة تلو الأخرى — تماماً كإنشاء دروس داخل دورة.'] || 'ابدأ بإنشاء مسار، ثم أضف مراحله (دروسه) واحدة تلو الأخرى — تماماً كإنشاء دروس داخل دورة.'))}
          </p>
          <Button onClick={() => setOpenCreate(true)} className="gap-2 rounded-xl px-6">
            <Plus className="h-4 w-4" /> {(t.addedTranslations_2026?.['إنشاء مسار تعلم'] || (t.addedTranslations_2026?.['إنشاء مسار تعلم'] || 'إنشاء مسار تعلم'))}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: (t.addedTranslations_2026?.['إجمالي المسارات'] || (t.addedTranslations_2026?.['إجمالي المسارات'] || 'إجمالي المسارات')), value: totals.paths, icon: Layers, tone: "text-primary bg-primary/10 border-primary/20" },
              { label: (t.addedTranslations_2026?.['المسارات المنشورة'] || (t.addedTranslations_2026?.['المسارات المنشورة'] || 'المسارات المنشورة')), value: totals.published, icon: Eye, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
              { label: (t.addedTranslations_2026?.['إجمالي المشتركين'] || (t.addedTranslations_2026?.['إجمالي المشتركين'] || 'إجمالي المشتركين')), value: totals.enrolled, icon: Users, tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { label: (t.addedTranslations_2026?.['إجمالي المراحل'] || (t.addedTranslations_2026?.['إجمالي المراحل'] || 'إجمالي المراحل')), value: totals.stages, icon: BookOpen, tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
            ].map((s, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow transition-shadow">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", s.tone)}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground leading-none mb-1">{s.value}</div>
                  <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="p-2 bg-muted/20 border border-border/50 rounded-xl flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={(t.addedTranslations_2026?.['ابحث عن مسار بالاسم...'] || (t.addedTranslations_2026?.['ابحث عن مسار بالاسم...'] || 'ابحث عن مسار بالاسم...'))}
                className="ps-9 border-0 bg-background shadow-sm rounded-lg h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background border-0 shadow-sm rounded-lg h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{(t.addedTranslations_2026?.['كل المسارات'] || (t.addedTranslations_2026?.['كل المسارات'] || 'كل المسارات'))}</SelectItem>
                <SelectItem value="published">{(t.addedTranslations_2026?.['المنشورة فقط'] || (t.addedTranslations_2026?.['المنشورة فقط'] || 'المنشورة فقط'))}</SelectItem>
                <SelectItem value="draft">{(t.addedTranslations_2026?.['المسودات فقط'] || (t.addedTranslations_2026?.['المسودات فقط'] || 'المسودات فقط'))}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              {(t.addedTranslations_2026?.['لا توجد مسارات مطابقة لبحثك.'] || (t.addedTranslations_2026?.['لا توجد مسارات مطابقة لبحثك.'] || 'لا توجد مسارات مطابقة لبحثك.'))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(p => (
                <div key={p.id} className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md flex flex-col">
                  {/* Card Header */}
                  <div className="p-5 border-b border-border/40 bg-muted/10 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/reader/learning-paths/${p.id}`} className="font-bold text-lg leading-snug text-foreground hover:text-primary transition-colors line-clamp-2">
                        {p.title}
                      </Link>
                      {p.is_published ? (
                        <div className="shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {(t.addedTranslations_2026?.['منشور'] || (t.addedTranslations_2026?.['منشور'] || 'منشور'))}
                        </div>
                      ) : (
                        <div className="shrink-0 bg-muted text-muted-foreground border border-border/50 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <EyeOff className="h-3 w-3" /> {(t.addedTranslations_2026?.['مسودة'] || (t.addedTranslations_2026?.['مسودة'] || 'مسودة'))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/10 font-semibold text-xs">
                        {LEVEL_LABELS[p.level] || p.level}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {p.total_stages} {(t.addedTranslations_2026?.['مرحلة'] || (t.addedTranslations_2026?.['مرحلة'] || 'مرحلة'))}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {p.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic">{(t.addedTranslations_2026?.['لا يوجد وصف للمسار.'] || (t.addedTranslations_2026?.['لا يوجد وصف للمسار.'] || 'لا يوجد وصف للمسار.'))}</p>
                    )}

                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50 flex justify-around text-center">
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground flex items-center justify-center gap-1 uppercase tracking-wider">
                          <Users className="h-3 w-3" /> {(t.addedTranslations_2026?.['مشترك'] || (t.addedTranslations_2026?.['مشترك'] || 'مشترك'))}
                        </div>
                        <div className="text-base font-bold text-foreground">{p.stats?.enrolled || "0"}</div>
                      </div>
                      <div className="w-px bg-border/50"></div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground flex items-center justify-center gap-1 uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3" /> {(t.addedTranslations_2026?.['أتموا'] || (t.addedTranslations_2026?.['أتموا'] || 'أتموا'))}
                        </div>
                        <div className="text-base font-bold text-foreground">{p.stats?.completed || "0"}</div>
                      </div>
                      <div className="w-px bg-border/50"></div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground flex items-center justify-center gap-1 uppercase tracking-wider">
                          <BarChart3 className="h-3 w-3" /> {(t.addedTranslations_2026?.['متوسط'] || (t.addedTranslations_2026?.['متوسط'] || 'متوسط'))}
                        </div>
                        <div className="text-base font-bold text-foreground">{p.stats?.avg_progress || "0"}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 bg-muted/5 border-t border-border/40 flex items-center gap-2">
                    <Button asChild className="flex-1 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" size="sm">
                      <Link href={`/reader/learning-paths/${p.id}`}>
                        {(t.addedTranslations_2026?.['إدارة المسار'] || (t.addedTranslations_2026?.['إدارة المسار'] || 'إدارة المسار'))} <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => togglePublish(p)}
                      className="rounded-lg border-border/50 font-semibold text-xs px-3"
                    >
                      {p.is_published ? ((t.addedTranslations_2026?.['إخفاء'] || (t.addedTranslations_2026?.['إخفاء'] || 'إخفاء'))) : ((t.addedTranslations_2026?.['نشر'] || (t.addedTranslations_2026?.['نشر'] || 'نشر')))}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(p)} 
                      className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-xl rounded-2xl" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl">{(t.addedTranslations_2026?.['إنشاء مسار تعلم جديد'] || (t.addedTranslations_2026?.['إنشاء مسار تعلم جديد'] || 'إنشاء مسار تعلم جديد'))}</DialogTitle>
            <DialogDescription>
              {(t.addedTranslations_2026?.['أنشئ المسار الآن، ثم افتحه لإضافة مراحله (دروسه) خطوة بخطوة.'] || (t.addedTranslations_2026?.['أنشئ المسار الآن، ثم افتحه لإضافة مراحله (دروسه) خطوة بخطوة.'] || 'أنشئ المسار الآن، ثم افتحه لإضافة مراحله (دروسه) خطوة بخطوة.'))}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="font-semibold">{(t.addedTranslations_2026?.['عنوان المسار'] || (t.addedTranslations_2026?.['عنوان المسار'] || 'عنوان المسار'))}</Label>
              <Input 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })} 
                placeholder={(t.addedTranslations_2026?.['مثلاً: أساسيات التجويد'] || (t.addedTranslations_2026?.['مثلاً: أساسيات التجويد'] || 'مثلاً: أساسيات التجويد'))} 
                className="h-11 rounded-lg focus-visible:ring-primary/20"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="font-semibold">{(t.addedTranslations_2026?.['الوصف (اختياري)'] || (t.addedTranslations_2026?.['الوصف (اختياري)'] || 'الوصف (اختياري)'))}</Label>
              <Textarea 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                rows={2} 
                placeholder={(t.addedTranslations_2026?.['نبذة قصيرة عن المسار'] || (t.addedTranslations_2026?.['نبذة قصيرة عن المسار'] || 'نبذة قصيرة عن المسار'))} 
                className="resize-none rounded-lg focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">{(t.addedTranslations_2026?.['المستوى'] || (t.addedTranslations_2026?.['المستوى'] || 'المستوى'))}</Label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                <SelectTrigger className="h-11 rounded-lg focus:ring-primary/20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{(t.addedTranslations_2026?.['مبتدئ'] || (t.addedTranslations_2026?.['مبتدئ'] || 'مبتدئ'))}</SelectItem>
                  <SelectItem value="intermediate">{(t.addedTranslations_2026?.['متوسط'] || (t.addedTranslations_2026?.['متوسط'] || 'متوسط'))}</SelectItem>
                  <SelectItem value="advanced">{(t.addedTranslations_2026?.['متقدم'] || (t.addedTranslations_2026?.['متقدم'] || 'متقدم'))}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">{(t.addedTranslations_2026?.['المدة المتوقعة (أيام)'] || (t.addedTranslations_2026?.['المدة المتوقعة (أيام)'] || 'المدة المتوقعة (أيام)'))}</Label>
              <Input 
                type="number" min="1" 
                value={form.estimated_days} 
                onChange={e => setForm({ ...form, estimated_days: e.target.value })} 
                placeholder={(t.addedTranslations_2026?.['اختياري'] || (t.addedTranslations_2026?.['اختياري'] || 'اختياري'))} 
                className="h-11 rounded-lg focus-visible:ring-primary/20"
              />
            </div>
            <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 p-4">
              <input id="rt_aud" type="checkbox" className="mt-1 h-4 w-4 accent-primary rounded" checked={form.require_audio} onChange={e => setForm({ ...form, require_audio: e.target.checked })} />
              <div>
                <Label htmlFor="rt_aud" className="cursor-pointer font-semibold text-base block">{(t.addedTranslations_2026?.['تفعيل التقييم الصوتي الإلزامي'] || (t.addedTranslations_2026?.['تفعيل التقييم الصوتي الإلزامي'] || 'تفعيل التقييم الصوتي الإلزامي'))}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{(t.addedTranslations_2026?.['يتطلب من الطالب رفع تسجيل صوتي لاجتياز كل مرحلة.'] || (t.addedTranslations_2026?.['يتطلب من الطالب رفع تسجيل صوتي لاجتياز كل مرحلة.'] || 'يتطلب من الطالب رفع تسجيل صوتي لاجتياز كل مرحلة.'))}</p>
              </div>
            </div>
            <div className="md:col-span-2 grid gap-2">
              <Label className="font-semibold text-base">{(t.addedTranslations_2026?.['طريقة الالتحاق بالمسار'] || (t.addedTranslations_2026?.['طريقة الالتحاق بالمسار'] || 'طريقة الالتحاق بالمسار'))}</Label>
              <Select value={form.enrollment_type} onValueChange={v => setForm({ ...form, enrollment_type: v })}>
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{(t.addedTranslations_2026?.['التحاق مباشر — يبدأ الطالب فوراً'] || (t.addedTranslations_2026?.['التحاق مباشر — يبدأ الطالب فوراً'] || 'التحاق مباشر — يبدأ الطالب فوراً'))}</SelectItem>
                  <SelectItem value="approval">{(t.addedTranslations_2026?.['يتطلب موافقتك — يصل طلب الالتحاق لمراجعتك'] || (t.addedTranslations_2026?.['يتطلب موافقتك — يصل طلب الالتحاق لمراجعتك'] || 'يتطلب موافقتك — يصل طلب الالتحاق لمراجعتك'))}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.enrollment_type === "approval"
                  ? ((t.addedTranslations_2026?.['لن يبدأ الطالب المسار إلا بعد موافقتك على طلب الالتحاق.'] || (t.addedTranslations_2026?.['لن يبدأ الطالب المسار إلا بعد موافقتك على طلب الالتحاق.'] || 'لن يبدأ الطالب المسار إلا بعد موافقتك على طلب الالتحاق.')))
                  : ((t.addedTranslations_2026?.['يدخل الطالب المسار ويبدأ المراحل مباشرة دون موافقة.'] || (t.addedTranslations_2026?.['يدخل الطالب المسار ويبدأ المراحل مباشرة دون موافقة.'] || 'يدخل الطالب المسار ويبدأ المراحل مباشرة دون موافقة.')))}
              </p>
            </div>
            <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-border/50 bg-emerald-500/5 p-4">
              <input id="rt_pub" type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600 rounded" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
              <div>
                <Label htmlFor="rt_pub" className="cursor-pointer font-semibold text-base text-emerald-800 dark:text-emerald-400 block flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {(t.addedTranslations_2026?.['نشر المسار للطلاب فوراً'] || (t.addedTranslations_2026?.['نشر المسار للطلاب فوراً'] || 'نشر المسار للطلاب فوراً'))}
                </Label>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">{(t.addedTranslations_2026?.['سيتمكن الطلاب من رؤية المسار والاشتراك فيه.'] || (t.addedTranslations_2026?.['سيتمكن الطلاب من رؤية المسار والاشتراك فيه.'] || 'سيتمكن الطلاب من رؤية المسار والاشتراك فيه.'))}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50 mt-2">
            <Button variant="ghost" onClick={() => setOpenCreate(false)} className="rounded-lg font-semibold">{(t.addedTranslations_2026?.['إلغاء'] || (t.addedTranslations_2026?.['إلغاء'] || 'إلغاء'))}</Button>
            <Button onClick={submit} disabled={creating || !form.title.trim()} className="gap-2 rounded-lg font-bold">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {(t.addedTranslations_2026?.['إنشاء المسار'] || (t.addedTranslations_2026?.['إنشاء المسار'] || 'إنشاء المسار'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

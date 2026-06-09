"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  GraduationCap, Plus, Loader2, Users, CheckCircle2, Eye, EyeOff, Trash2,
  ChevronRight, Layers, BarChart3, BookOpen, Search,
} from "lucide-react"
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

const LEVEL_LABELS: Record<string, string> = {
  beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم",
}

export default function ReaderLearningPathsPage() {
  const { t } = useI18n()
  const tp = (t as any).tajweedPaths

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
    is_published: false,
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
      toast.error("اكتب عنوان المسار أولاً")
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
          seed_default_stages: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "فشل إنشاء المسار")
        return
      }
      toast.success(form.is_published ? "تم إنشاء المسار ونُشر للطلاب" : "تم إنشاء المسار كمسودة")
      setOpenCreate(false)
      setForm({ title: "", description: "", level: "beginner", require_audio: false, estimated_days: "", is_published: false })
      await load()
    } catch {
      toast.error("تعذّر الاتصال بالخادم")
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
    toast.success(next ? "تم نشر المسار للطلاب" : "تم إخفاء المسار")
    await load()
  }

  async function remove(p: Path) {
    if (!confirm(`حذف المسار "${p.title}" نهائياً؟ سيُحذف معه تقدّم الطلاب المشتركين.`)) return
    const res = await fetch(`/api/reader/tajweed-paths/${p.id}`, { method: "DELETE" })
    if (res.ok) toast.success("تم حذف المسار")
    else toast.error("تعذّر حذف المسار")
    await load()
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </span>
            مسارات التعلم
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            أنشئ مسارات تعلم متدرجة لطلابك — كل مرحلة (درس) تُفتح بعد اجتياز التي قبلها.
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> إنشاء مسار تعلم
        </Button>
      </div>

      {migrationMissing && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-sm text-foreground">
          {tp.migrationMissingPrefix}
          <code className="bg-amber-500/15 px-2 py-0.5 mx-1 rounded">scripts/023-tajweed-paths.sql</code>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : paths.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 text-primary mb-4">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold">لم تنشئ أي مسار تعلم بعد</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-md mx-auto">
            ابدأ بإنشاء مسار، ثم أضف مراحله (دروسه) واحدة تلو الأخرى — تماماً كإنشاء دروس داخل دورة.
          </p>
          <Button onClick={() => setOpenCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> إنشاء مسار تعلم
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "إجمالي المسارات", value: totals.paths, icon: Layers, tone: "text-primary bg-primary/10" },
              { label: "المنشورة", value: totals.published, icon: Eye, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
              { label: "إجمالي المشتركين", value: totals.enrolled, icon: Users, tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
              { label: "إجمالي المراحل", value: totals.stages, icon: BookOpen, tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
            ].map((s, i) => (
              <Card key={i} className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-black leading-none">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">{s.label}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ابحث عن مسار..."
                className="ps-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="published">منشور</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">لا توجد مسارات مطابقة لبحثك.</Card>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <Card key={p.id} className="p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                <div className="flex-1 min-w-0">
                  <Link href={`/reader/learning-paths/${p.id}`} className="font-semibold text-lg hover:text-primary line-clamp-2 transition-colors">
                    {p.title}
                  </Link>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="border-primary/30 text-primary">{LEVEL_LABELS[p.level] || p.level}</Badge>
                    <Badge variant="secondary">{p.total_stages} مرحلة</Badge>
                    {p.is_published ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15">
                        <Eye className="h-3 w-3 me-1" /> منشور
                      </Badge>
                    ) : (
                      <Badge variant="outline"><EyeOff className="h-3 w-3 me-1" /> مسودة</Badge>
                    )}
                  </div>
                </div>

                {p.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{p.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="border rounded-xl p-2">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="h-3 w-3" /> مشترك</div>
                    <div className="text-lg font-semibold">{p.stats?.enrolled || "0"}</div>
                  </div>
                  <div className="border rounded-xl p-2">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3" /> أتموا</div>
                    <div className="text-lg font-semibold">{p.stats?.completed || "0"}</div>
                  </div>
                  <div className="border rounded-xl p-2">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><BarChart3 className="h-3 w-3" /> متوسط %</div>
                    <div className="text-lg font-semibold">{p.stats?.avg_progress || "0"}%</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/reader/learning-paths/${p.id}`}>
                      إدارة <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                    </Link>
                  </Button>
                  <Button variant={p.is_published ? "secondary" : "default"} size="sm" onClick={() => togglePublish(p)}>
                    {p.is_published ? "إخفاء" : "نشر"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          )}
        </>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>إنشاء مسار تعلم جديد</DialogTitle>
            <DialogDescription>
              أنشئ المسار الآن، ثم افتحه لإضافة مراحله (دروسه) خطوة بخطوة.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1">
              <Label>عنوان المسار</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثلاً: أساسيات التجويد" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>الوصف (اختياري)</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="نبذة قصيرة عن المسار" />
            </div>
            <div className="space-y-1">
              <Label>المستوى</Label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>المدة المتوقعة (أيام)</Label>
              <Input type="number" min="1" value={form.estimated_days} onChange={e => setForm({ ...form, estimated_days: e.target.value })} placeholder="اختياري" />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 rounded-xl border p-3">
              <input id="rt_aud" type="checkbox" className="h-4 w-4 accent-primary" checked={form.require_audio} onChange={e => setForm({ ...form, require_audio: e.target.checked })} />
              <Label htmlFor="rt_aud" className="cursor-pointer">يتطلب تسجيل صوتي قبل إتمام كل مرحلة</Label>
            </div>
            <div className="md:col-span-2 flex items-center gap-2 rounded-xl border p-3">
              <input id="rt_pub" type="checkbox" className="h-4 w-4 accent-primary" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
              <Label htmlFor="rt_pub" className="cursor-pointer flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-muted-foreground" /> نشر المسار للطلاب فوراً
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>إلغاء</Button>
            <Button onClick={submit} disabled={creating || !form.title.trim()} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء المسار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

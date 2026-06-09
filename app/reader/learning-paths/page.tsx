"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  GraduationCap, Plus, Loader2, Users, CheckCircle2, Eye, EyeOff, Trash2,
  ChevronRight, Search, BookOpen, BarChart3, Layers,
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
  thumbnail_url?: string | null
  stats?: { enrolled: string; active: string; completed: string; avg_progress: string }
}

const LEVELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
}

const initialForm = {
  title: "",
  description: "",
  level: "beginner",
  require_audio: false,
  estimated_days: "",
  is_published: false,
}

export default function ReaderLearningPathsPage() {
  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [migrationMissing, setMigrationMissing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")
  const [form, setForm] = useState(initialForm)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/reader/tajweed-paths?include_stats=1&scope=tajweed")
      const data = await res.json()
      if (data.notice === "migration_not_applied") setMigrationMissing(true)
      setPaths(data.paths || [])
    } catch {
      toast.error("تعذر تحميل المسارات")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return paths.filter(p => {
      if (statusFilter === "published" && !p.is_published) return false
      if (statusFilter === "draft" && p.is_published) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        return (
          p.title.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [paths, statusFilter, search])

  const totals = useMemo(() => {
    const published = paths.filter(p => p.is_published).length
    const stages = paths.reduce((s, p) => s + (p.total_stages || 0), 0)
    const enrolled = paths.reduce((s, p) => s + parseInt(p.stats?.enrolled || "0", 10), 0)
    return { count: paths.length, published, stages, enrolled }
  }, [paths])

  async function submit() {
    if (!form.title.trim()) return
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
          // Standalone lessons only — no auto-seeded default stages.
          seed_default_stages: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "فشل إنشاء المسار")
        return
      }
      toast.success("تم إنشاء المسار — أضف الدروس الآن")
      setOpenCreate(false)
      setForm(initialForm)
      await load()
    } finally {
      setCreating(false)
    }
  }

  async function togglePublish(p: Path) {
    const res = await fetch(`/api/reader/tajweed-paths/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !p.is_published }),
    })
    if (res.ok) {
      toast.success(p.is_published ? "تم إخفاء المسار" : "تم نشر المسار")
      await load()
    } else {
      toast.error("تعذر تحديث حالة النشر")
    }
  }

  async function remove(p: Path) {
    if (!confirm(`حذف المسار "${p.title}"؟ لا يمكن التراجع.`)) return
    const res = await fetch(`/api/reader/tajweed-paths/${p.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("تم حذف المسار")
      await load()
    } else {
      toast.error("تعذر حذف المسار")
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> مسارات التعلم
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            أنشئ مسارات تعلم متدرجة — كل مرحلة درس مستقل يفتح بعد اجتياز السابق.
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> إنشاء مسار
        </Button>
      </div>

      {migrationMissing && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-sm text-amber-900">
          الميجريشن لم يُشغّل بعد. راسل الإدارة لتشغيل
          <code className="bg-amber-100 px-2 py-0.5 mx-1 rounded">scripts/023-tajweed-paths.sql</code>
        </Card>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> المسارات</div>
          <div className="text-2xl font-bold mt-1">{totals.count}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> منشورة</div>
          <div className="text-2xl font-bold mt-1 text-primary">{totals.published}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> إجمالي الدروس</div>
          <div className="text-2xl font-bold mt-1">{totals.stages}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> المشتركون</div>
          <div className="text-2xl font-bold mt-1">{totals.enrolled}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن مسار..."
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="published">منشورة</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {paths.length === 0 ? "لم تنشئ أي مسار بعد — اضغط \"إنشاء مسار\" للبدء." : "لا نتائج مطابقة للبحث."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <Link href={`/reader/learning-paths/${p.id}`} className="block">
                <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                  {p.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <GraduationCap className="h-10 w-10 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    {p.is_published ? (
                      <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary/90">
                        <Eye className="h-3 w-3 me-1" /> منشور
                      </Badge>
                    ) : (
                      <Badge variant="secondary"><EyeOff className="h-3 w-3 me-1" /> مسودة</Badge>
                    )}
                  </div>
                </div>
              </Link>

              <div className="p-4 flex flex-col flex-1">
                <Link href={`/reader/learning-paths/${p.id}`} className="font-semibold text-lg hover:text-primary line-clamp-2">
                  {p.title}
                </Link>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline">{LEVELS[p.level] || p.level}</Badge>
                  <Badge variant="secondary">{p.total_stages} درس</Badge>
                </div>

                {p.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{p.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="border rounded-lg p-2">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="h-3 w-3" /> مشترك</div>
                    <div className="text-lg font-semibold">{p.stats?.enrolled || "0"}</div>
                  </div>
                  <div className="border rounded-lg p-2">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3" /> أتموا</div>
                    <div className="text-lg font-semibold">{p.stats?.completed || "0"}</div>
                  </div>
                  <div className="border rounded-lg p-2">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><BarChart3 className="h-3 w-3" /> متوسط</div>
                    <div className="text-lg font-semibold">{p.stats?.avg_progress || "0"}%</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-1">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/reader/learning-paths/${p.id}`}>
                      إدارة <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                    </Link>
                  </Button>
                  <Button variant={p.is_published ? "secondary" : "default"} size="sm" onClick={() => togglePublish(p)}>
                    {p.is_published ? "إخفاء" : "نشر"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p)} title="حذف">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>إنشاء مسار تعلم جديد</DialogTitle>
            <DialogDescription>
              ابدأ بمسار فارغ ثم أضف الدروس (المراحل) واحداً تلو الآخر.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1">
              <Label>عنوان المسار</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثلا: أساسيات التلاوة" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
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
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="lp_aud" type="checkbox" className="h-4 w-4" checked={form.require_audio} onChange={e => setForm({ ...form, require_audio: e.target.checked })} />
              <Label htmlFor="lp_aud" className="cursor-pointer">يتطلب تسجيل صوتي قبل اجتياز كل مرحلة</Label>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="lp_pub" type="checkbox" className="h-4 w-4" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
              <Label htmlFor="lp_pub" className="cursor-pointer">نشر المسار فوراً للطلاب</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>إلغاء</Button>
            <Button onClick={submit} disabled={creating || !form.title.trim()} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

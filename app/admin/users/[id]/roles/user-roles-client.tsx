"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ShieldCheck, ChevronRight, Check, AlertTriangle, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const PRIMARY_ROLES: { id: string; labelAr: string; descAr: string }[] = [
  { id: "admin", labelAr: "المدير العام (Super Admin)", descAr: "تحكم كامل في المنصة والموقع الخارجي والتصميم." },
  { id: "maqraa_admin", labelAr: "مدير المقرأة", descAr: "إدارة جانب التلاوة والتسميع والمقرئين." },
  { id: "academy_admin", labelAr: "مدير الأكاديمية", descAr: "إدارة الدورات والطلاب والمعلمين." },
  { id: "student_supervisor", labelAr: "مشرف الطلاب", descAr: "متابعة الطلاب ومهام الإشراف." },
  { id: "reciter_supervisor", labelAr: "مشرف المقرئين", descAr: "متابعة المقرئين وطلبات الانضمام." },
  { id: "student", labelAr: "طالب", descAr: "حساب طالب عادي." },
  { id: "reader", labelAr: "مقرئ معتمد", descAr: "حساب مقرئ يقيّم التلاوات." },
]

const ACADEMY_ROLES: { id: string; labelAr: string }[] = [
  { id: "maqraa_admin", labelAr: "مدير المقرأة" },
  { id: "academy_admin", labelAr: "مدير الأكاديمية" },
  { id: "teacher", labelAr: "معلم" },
  { id: "content_supervisor", labelAr: "مشرف المحتوى" },
  { id: "fiqh_supervisor", labelAr: "مشرف الفقه" },
  { id: "quality_supervisor", labelAr: "مشرف الجودة" },
  { id: "supervisor", labelAr: "مشرف عام" },
]

type UserData = {
  id: string
  name: string
  email: string
  role: string
  academy_roles: string[]
}

export function UserRolesClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [role, setRole] = useState("")
  const [academyRoles, setAcademyRoles] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/users/${userId}/roles`)
        if (!res.ok) throw new Error("تعذر تحميل بيانات المستخدم")
        const json = await res.json()
        setUser(json.user)
        setRole(json.user.role)
        setAcademyRoles(json.user.academy_roles ?? [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  function toggleAcademyRole(id: string) {
    setAcademyRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, academyRoles }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "تعذر حفظ التغييرات")
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <p className="text-lg font-bold">{error || "المستخدم غير موجود"}</p>
        <Button onClick={() => router.back()} variant="outline">
          رجوع
        </Button>
      </div>
    )
  }

  const isSuperSelected = role === "admin"

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/role-management" className="transition-colors hover:text-primary">
          إدارة الأدوار
        </Link>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        <span className="font-bold text-foreground">{user.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">تعيين الأدوار</h1>
          <p className="text-sm text-muted-foreground">
            {user.name} · {user.email}
          </p>
        </div>
      </div>

      {/* Primary role */}
      <Card className="rounded-3xl border border-border bg-card/60">
        <CardHeader>
          <CardTitle className="text-base font-black text-foreground">الدور الأساسي</CardTitle>
          <p className="text-xs text-muted-foreground">
            يحدد الدور الأساسي لوحة التحكم الافتراضية للمستخدم وصلاحياته الرئيسية.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PRIMARY_ROLES.map((r) => {
              const selected = role === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-right transition-all active:scale-[0.98] ${
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-foreground">{r.labelAr}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">{r.descAr}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Secondary academy roles */}
      <Card className="rounded-3xl border border-border bg-card/60">
        <CardHeader>
          <CardTitle className="text-base font-black text-foreground">أدوار إضافية</CardTitle>
          <p className="text-xs text-muted-foreground">
            صلاحيات إضافية يملكها المستخدم بجانب دوره الأساسي (مثلاً مدير عام يدير المقرأة أيضاً).
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ACADEMY_ROLES.map((r) => {
              const active = academyRoles.includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleAcademyRole(r.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {r.labelAr}
                </button>
              )
            })}
          </div>
          {isSuperSelected && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              المدير العام يملك بالفعل كل الصلاحيات. الأدوار الإضافية اختيارية في هذه الحالة.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Feedback + actions */}
      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" />
          تم حفظ الأدوار بنجاح.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => router.push("/admin/role-management")} className="rounded-xl font-bold">
          إلغاء
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl font-bold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ التغييرات
        </Button>
      </div>
    </div>
  )
}

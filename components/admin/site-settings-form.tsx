"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Clock, Wrench, Share2, Mail, Phone, Save, RefreshCw, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

const TIMEZONES = [
  { value: "Asia/Riyadh", label: "الرياض (UTC+3)" },
  { value: "Africa/Cairo", label: "القاهرة (UTC+2 / +3)" },
  { value: "Asia/Dubai", label: "دبي (UTC+4)" },
  { value: "Asia/Kuwait", label: "الكويت (UTC+3)" },
  { value: "Asia/Baghdad", label: "بغداد (UTC+3)" },
  { value: "Africa/Tunis", label: "تونس (UTC+1)" },
  { value: "Africa/Casablanca", label: "الدار البيضاء (UTC+0/+1)" },
  { value: "UTC", label: "UTC" },
]

const LANGUAGES = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
]

type SiteSettings = {
  site_name?: string
  site_tagline?: string
  site_default_language?: string
  site_timezone?: string
  site_maintenance_enabled?: boolean
  site_maintenance_message?: string
  site_contact_email?: string
  site_contact_phone?: string
  site_social_links?: {
    twitter?: string
    facebook?: string
    instagram?: string
    youtube?: string
  }
}

function extractValue(raw: any): any {
  return raw?.value ?? raw
}

export function SiteSettingsForm() {
  const router = useRouter()
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: "",
    site_tagline: "",
    site_default_language: "ar",
    site_timezone: "Asia/Riyadh",
    site_maintenance_enabled: false,
    site_maintenance_message: "",
    site_contact_email: "",
    site_contact_phone: "",
    site_social_links: {},
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const raw = data.settings
          setSettings({
            site_name: extractValue(raw.site_name) ?? "",
            site_tagline: extractValue(raw.site_tagline) ?? "",
            site_default_language: extractValue(raw.site_default_language) ?? "ar",
            site_timezone: extractValue(raw.site_timezone) ?? "Asia/Riyadh",
            site_maintenance_enabled: extractValue(raw.site_maintenance_enabled) ?? false,
            site_maintenance_message: extractValue(raw.site_maintenance_message) ?? "",
            site_contact_email: extractValue(raw.site_contact_email) ?? "",
            site_contact_phone: extractValue(raw.site_contact_phone) ?? "",
            site_social_links: extractValue(raw.site_social_links) ?? {},
          })
        }
      })
      .catch(() => setError("فشل في تحميل الإعدادات"))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  const updateSocial = (platform: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      site_social_links: { ...(prev.site_social_links ?? {}), [platform]: value },
    }))
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "خطأ غير معروف")
      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
          <AlertDescription>تم حفظ الإعدادات بنجاح.</AlertDescription>
        </Alert>
      )}

      {/* الهوية */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">هوية الموقع</CardTitle>
          </div>
          <CardDescription>الاسم والوصف الظاهران للزوار في المتصفح والشبكات.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="site_name">اسم الموقع</Label>
            <Input
              id="site_name"
              value={settings.site_name ?? ""}
              onChange={(e) => update("site_name", e.target.value)}
              placeholder="إتقان التعليمية"
              dir="rtl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site_tagline">الشعار / الوصف المختصر</Label>
            <Input
              id="site_tagline"
              value={settings.site_tagline ?? ""}
              onChange={(e) => update("site_tagline", e.target.value)}
              placeholder="منصة تعليم القرآن الكريم"
              dir="rtl"
            />
          </div>
        </CardContent>
      </Card>

      {/* اللغة والمنطقة */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">اللغة والمنطقة الزمنية</CardTitle>
          </div>
          <CardDescription>الإعدادات الإقليمية الافتراضية للمنصة.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>اللغة الافتراضية</Label>
            <Select
              value={settings.site_default_language ?? "ar"}
              onValueChange={(v) => update("site_default_language", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>المنطقة الزمنية</Label>
            <Select
              value={settings.site_timezone ?? "Asia/Riyadh"}
              onValueChange={(v) => update("site_timezone", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* وضع الصيانة */}
      <Card className={settings.site_maintenance_enabled ? "border-destructive/50" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">وضع الصيانة</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {settings.site_maintenance_enabled && (
                <Badge variant="destructive" className="text-xs">نشط</Badge>
              )}
              <Switch
                checked={settings.site_maintenance_enabled ?? false}
                onCheckedChange={(v) => update("site_maintenance_enabled", v)}
              />
            </div>
          </div>
          <CardDescription>
            عند التفعيل يُوقف الدخول للمنصتين ويعرض رسالة للزوار.
          </CardDescription>
        </CardHeader>
        {settings.site_maintenance_enabled && (
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="maintenance_msg">رسالة الصيانة</Label>
              <Textarea
                id="maintenance_msg"
                value={settings.site_maintenance_message ?? ""}
                onChange={(e) => update("site_maintenance_message", e.target.value)}
                placeholder="الموقع في وضع الصيانة، نعود قريبًا..."
                rows={2}
                dir="rtl"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* التواصل */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">بيانات التواصل</CardTitle>
          </div>
          <CardDescription>تُستخدم في صفحة التواصل والرسائل التلقائية.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">البريد الإلكتروني</Label>
            <Input
              id="contact_email"
              type="email"
              value={settings.site_contact_email ?? ""}
              onChange={(e) => update("site_contact_email", e.target.value)}
              placeholder="info@itqan.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">رقم الهاتف</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={settings.site_contact_phone ?? ""}
              onChange={(e) => update("site_contact_phone", e.target.value)}
              placeholder="+966500000000"
              dir="ltr"
            />
          </div>
        </CardContent>
      </Card>

      {/* روابط التواصل الاجتماعي */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">روابط التواصل الاجتماعي</CardTitle>
          </div>
          <CardDescription>تظهر في تذييل الموقع وصفحة التواصل.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["twitter", "facebook", "instagram", "youtube"].map((platform) => (
            <div key={platform} className="space-y-1.5">
              <Label htmlFor={platform} className="capitalize">{platform}</Label>
              <Input
                id={platform}
                value={(settings.site_social_links as any)?.[platform] ?? ""}
                onChange={(e) => updateSocial(platform, e.target.value)}
                placeholder={`https://${platform}.com/...`}
                dir="ltr"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-32">
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "جار الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </div>
  )
}

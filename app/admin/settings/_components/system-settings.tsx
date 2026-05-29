"use client"

import { useState } from "react"
import { Globe, Upload, Mail, Phone, Clock, Languages, ArrowLeftRight, Shuffle, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { SectionCard } from "./section-card"

interface Props {
  settings: MaqraahSettings
  metadata: Record<string, { updatedAt?: string; modifiedBy?: string }>
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

const timezones = [
  { value: "Asia/Riyadh", label: "الرياض (GMT+3)" },
  { value: "Asia/Dubai", label: "دبي (GMT+4)" },
  { value: "Africa/Cairo", label: "القاهرة (GMT+2)" },
  { value: "Asia/Amman", label: "عمّان (GMT+3)" },
  { value: "Asia/Beirut", label: "بيروت (GMT+2)" },
  { value: "Asia/Baghdad", label: "بغداد (GMT+3)" },
  { value: "Asia/Kuwait", label: "الكويت (GMT+3)" },
  { value: "Europe/London", label: "لندن (GMT+0)" },
]

const strategies = [
  { value: "least_booked_today", label: "الأقل حجزاً اليوم" },
  { value: "round_robin", label: "بالتناوب" },
  { value: "manual", label: "يدوي" },
  { value: "random", label: "عشوائي" },
]

export function SystemSettings({ settings, metadata, onUpdate, onReset }: Props) {
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("image", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "فشل رفع الملف")
    }
    const data = await res.json()
    return data.url || data.imageUrl || null
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast.error("حجم الشعار يجب أن يكون أقل من 4MB")
      return
    }
    setUploadingLogo(true)
    try {
      const url = await uploadFile(file)
      if (url) {
        onUpdate({ maqraah_general_logo: url })
        toast.success("تم رفع الشعار")
      }
    } catch (err: any) {
      toast.error(err.message || "فشل رفع الشعار")
    } finally {
      setUploadingLogo(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={Globe} title="هوية المقرأة" description="اسم وشعار النظام" onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">اسم المقرأة</Label>
            <Input
              value={settings.maqraah_general_name || ""}
              onChange={(e) => onUpdate({ maqraah_general_name: e.target.value })}
              placeholder="مقرأة إتقان"
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">يظهر في العنوان والإيميلات</p>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">رابط الموقع (App URL)</Label>
            <Input
              dir="ltr"
              value={settings.app_url || ""}
              onChange={(e) => onUpdate({ app_url: e.target.value })}
              placeholder="https://your-domain.com"
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">يُستخدم في روابط الدعوات</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-medium text-sm">شعار المقرأة</Label>
          <div className="flex items-center gap-3">
            {settings.maqraah_general_logo ? (
              <div className="relative">
                <img
                  src={settings.maqraah_general_logo || "/placeholder.svg"}
                  alt="شعار المقرأة"
                  className="w-16 h-16 object-contain rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ maqraah_general_logo: "" })}
                  className="absolute -top-2 -left-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                  aria-label="حذف الشعار"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                {uploadingLogo ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            )}
            <Input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="flex-1"
              disabled={uploadingLogo}
              onChange={handleLogoChange}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">حد أقصى 4MB. PNG/JPG/SVG/WEBP</p>
        </div>

        <div className="space-y-2">
          <Label className="font-medium text-sm">وصف المقرأة</Label>
          <Textarea
            value={settings.maqraah_general_description || ""}
            onChange={(e) => onUpdate({ maqraah_general_description: e.target.value })}
            placeholder="وصف مختصر للمقرأة يظهر في نتائج البحث..."
            className="min-h-[100px] resize-none"
          />
          <p className="text-[11px] text-muted-foreground">للـ SEO meta description</p>
        </div>

        {metadata.maqraah_general_name?.modifiedBy && (
          <p className="text-[11px] text-muted-foreground border-t pt-3 mt-4">
            آخر تعديل بواسطة: {metadata.maqraah_general_name.modifiedBy}
            {metadata.maqraah_general_name.updatedAt && (
              <> • {new Date(metadata.maqraah_general_name.updatedAt).toLocaleString("ar-EG")}</>
            )}
          </p>
        )}
      </SectionCard>

      <SectionCard icon={Mail} title="التواصل" description="معلومات الاتصال الرسمية">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الرسمي
            </Label>
            <Input
              type="email"
              dir="ltr"
              value={settings.maqraah_general_contact_email || ""}
              onChange={(e) => onUpdate({ maqraah_general_contact_email: e.target.value })}
              placeholder="contact@example.com"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Phone className="w-4 h-4" />
              رقم الواتساب
            </Label>
            <Input
              dir="ltr"
              value={settings.maqraah_general_whatsapp || ""}
              onChange={(e) => onUpdate({ maqraah_general_whatsapp: e.target.value })}
              placeholder="+966500000000"
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">اختياري</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Clock} title="التوطين" description="المنطقة الزمنية واللغة">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              المنطقة الزمنية
            </Label>
            <Select
              value={settings.maqraah_general_timezone || "Asia/Riyadh"}
              onValueChange={(v) => onUpdate({ maqraah_general_timezone: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">مهم للجلسات والتذكيرات</p>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <Languages className="w-4 h-4" />
              اللغة الافتراضية
            </Label>
            <Select
              value={settings.maqraah_general_language || "ar"}
              onValueChange={(v) => onUpdate({ maqraah_general_language: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              اتجاه الواجهة
            </Label>
            <Select
              value={settings.maqraah_general_direction || "rtl"}
              onValueChange={(v) => onUpdate({ maqraah_general_direction: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rtl">من اليمين لليسار (RTL)</SelectItem>
                <SelectItem value="ltr">من اليسار لليمين (LTR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Shuffle}
        title="توزيع المقرئين"
        description="كيفية إسناد الطلاب للمقرئين عند الحجز"
      >
        <div className="space-y-2 max-w-sm">
          <Label className="font-medium text-sm">استراتيجية التوزيع</Label>
          <Select
            value={settings.reader_assignment_strategy || "least_booked_today"}
            onValueChange={(v) => onUpdate({ reader_assignment_strategy: v })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">تُطبَّق على الحجوزات الجديدة</p>
        </div>
      </SectionCard>
    </div>
  )
}

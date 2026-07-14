import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface GeneralSettingsProps {
  settings: Record<string, any>
  metadata?: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

/**
 * إعدادات المقرأة العامة — تخصصية للمقرأة فقط.
 * تكتب لمفاتيح maqraah_general_* حصراً (الإعدادات العامة للموقع تخص المدير العام).
 */
export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      {/* هوية المقرأة */}
      <div>
        <h3 className="text-lg font-semibold mb-4">هوية المقرأة</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="maqraah_name">اسم المقرأة</Label>
            <Input
              id="maqraah_name"
              value={settings.maqraah_general_name || ""}
              onChange={(e) => onUpdate("maqraah_general_name", e.target.value)}
              placeholder="مثال: مقرأة إتقان"
            />
          </div>

          <div>
            <Label htmlFor="maqraah_description">وصف المقرأة</Label>
            <Textarea
              id="maqraah_description"
              rows={3}
              value={settings.maqraah_general_description || ""}
              onChange={(e) =>
                onUpdate("maqraah_general_description", e.target.value)
              }
              placeholder="نبذة تعريفية عن المقرأة تظهر للزوار"
            />
          </div>
        </div>
      </div>

      {/* بيانات التواصل */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">بيانات التواصل</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="maqraah_contact_email">البريد الإلكتروني</Label>
            <Input
              id="maqraah_contact_email"
              type="email"
              value={settings.maqraah_general_contact_email || ""}
              onChange={(e) =>
                onUpdate("maqraah_general_contact_email", e.target.value)
              }
              placeholder="support@example.com"
            />
          </div>

          <div>
            <Label htmlFor="maqraah_whatsapp">رقم الواتساب</Label>
            <Input
              id="maqraah_whatsapp"
              value={settings.maqraah_general_whatsapp || ""}
              onChange={(e) =>
                onUpdate("maqraah_general_whatsapp", e.target.value)
              }
              placeholder="+966 55 1234567"
            />
          </div>
        </div>
      </div>

      {/* الإعدادات الإقليمية */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">الإعدادات الإقليمية</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="maqraah_timezone">المنطقة الزمنية</Label>
            <Select
              value={settings.maqraah_general_timezone || "Asia/Riyadh"}
              onValueChange={(value) =>
                onUpdate("maqraah_general_timezone", value)
              }
            >
              <SelectTrigger id="maqraah_timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Riyadh">
                  الرياض (UTC+3)
                </SelectItem>
                <SelectItem value="Asia/Dubai">دبي (UTC+4)</SelectItem>
                <SelectItem value="Africa/Cairo">القاهرة (UTC+2)</SelectItem>
                <SelectItem value="UTC">التوقيت العالمي (UTC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maqraah_language">اللغة الافتراضية</Label>
            <Select
              value={settings.maqraah_general_language || "ar"}
              onValueChange={(value) =>
                onUpdate("maqraah_general_language", value)
              }
            >
              <SelectTrigger id="maqraah_language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maqraah_direction">اتجاه الواجهة</Label>
            <Select
              value={settings.maqraah_general_direction || "rtl"}
              onValueChange={(value) =>
                onUpdate("maqraah_general_direction", value)
              }
            >
              <SelectTrigger id="maqraah_direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rtl">من اليمين لليسار (RTL)</SelectItem>
                <SelectItem value="ltr">من اليسار لليمين (LTR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

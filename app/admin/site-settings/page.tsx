import { Settings2 } from "lucide-react"
import { SiteSettingsForm } from "@/components/admin/site-settings-form"

export const metadata = {
  title: "إعدادات الموقع العامة | لوحة التحكم",
  description: "إعدادات الموقع على مستوى المنصة الكاملة — حصرية للمدير العام.",
}

export default function SiteSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">إعدادات الموقع العامة</h1>
          <p className="text-sm text-muted-foreground">
            تحكم في إعدادات المنصة ككل — تؤثر على المقرأة والأكاديمية معًا.
          </p>
        </div>
      </div>

      <SiteSettingsForm />
    </div>
  )
}

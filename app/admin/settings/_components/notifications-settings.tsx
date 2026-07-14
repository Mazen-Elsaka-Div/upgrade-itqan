"use client"

import { Bell } from "lucide-react"
import { SectionCard, ToggleRow } from "./section-card"

interface Props {
  settings: Record<string, any>
  onUpdate: (updates: Record<string, any>) => void
}

export function NotificationsSettings({ settings, onUpdate }: Props) {
  const ns = settings.notification_settings ?? {}

  const updateNs = (patch: Record<string, any>) =>
    onUpdate({ notification_settings: { ...ns, ...patch } })

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Bell}
        title="إشعارات البريد الإلكتروني"
        description="إعدادات إرسال الإشعارات التلقائية عبر البريد"
      >
        <ToggleRow
          label="إشعارات التسجيل الجديد"
          description="إرسال بريد للمدير عند تسجيل عضو جديد"
          checked={ns.notify_on_registration ?? true}
          onChange={(v) => updateNs({ notify_on_registration: v })}
        />
        <ToggleRow
          label="إشعارات الطلبات المعلّقة"
          description="تنبيه عند وجود طلبات تحتاج مراجعة"
          checked={ns.notify_on_pending ?? true}
          onChange={(v) => updateNs({ notify_on_pending: v })}
        />
        <ToggleRow
          label="إعادة إرسال البريد عند تحديث النتيجة"
          description="إرسال تنبيه للمستخدم عند تغيير نتيجة تلاوته"
          checked={settings.resend_email_on_result_change ?? false}
          onChange={(v) => onUpdate({ resend_email_on_result_change: v })}
        />
        <ToggleRow
          label="إعادة إرسال البريد عند التحديث"
          description="إرسال تنبيه عند أي تحديث على السجل"
          checked={settings.resend_email_on_result_update ?? false}
          onChange={(v) => onUpdate({ resend_email_on_result_update: v })}
        />
      </SectionCard>
    </div>
  )
}

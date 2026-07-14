"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, KeyRound, Activity } from "lucide-react"
import { SectionCard, ToggleRow } from "./section-card"

interface Props {
  settings: Record<string, any>
  onUpdate: (updates: Record<string, any>) => void
}

export function SecuritySettings({ settings, onUpdate }: Props) {
  const sec = settings.security_settings ?? {}

  const updateSec = (patch: Record<string, any>) =>
    onUpdate({ security_settings: { ...sec, ...patch } })

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Shield}
        title="الحماية والجلسات"
        description="إعدادات حماية الحسابات وتسجيل الدخول"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">مهلة انتهاء الجلسة (دقيقة)</Label>
            <Input
              type="number"
              min={5}
              value={sec.session_timeout ?? 30}
              onChange={(e) => updateSec({ session_timeout: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">الحد الأقصى لمحاولات الدخول</Label>
            <Input
              type="number"
              min={1}
              value={sec.max_login_attempts ?? 5}
              onChange={(e) => updateSec({ max_login_attempts: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">مدة قفل الحساب بعد الفشل (دقيقة)</Label>
            <Input
              type="number"
              min={1}
              value={sec.lockout_duration ?? 15}
              onChange={(e) => updateSec({ lockout_duration: Number(e.target.value) })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={KeyRound}
        title="التحقق الثنائي"
        description="حماية إضافية لحسابات المدراء"
      >
        <ToggleRow
          label="تفعيل التحقق الثنائي للمدراء"
          description="يُلزم المدراء بالتحقق عند كل تسجيل دخول"
          checked={settings.two_factor_auth ?? false}
          onChange={(v) => onUpdate({ two_factor_auth: v })}
        />
      </SectionCard>

      <SectionCard
        icon={Activity}
        title="سجلات النشاط"
        description="تتبع عمليات المستخدمين والمدراء"
      >
        <ToggleRow
          label="تفعيل سجلات النشاط"
          description="يسجّل جميع عمليات الدخول والتعديلات"
          checked={settings.activity_logging ?? true}
          onChange={(v) => onUpdate({ activity_logging: v })}
        />
      </SectionCard>
    </div>
  )
}

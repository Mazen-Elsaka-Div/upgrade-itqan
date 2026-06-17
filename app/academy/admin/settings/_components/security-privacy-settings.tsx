"use client"

import { Shield, Lock, Key, Globe, Upload, Clock, FileText, AlertTriangle, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AcademySettings } from "../hooks/use-academy-settings"
import { useI18n } from "@/lib/i18n/context"

interface SecurityPrivacySettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset: () => void
}

export function SecurityPrivacySettings({ settings, onUpdate, onReset }: SecurityPrivacySettingsProps) {
  const { t } = useI18n()
  const a = t.academyAdmin
  const ipWhitelist = settings.academy_security_ip_whitelist || []

  const updateIpWhitelist = (text: string) => {
    const ips = text
      .split(/[\n,]/)
      .map((ip) => ip.trim())
      .filter(Boolean)
    onUpdate({ academy_security_ip_whitelist: ips })
  }

  // Calculate password strength
  const getPasswordStrength = () => {
    let score = 0
    if ((settings.academy_security_password_min_length ?? 8) >= 8) score++
    if ((settings.academy_security_password_min_length ?? 8) >= 12) score++
    if (settings.academy_security_password_uppercase) score++
    if (settings.academy_security_password_lowercase) score++
    if (settings.academy_security_password_numbers) score++
    if (settings.academy_security_password_symbols) score++

    if (score <= 2) return { label: a.spStrengthWeak, color: "bg-destructive", width: "w-1/4" }
    if (score <= 4) return { label: a.spStrengthMedium, color: "bg-warning", width: "w-2/4" }
    return { label: a.spStrengthStrong, color: "bg-success", width: "w-full" }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="space-y-6">
      {/* Session Settings */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{a.spSessionLogin}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{a.spSessionLoginDesc}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              {a.gsRestore}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.spSessionTimeoutLabel}</Label>
              <Input
                type="number"
                value={settings.academy_security_session_timeout ?? 30}
                onChange={(e) => onUpdate({ academy_security_session_timeout: parseInt(e.target.value) || 30 })}
                min={5}
                max={1440}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.spMaxLoginAttemptsLabel}</Label>
              <Input
                type="number"
                value={settings.academy_security_max_login_attempts ?? 5}
                onChange={(e) => onUpdate({ academy_security_max_login_attempts: parseInt(e.target.value) || 5 })}
                min={3}
                max={20}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.spLockoutDurationLabel}</Label>
              <Input
                type="number"
                value={settings.academy_security_lockout_duration ?? 15}
                onChange={(e) => onUpdate({ academy_security_lockout_duration: parseInt(e.target.value) || 15 })}
                min={1}
                max={1440}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Settings */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.spTwoFactor}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.spTwoFactorDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.spEnableTwoFactor}</Label>
              <p className="text-xs text-muted-foreground">{a.spEnableTwoFactorDesc}</p>
            </div>
            <Switch
              checked={settings.academy_security_2fa_enabled ?? false}
              onCheckedChange={(v) => onUpdate({ academy_security_2fa_enabled: v })}
            />
          </div>

          {!settings.academy_security_2fa_enabled && (
            <Alert className="bg-warning/10 border-warning/30">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <AlertDescription className="text-sm text-warning">
                {a.spTwoFactorWarning}
              </AlertDescription>
            </Alert>
          )}

          {settings.academy_security_2fa_enabled && (
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.spVerificationMethod}</Label>
              <Select
                value={settings.academy_security_2fa_method || "email"}
                onValueChange={(v) => onUpdate({ academy_security_2fa_method: v })}
              >
                <SelectTrigger className="h-11 max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email OTP</SelectItem>
                  <SelectItem value="authenticator">Authenticator App</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP Whitelist */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.spIpWhitelist}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.spIpWhitelistDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.spEnableIpWhitelist}</Label>
              <p className="text-xs text-muted-foreground">{a.spEnableIpWhitelistDesc}</p>
            </div>
            <Switch
              checked={settings.academy_security_ip_whitelist_enabled ?? false}
              onCheckedChange={(v) => onUpdate({ academy_security_ip_whitelist_enabled: v })}
            />
          </div>

          {settings.academy_security_ip_whitelist_enabled && (
            <div className="space-y-3">
              <Label className="font-medium text-sm">{a.spAllowedIps}</Label>
              <Textarea
                value={ipWhitelist.join("\n")}
                onChange={(e) => updateIpWhitelist(e.target.value)}
                placeholder="192.168.1.1&#10;10.0.0.0/24&#10;..."
                className="min-h-[120px] resize-none font-mono text-sm"
                dir="ltr"
              />
              <p className="text-[11px] text-muted-foreground">
                {a.spAllowedIpsHint}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.spUsageLimits}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.spUsageLimitsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.spDailyUploadLimit}</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.academy_security_daily_upload_limit ?? 1}
                onChange={(e) => onUpdate({ academy_security_daily_upload_limit: parseFloat(e.target.value) || 1 })}
                min={0.1}
                max={100}
                className="h-11"
              />
              <p className="text-[11px] text-muted-foreground">{a.spDailyUploadLimitHint}</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.spRateLimit}</Label>
              <Input
                type="number"
                value={settings.academy_security_rate_limit ?? 1000}
                onChange={(e) => onUpdate({ academy_security_rate_limit: parseInt(e.target.value) || 1000 })}
                min={100}
                max={100000}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Policy */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.spPasswordPolicy}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.spPasswordPolicyDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.spMinPasswordLength}</Label>
            <Input
              type="number"
              value={settings.academy_security_password_min_length ?? 8}
              onChange={(e) => onUpdate({ academy_security_password_min_length: parseInt(e.target.value) || 8 })}
              min={6}
              max={32}
              className="h-11 max-w-xs"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm">{a.spUppercase}</Label>
              <Switch
                checked={settings.academy_security_password_uppercase ?? true}
                onCheckedChange={(v) => onUpdate({ academy_security_password_uppercase: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm">{a.spLowercase}</Label>
              <Switch
                checked={settings.academy_security_password_lowercase ?? true}
                onCheckedChange={(v) => onUpdate({ academy_security_password_lowercase: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm">{a.spNumbers}</Label>
              <Switch
                checked={settings.academy_security_password_numbers ?? true}
                onCheckedChange={(v) => onUpdate({ academy_security_password_numbers: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm">{a.spSymbols}</Label>
              <Switch
                checked={settings.academy_security_password_symbols ?? false}
                onCheckedChange={(v) => onUpdate({ academy_security_password_symbols: v })}
              />
            </div>
          </div>

          {/* Password Strength Indicator */}
          <div className="p-4 bg-muted/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">{a.spPasswordStrength}</Label>
              <span className="text-sm font-medium">{passwordStrength.label}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.spActivityLogs}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.spActivityLogsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.spEnableActivityLogs}</Label>
              <p className="text-xs text-muted-foreground">{a.spEnableActivityLogsDesc}</p>
            </div>
            <Switch
              checked={settings.academy_security_activity_logs ?? true}
              onCheckedChange={(v) => onUpdate({ academy_security_activity_logs: v })}
            />
          </div>

          {settings.academy_security_activity_logs !== false && (
            <div className="space-y-2">
              <Label className="font-medium text-sm">{a.spLogsRetention}</Label>
              <Input
                type="number"
                value={settings.academy_security_logs_retention ?? 90}
                onChange={(e) => onUpdate({ academy_security_logs_retention: parseInt(e.target.value) || 90 })}
                min={7}
                max={365}
                className="h-11 max-w-xs"
              />
              <p className="text-[11px] text-muted-foreground">{a.spLogsRetentionHint}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

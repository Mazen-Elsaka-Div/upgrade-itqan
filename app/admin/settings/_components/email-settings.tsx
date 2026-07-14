import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EmailSettingsProps {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function EmailSettings({
  settings,
  onUpdate,
}: EmailSettingsProps) {
  const smtp = settings.system_email_smtp_config || {}

  const handleSmtpChange = (field: string, value: any) => {
    onUpdate("system_email_smtp_config", {
      ...smtp,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">SMTP Configuration</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input
              id="smtp_host"
              value={smtp.host || ""}
              onChange={(e) => handleSmtpChange("host", e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input
              id="smtp_port"
              type="number"
              value={smtp.port || ""}
              onChange={(e) => handleSmtpChange("port", e.target.value)}
              placeholder="465"
            />
          </div>

          <div>
            <Label htmlFor="smtp_user">SMTP User</Label>
            <Input
              id="smtp_user"
              type="email"
              value={smtp.user || ""}
              onChange={(e) => handleSmtpChange("user", e.target.value)}
              placeholder="your-email@gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="smtp_password">SMTP Password</Label>
            <Input
              id="smtp_password"
              type="password"
              value={smtp.password || ""}
              onChange={(e) => handleSmtpChange("password", e.target.value)}
              placeholder="••••••••"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Use an app-specific password if using Gmail
            </p>
          </div>

          <div>
            <Label htmlFor="from_email">From Email Address</Label>
            <Input
              id="from_email"
              type="email"
              value={smtp.fromEmail || ""}
              onChange={(e) => handleSmtpChange("fromEmail", e.target.value)}
              placeholder="noreply@example.com"
            />
          </div>

          <div>
            <Label htmlFor="from_name">From Name</Label>
            <Input
              id="from_name"
              value={smtp.fromName || ""}
              onChange={(e) => handleSmtpChange("fromName", e.target.value)}
              placeholder="Itqan Platform"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface SecuritySettingsProps {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function SecuritySettings({
  settings,
  onUpdate,
}: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <Label className="cursor-pointer">Activity Logging</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Track all admin actions and user activities
              </p>
            </div>
            <Switch
              checked={settings.system_security_activity_logging || false}
              onCheckedChange={(value) =>
                onUpdate("system_security_activity_logging", value)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <Label className="cursor-pointer">Limit Login Attempts</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Prevent brute force attacks by limiting login attempts
              </p>
            </div>
            <Switch
              checked={settings.system_security_limit_login_attempts || false}
              onCheckedChange={(value) =>
                onUpdate("system_security_limit_login_attempts", value)
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

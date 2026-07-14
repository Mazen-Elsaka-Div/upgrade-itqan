import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface MaintenanceSettingsProps {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function MaintenanceSettings({
  settings,
  onUpdate,
}: MaintenanceSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Maintenance Mode</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <Label className="cursor-pointer">Enable Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, users will see a maintenance message
              </p>
            </div>
            <Switch
              checked={settings.system_maintenance_enabled || false}
              onCheckedChange={(value) =>
                onUpdate("system_maintenance_enabled", value)
              }
            />
          </div>

          <div>
            <Label htmlFor="maintenance_msg">Maintenance Message</Label>
            <Textarea
              id="maintenance_msg"
              value={settings.system_maintenance_message || ""}
              onChange={(e) =>
                onUpdate("system_maintenance_message", e.target.value)
              }
              placeholder="الموقع تحت الصيانة، نعود قريباً"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

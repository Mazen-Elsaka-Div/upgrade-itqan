import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface HomepageSettingsProps {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function HomepageSettings({
  settings,
  onUpdate,
}: HomepageSettingsProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Homepage settings are managed in the dedicated Homepage Editor. 
          Access it from the main dashboard menu.
        </AlertDescription>
      </Alert>

      <div className="p-4 border rounded-lg bg-muted/50">
        <h3 className="text-lg font-semibold mb-2">Current Homepage Settings</h3>
        <p className="text-sm text-muted-foreground">
          {Object.keys(settings)
            .filter((k) => k.startsWith("system_homepage_") || k.startsWith("homepage_"))
            .length}{" "}
          settings configured
        </p>
      </div>
    </div>
  )
}

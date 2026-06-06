import { Card, CardContent } from '@/components/ui/card'

export function RequestSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12" aria-busy="true" aria-label="Loading request details">
      {/* Back button skeleton */}
      <div className="w-48 h-9 bg-muted rounded-xl animate-pulse" />

      {/* Header Card Skeleton */}
      <Card className="rounded-3xl border-0 bg-gradient-to-br from-amber-50 to-orange-50/30 shadow-sm ring-1 ring-amber-500/10">
        <CardContent className="p-8 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-200/50 flex items-center justify-center shrink-0 animate-pulse" />
            <div className="space-y-3 flex-1">
              <div className="w-24 h-4 bg-amber-200/50 rounded-md animate-pulse" />
              <div className="w-64 h-10 bg-muted rounded-lg animate-pulse" />
              <div className="w-full max-w-sm h-5 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card Skeleton */}
      <Card className="rounded-3xl border border-border/50 shadow-sm bg-card">
        <CardContent className="p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100/50 animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="w-48 h-6 bg-muted rounded-md animate-pulse" />
              <div className="w-64 h-4 bg-muted rounded-md animate-pulse" />
            </div>
          </div>

          <div className="space-y-6 pt-2">
            {/* Field 1 */}
            <div className="space-y-3">
              <div className="w-40 h-4 bg-muted rounded-md animate-pulse" />
              <div className="w-full h-14 bg-muted/50 rounded-2xl animate-pulse" />
            </div>
            
            {/* Field 2 */}
            <div className="space-y-3">
              <div className="w-48 h-4 bg-muted rounded-md animate-pulse" />
              <div className="w-full h-14 bg-muted/50 rounded-2xl animate-pulse" />
            </div>
            
            {/* Field 3 */}
            <div className="space-y-3">
              <div className="w-32 h-4 bg-muted rounded-md animate-pulse" />
              <div className="w-full h-14 bg-muted/50 rounded-2xl animate-pulse" />
            </div>

            {/* Field 4 */}
            <div className="space-y-3">
              <div className="w-48 h-4 bg-muted rounded-md animate-pulse" />
              <div className="w-full h-28 bg-muted/50 rounded-2xl animate-pulse" />
            </div>

            {/* Checkbox area */}
            <div className="w-full h-20 bg-amber-50/40 border border-amber-200/60 rounded-2xl animate-pulse" />

            {/* Submit button */}
            <div className="w-full h-14 bg-primary/20 rounded-2xl animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

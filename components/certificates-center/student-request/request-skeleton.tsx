import { Card, CardContent } from '@/components/ui/card'

export function RequestSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12" aria-busy="true" aria-label="Loading request details">
      {/* Back button skeleton */}
      <div className="w-48 h-5 bg-muted rounded-md animate-pulse" />

      {/* Header Card Skeleton */}
      <Card className="rounded-2xl border-amber-200/50 bg-gradient-to-br from-amber-50/60 to-background">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="w-24 h-4 bg-amber-200/50 rounded-md animate-pulse" />
              <div className="w-64 h-8 bg-muted rounded-lg animate-pulse" />
              <div className="w-full max-w-sm h-4 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card Skeleton */}
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="w-48 h-6 bg-muted rounded-md animate-pulse" />
            <div className="w-full max-w-md h-4 bg-muted rounded-md animate-pulse" />
          </div>

          <div className="space-y-6 pt-4">
            {/* Field 1 */}
            <div className="space-y-2">
              <div className="w-32 h-4 bg-muted rounded-md animate-pulse" />
              <div className="w-full h-12 bg-muted/50 rounded-xl animate-pulse" />
            </div>
            
            {/* Field 2 */}
            <div className="space-y-2">
              <div className="w-40 h-4 bg-muted rounded-md animate-pulse" />
              <div className="w-full h-12 bg-muted/50 rounded-xl animate-pulse" />
            </div>
            
            {/* Field 3 */}
            <div className="space-y-2">
              <div className="w-32 h-4 bg-muted rounded-md animate-pulse" />
              <div className="w-full h-12 bg-muted/50 rounded-xl animate-pulse" />
            </div>

            {/* Field 4 */}
            <div className="space-y-2">
              <div className="w-48 h-4 bg-muted rounded-md animate-pulse" />
              <div className="w-full h-24 bg-muted/50 rounded-xl animate-pulse" />
            </div>

            {/* Checkbox area */}
            <div className="w-full h-16 bg-amber-50 rounded-xl animate-pulse border border-amber-100" />

            {/* Submit button */}
            <div className="w-full h-12 bg-primary/20 rounded-xl animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

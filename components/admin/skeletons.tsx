import { Skeleton } from "@/components/ui/skeleton"

// 1. Stats Grid Skeleton
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 sm:gap-4"
        >
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

// 2. Extra mini stats cards (e.g. 5 columns or inline stats)
export function StatsMiniGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-xl p-5 border border-border shadow-sm space-y-3"
        >
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

// 3. Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="h-[300px] flex items-end gap-2 pt-4">
        {Array.from({ length: 12 }).map((_, i) => {
          const heights = ["h-[40%]", "h-[70%]", "h-[50%]", "h-[90%]", "h-[60%]", "h-[80%]"]
          const h = heights[i % heights.length]
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className={`w-full ${h} rounded-t-md`} />
              <Skeleton className="h-3 w-8" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 4. Table Skeleton
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/40 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {/* Rows Skeleton */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between px-6 py-4">
            {Array.from({ length: cols }).map((_, c) => {
              // Make first column (name/avatar) look like an avatar + text
              if (c === 0) {
                return (
                  <div key={c} className="flex items-center gap-3 w-40">
                    <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                )
              }
              // Normal fields
              return (
                <div key={c} className="w-24">
                  <Skeleton className="h-4 w-20" />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// 5. Conversations / Chat Skeleton
export function ConversationsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-140px)] -m-6 lg:-m-8 p-6 lg:p-8">
      {/* Sidebar List */}
      <div className="md:col-span-4 bg-card border border-border rounded-3xl overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-border space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Area */}
      <div className="md:col-span-8 bg-card border border-border rounded-3xl overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>

        {/* Message body */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="bg-muted/50 p-4 rounded-3xl rounded-tr-none space-y-2 max-w-[70%]">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-start gap-3 flex-row-reverse">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="bg-primary/10 p-4 rounded-3xl rounded-tl-none space-y-2 max-w-[70%]">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="bg-muted/50 p-4 rounded-3xl rounded-tr-none space-y-2 max-w-[60%]">
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </div>

        {/* Footer Input */}
        <div className="p-4 border-t border-border bg-muted/10">
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 flex-1 rounded-2xl" />
            <Skeleton className="w-12 h-11 rounded-2xl shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}

// 6. Detail View Skeleton (e.g. user details or halaqa details)
export function DetailViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Profile Info */}
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-3xl shrink-0" />
        <div className="space-y-3 flex-1 text-center md:text-right">
          <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 7. Course Cards Grid Skeleton (For Academy Admin Courses)
export function CourseCardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
          <Skeleton className="w-full h-40 rounded-2xl" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

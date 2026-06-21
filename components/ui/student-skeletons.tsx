import { Skeleton } from "@/components/ui/skeleton"

function Bone({ className = "" }: { className?: string }) {
  return <Skeleton className={className} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Bone className="h-4 w-24" />
          <Bone className="h-8 w-64" />
          <Bone className="h-4 w-80" />
        </div>
        <Bone className="h-12 w-36 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <Bone className="h-10 w-10 rounded-xl" />
            <Bone className="h-8 w-16" />
            <Bone className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Bone className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5"><Bone className="h-5 w-32" /><Bone className="h-3 w-48" /></div>
        </div>
        <Bone className="h-3 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Bone className="h-10 w-10 rounded-xl" />
              <div className="space-y-1.5"><Bone className="h-5 w-40" /><Bone className="h-3 w-28" /></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <Bone className="h-4 w-4 rounded-full" />
                  <Bone className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AcademyDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 space-y-4">
          <Bone className="h-7 w-56" />
          <Bone className="h-4 w-80" />
          <div className="flex gap-4">
            <Bone className="h-6 w-24 rounded-full" />
            <Bone className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <Bone className="h-5 w-32" />
          <Bone className="h-6 w-40" />
          <Bone className="h-2.5 w-full rounded-full" />
          <Bone className="h-3 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <Bone className="h-9 w-9 rounded-lg" />
            <Bone className="h-7 w-12" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <Bone className="h-5 w-32" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
                <Bone className="h-14 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Bone className="h-4 w-40" />
                  <Bone className="h-3 w-28" />
                  <div className="flex items-center gap-2">
                    <Bone className="h-2 flex-1 rounded-full" />
                    <Bone className="h-3 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 space-y-3">
              <Bone className="h-5 w-32" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <Bone className="h-4 w-full" />
                  <Bone className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <Bone className="h-10 w-10 rounded-full" />
            <Bone className="h-7 w-12" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Bone key={i} className="h-9 w-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Bone className="h-5 w-3/4" />
                <Bone className="h-4 w-1/2" />
              </div>
              <Bone className="h-8 w-8 rounded-full" />
            </div>
            <Bone className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Bone className="h-3 w-16" />
              <Bone className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CoursesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500" aria-busy="true">
      <div className="bg-card rounded-3xl border border-border p-8 space-y-4">
        <Bone className="h-10 w-48" />
        <Bone className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <Bone className="h-12 w-12 rounded-xl" />
            <Bone className="h-7 w-10" />
            <Bone className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Bone className="h-10 w-16 rounded-xl" />
        <Bone className="h-10 w-16 rounded-xl" />
        <Bone className="h-10 w-16 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
            <Bone className="h-48 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Bone className="h-8 w-8 rounded-full" />
                <Bone className="h-4 w-24" />
              </div>
              <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <Bone className="h-3 w-20" />
                  <Bone className="h-3 w-8" />
                </div>
                <Bone className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SessionsListSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Bone key={i} className="h-20 w-16 shrink-0 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Bone className="h-5 w-36" />
              <Bone className="h-6 w-16 rounded-full" />
            </div>
            <Bone className="h-3 w-28" />
            <div className="flex items-center gap-2">
              <Bone className="h-3 w-3 rounded-full" />
              <Bone className="h-3 w-20" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-8 flex-1 rounded-xl" />
              <Bone className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DetailPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <Bone className="h-8 w-24 rounded-lg" />
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Bone className="h-14 w-14 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Bone className="h-6 w-64" />
            <Bone className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Bone className="h-3 w-16" />
              <Bone className="h-5 w-20" />
            </div>
          ))}
        </div>
        <Bone className="h-32 w-full rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
              <Bone className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <Bone className="h-4 w-48" />
                <Bone className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PathDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 p-4 sm:p-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="flex items-center gap-3">
        <Bone className="h-8 w-8 rounded-lg" />
        <Bone className="h-6 w-48" />
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <Bone className="h-7 w-64" />
          <Bone className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted/40 rounded-2xl p-4 space-y-2">
              <Bone className="h-3 w-16" />
              <Bone className="h-6 w-10" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <Bone className="h-5 w-40" />
              <Bone className="h-8 w-20 rounded-xl" />
            </div>
            <Bone className="h-4 w-2/3" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((j) => (
                <Bone key={j} className="h-3 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <div className="flex items-center gap-5">
        <Bone className="h-20 w-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Bone className="h-6 w-40" />
          <Bone className="h-4 w-28" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Bone className="h-10 flex-1 rounded-xl" />
        <Bone className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

export function PointsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <Bone className="h-7 w-32" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <Bone className="h-10 w-10 rounded-xl" />
            <Bone className="h-8 w-16" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <Bone className="h-5 w-32" />
          <Bone className="h-2.5 w-full rounded-full" />
          <div className="flex justify-between">
            <Bone className="h-3 w-24" />
            <Bone className="h-3 w-20" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <Bone className="h-5 w-36" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Bone className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Bone className="h-4 w-36" />
                  <Bone className="h-3 w-24" />
                </div>
                <Bone className="h-5 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BadgesSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 p-4" aria-busy="true">
      <div className="space-y-2">
        <Bone className="h-7 w-28" />
        <Bone className="h-4 w-64" />
      </div>
      {[1, 2].map((cat) => (
        <div key={cat} className="space-y-4">
          <Bone className="h-5 w-32" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 text-center space-y-3">
                <Bone className="h-14 w-14 rounded-full mx-auto" />
                <Bone className="h-4 w-20 mx-auto" />
                <Bone className="h-3 w-28 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <Bone className="h-7 w-36" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <Bone key={i} className="h-9 w-24 rounded-xl" />)}
      </div>
      <div className="flex gap-2">
        {[1, 2].map((i) => <Bone key={i} className="h-9 w-28 rounded-xl" />)}
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-around">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-2">
              <Bone className={`h-${i === 2 ? '16' : '12'} w-${i === 2 ? '16' : '12'} rounded-full mx-auto`} />
              <Bone className="h-4 w-16 mx-auto" />
              <Bone className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
              <Bone className="h-6 w-6" />
              <Bone className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-20" />
              </div>
              <Bone className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex h-[600px] border border-border rounded-2xl overflow-hidden animate-in fade-in duration-500" aria-busy="true">
      <div className="w-72 border-e border-border flex flex-col gap-1 p-3">
        <Bone className="h-10 w-full rounded-xl mb-2" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
            <Bone className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-4 w-24" />
              <Bone className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col justify-between p-4 gap-3">
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
              <Bone className="h-8 w-8 rounded-full shrink-0" />
              <Bone className={`h-14 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          ))}
        </div>
        <Bone className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-9 w-9 rounded-lg" />
          <Bone className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Bone key={i} className="h-4 w-8 mx-auto" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square flex flex-col items-center justify-center gap-1 rounded-xl">
              <Bone className="h-5 w-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProgressSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="space-y-2">
        <Bone className="h-7 w-32" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <Bone className="h-10 w-10 rounded-xl" />
            <Bone className="h-8 w-12" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <Bone className="h-5 w-36" />
        <div className="h-48 w-full" />
      </div>
    </div>
  )
}

export function BookingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <div className="space-y-2">
        <Bone className="h-7 w-32" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <Bone className="h-5 w-36" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Bone key={i} className="h-4 w-full" />
          ))}
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg">
              <Bone className="h-full w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <Bone className="h-12 w-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-48" />
              <Bone className="h-3 w-32" />
            </div>
            <Bone className="h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MushafSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Bone className="h-7 w-40" />
          <Bone className="h-4 w-56" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
        <div className="text-center space-y-2">
          <Bone className="h-8 w-32 mx-auto" />
          <Bone className="h-4 w-48 mx-auto" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bone key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <Bone className="h-10 w-32 rounded-xl" />
        <Bone className="h-10 w-24 rounded-xl" />
        <Bone className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  )
}

export function SimpleListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="space-y-2">
        <Bone className="h-7 w-40" />
        <Bone className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Bone className="h-4 w-1/3" />
              <Bone className="h-3 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-8 w-16 rounded-lg" />
              <Bone className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TasksSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-24" />
          <Bone className="h-4 w-48" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Bone className="h-4 w-20" />
            <Bone className="h-7 w-10" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Bone className="h-5 w-48" />
              <Bone className="h-6 w-16 rounded-full" />
            </div>
            <Bone className="h-3 w-36" />
            <div className="flex items-center gap-4">
              <Bone className="h-3 w-24" />
              <Bone className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PathListSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500" aria-busy="true">
      <div className="space-y-2">
        <Bone className="h-7 w-40" />
        <Bone className="h-4 w-56" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <Bone key={i} className="h-9 w-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Bone className="h-5 w-1/3" />
                <Bone className="h-4 w-2/3" />
              </div>
              <Bone className="h-8 w-24 rounded-xl" />
            </div>
            <Bone className="h-2 w-full rounded-full" />
            <div className="flex gap-3">
              {[1, 2, 3].map((j) => (
                <Bone key={j} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WirdSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <Bone className="h-7 w-32" />
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Bone className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Bone className="h-5 w-32" />
            <Bone className="h-3 w-24" />
          </div>
        </div>
        <Bone className="h-2 w-full rounded-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
              <Bone className="h-5 w-5 rounded-md" />
              <div className="space-y-1.5 flex-1">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function NotificationsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500 p-4" aria-busy="true">
      <Bone className="h-7 w-36" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
          <Bone className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
            <Bone className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EnrollmentRequestsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <Bone className="h-7 w-48" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <Bone key={i} className="h-9 w-24 rounded-xl" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <Bone className="h-12 w-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-48" />
              <Bone className="h-3 w-32" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-8 w-20 rounded-lg" />
              <Bone className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FiqhSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 p-4" aria-busy="true">
      <Bone className="h-7 w-28" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <Bone key={i} className="h-9 w-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Bone className="h-10 w-10 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <Bone className="h-5 w-36" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
            <Bone className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

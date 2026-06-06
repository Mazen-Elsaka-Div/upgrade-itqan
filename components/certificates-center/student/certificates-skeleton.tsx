import { Sparkles, Hourglass, CheckCircle2 } from 'lucide-react'

export function CertificatesSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12" aria-busy="true" aria-label="Loading certificates">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="w-32 h-6 bg-muted rounded-full animate-pulse" />
        <div className="w-64 h-10 bg-muted rounded-xl animate-pulse" />
        <div className="w-96 h-5 bg-muted rounded-md animate-pulse" />
      </div>

      {/* Action Required Skeleton */}
      <section className="space-y-4">
        <header className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div className="w-48 h-7 bg-muted rounded-md animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-36 bg-amber-50/50 rounded-xl border border-amber-100 animate-pulse" />
        </div>
      </section>

      {/* In Review Skeleton */}
      <section className="space-y-4">
        <header className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 animate-pulse">
            <Hourglass className="w-4 h-4 text-blue-200" />
          </div>
          <div className="w-40 h-7 bg-muted rounded-md animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-blue-50/50 rounded-xl border border-blue-100 animate-pulse" />
        </div>
      </section>

      {/* Issued Skeleton */}
      <section className="space-y-4">
        <header className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="w-56 h-7 bg-muted rounded-md animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-48 bg-muted/30 rounded-xl border border-border/50 animate-pulse" />
          <div className="h-48 bg-muted/30 rounded-xl border border-border/50 animate-pulse" />
          <div className="h-48 bg-muted/30 rounded-xl border border-border/50 animate-pulse" />
        </div>
      </section>
    </div>
  )
}

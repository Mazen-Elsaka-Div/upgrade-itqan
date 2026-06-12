import { Skeleton } from "@/components/ui/skeleton"

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[150px] rounded-lg" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton (List or Grid) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4 mt-8">
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-10 w-[250px] rounded-xl" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl flex flex-col md:flex-row overflow-hidden">
              <Skeleton className="md:w-1/3 aspect-video md:aspect-auto shrink-0 rounded-none" />
              <div className="p-5 flex-1 flex flex-col gap-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="mt-auto pt-4 flex gap-2">
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-8 w-10 shrink-0 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

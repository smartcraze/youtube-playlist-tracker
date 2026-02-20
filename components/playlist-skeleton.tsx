import { Skeleton } from "@/components/ui/skeleton"

export function PlaylistSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-border pb-8">
        <div className="space-y-4 flex-1 w-full">
          <Skeleton className="h-10 w-3/4 md:w-1/2" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[120px] w-full md:w-[250px] rounded-xl" />
      </div>
      
      <div className="space-y-4 pt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/50">
             <Skeleton className="h-6 w-6 rounded-full shrink-0" />
             <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-16" />
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading component for job pages.
 * 
 * This component is automatically displayed by Next.js while
 * the job page is loading. It provides a skeleton UI that
 * matches the structure of the actual job editor interface.
 */

export default function JobPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      </div>
      
      {/* Phase navigator skeleton */}
      <div className="border-b">
        <div className="flex items-center justify-center space-x-1 px-6 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-8 w-16 rounded" />
              {i < 5 && <div className="mx-2 h-px w-4 bg-border" />}
            </div>
          ))}
        </div>
        <div className="px-6 py-4 text-center border-t bg-muted/30">
          <Skeleton className="h-8 w-32 mx-auto mb-1" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tab navigation skeleton */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded" />
            ))}
          </div>
          
          {/* Card skeleton */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
              
              {/* Form fields skeleton */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
              
              {/* Action buttons skeleton */}
              <div className="flex justify-between pt-4">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          </div>
          
          {/* Additional content skeleton */}
          <div className="rounded-lg border bg-card">
            <div className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
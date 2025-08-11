import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import LinkedInQueryBuilder from "@/components/linkedin-query-builder"
import { getJobData } from "@/app/actions/job-management"
import { Skeleton } from "@/components/ui/skeleton"

interface LinkedInQueryBuilderPageProps {
  params: Promise<{ id: string }>
}

/**
 * Loading component for LinkedIn Query Builder
 */
function LinkedInQueryBuilderSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Job info skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Main card skeleton */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Server component that handles LinkedIn Query Builder page routing and data fetching
 */
export default async function LinkedInQueryBuilderPage({ params }: LinkedInQueryBuilderPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Await the dynamic parameters
  const resolvedParams = await params

  return (
    <Suspense fallback={<LinkedInQueryBuilderSkeleton />}>
      <LinkedInQueryBuilderContainer jobId={resolvedParams.id} />
    </Suspense>
  )
}

/**
 * Container component that fetches job data and renders the LinkedIn Query Builder
 */
async function LinkedInQueryBuilderContainer({ jobId }: { jobId: string }) {
  // Fetch job data
  const jobData = await getJobData(jobId)

  if (!jobData) {
    redirect("/protected/jobs")
  }

  return <LinkedInQueryBuilder jobData={jobData} />
}
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import EmailBuilder from "@/components/email-builder"
import { getJobData } from "@/app/actions/job-management"
import { Skeleton } from "@/components/ui/skeleton"

interface EmailBuilderPageProps {
  params: Promise<{ id: string }>
}

/**
 * Loading component for Email Builder
 */
function EmailBuilderSkeleton() {
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

      {/* Tabs skeleton */}
      <div className="border-b">
        <div className="flex space-x-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Main card skeleton */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Server component that handles Email Builder page routing and data fetching
 */
export default async function EmailBuilderPage({ params }: EmailBuilderPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Await the dynamic parameters
  const resolvedParams = await params

  return (
    <Suspense fallback={<EmailBuilderSkeleton />}>
      <EmailBuilderContainer jobId={resolvedParams.id} />
    </Suspense>
  )
}

/**
 * Container component that fetches job data and renders the Email Builder
 */
async function EmailBuilderContainer({ jobId }: { jobId: string }) {
  // Fetch job data
  const jobData = await getJobData(jobId)

  if (!jobData) {
    redirect("/protected/jobs")
  }

  return <EmailBuilder jobData={jobData} />
}
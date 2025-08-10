import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import JobLayout from "@/components/job-layout"
import { getJobData } from "@/app/actions/job-management"
import { Skeleton } from "@/components/ui/skeleton"

interface JobLayoutPageProps {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

/**
 * Loading component for job layout
 */
function JobLayoutSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Fixed header skeleton */}
      <div className="border-b pb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-40" />
        </div>
      </div>
      
      {/* Content area */}
      <div>
        {children}
      </div>
    </div>
  )
}

/**
 * Server component that handles job layout with data fetching
 */
export default async function JobLayoutPage({ params, children }: JobLayoutPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Await the dynamic parameters
  const resolvedParams = await params

  return (
    <Suspense fallback={<JobLayoutSkeleton>{children}</JobLayoutSkeleton>}>
      <JobLayoutContainer jobId={resolvedParams.id}>
        {children}
      </JobLayoutContainer>
    </Suspense>
  )
}

/**
 * Container component that fetches job data and renders the layout
 */
async function JobLayoutContainer({ jobId, children }: { jobId: string; children: React.ReactNode }) {
  // Fetch job data
  const jobData = await getJobData(jobId)

  if (!jobData) {
    redirect("/protected/jobs")
  }

  return (
    <JobLayout jobId={jobId} jobData={jobData}>
      {children}
    </JobLayout>
  )
}
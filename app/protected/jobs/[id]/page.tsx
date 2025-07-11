import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import JobEditor from "@/components/job-editor"
import { getJobData } from "@/app/actions/job-management"
import { Skeleton } from "@/components/ui/skeleton"
import { JobPhase } from "@/types/job"

interface JobPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ phase?: string; tab?: string }>
}

/**
 * Loading component for job editor
 */
function JobEditorSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
      
      {/* Phase navigator skeleton */}
      <div className="border-b">
        <div className="flex items-center justify-center space-x-1 px-6 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded" />
          ))}
        </div>
        <div className="px-6 py-4 text-center border-t bg-muted/30">
          <Skeleton className="h-8 w-32 mx-auto mb-1" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/**
 * Server component that handles job page routing and data fetching
 */
export default async function JobPage({ params, searchParams }: JobPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Await the dynamic parameters
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const isNewJob = resolvedParams.id.startsWith("new-")
  const currentPhase = (resolvedSearchParams.phase as JobPhase) || "define"
  const currentTab = resolvedSearchParams.tab

  return (
    <Suspense fallback={<JobEditorSkeleton />}>
      <JobEditorContainer
        jobId={resolvedParams.id}
        currentPhase={currentPhase}
        currentTab={currentTab}
        isNewJob={isNewJob}
      />
    </Suspense>
  )
}

/**
 * Container component that fetches job data and renders the editor
 */
async function JobEditorContainer({
  jobId,
  currentPhase,
  currentTab,
  isNewJob
}: {
  jobId: string
  currentPhase: JobPhase
  currentTab?: string
  isNewJob: boolean
}) {
  // Fetch job data for existing jobs
  const jobData = isNewJob ? null : await getJobData(jobId)

  return (
    <JobEditor
      jobId={jobId}
      jobData={jobData}
      currentPhase={currentPhase}
      currentTab={currentTab}
      isNewJob={isNewJob}
    />
  )
}
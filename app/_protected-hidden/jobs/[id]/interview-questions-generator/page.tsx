import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import InterviewQuestionsGenerator from "@/components/interview-questions-generator"
import { getJobData } from "@/app/actions/job-management"
import { Skeleton } from "@/components/ui/skeleton"

interface InterviewQuestionsGeneratorPageProps {
  params: Promise<{ id: string }>
}

/**
 * Loading component for Interview Questions Generator
 */
function InterviewQuestionsGeneratorSkeleton() {
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
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Server component that handles Interview Questions Generator page routing and data fetching
 */
export default async function InterviewQuestionsGeneratorPage({ params }: InterviewQuestionsGeneratorPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Await the dynamic parameters
  const resolvedParams = await params

  return (
    <Suspense fallback={<InterviewQuestionsGeneratorSkeleton />}>
      <InterviewQuestionsGeneratorContainer jobId={resolvedParams.id} />
    </Suspense>
  )
}

/**
 * Container component that fetches job data and renders the Interview Questions Generator
 */
async function InterviewQuestionsGeneratorContainer({ jobId }: { jobId: string }) {
  // Fetch job data
  const jobData = await getJobData(jobId)

  if (!jobData) {
    redirect("/protected/jobs")
  }

  return <InterviewQuestionsGenerator jobData={jobData} />
}
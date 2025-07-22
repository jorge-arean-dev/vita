"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface JobLayoutProps {
  jobId: string
  jobData: JobData
  children: React.ReactNode
}

export default function JobLayout({ jobId, jobData, children }: JobLayoutProps) {
  const router = useRouter()

  const handleBackToJobs = () => {
    router.push("/protected/jobs")
  }

  return (
    <div className="container mx-auto p-6">
      {/* Fixed Header Section */}
      <div className="border-b pb-6 mb-6 space-y-4">
        {/* Back to Jobs Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToJobs} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </div>

        {/* Job Title and Company */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{jobData.title}</h1>
          <p className="text-xl text-muted-foreground">{jobData.companyName}</p>
        </div>

        {/* Additional buttons will be added here later */}
        {/* <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Additional Action 1</Button>
          <Button variant="outline" size="sm">Additional Action 2</Button>
        </div> */}
      </div>

      {/* Dynamic Content Area */}
      <div>
        {children}
      </div>
    </div>
  )
}
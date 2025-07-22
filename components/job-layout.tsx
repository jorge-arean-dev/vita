"use client"

import { JobBreadcrumb } from "@/components/job-breadcrumb"

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

  return (
    <div className="container mx-auto p-6">
      {/* Fixed Header Section */}
      <div className="border-b pb-6 mb-6 space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-4">
          <JobBreadcrumb jobId={jobId} jobTitle={jobData.title} />
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
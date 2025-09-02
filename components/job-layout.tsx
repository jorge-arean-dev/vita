"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MoreVertical, Trash2, ArrowLeft } from "lucide-react"
import { JobBreadcrumb } from "@/components/job-breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import JobDetailsDialog from "@/components/job-details-dialog"
import { deleteJob } from "@/app/actions/jobs"

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
  attributes?: {
    rate: {
      value: number | null
      freq: string
    }
    commitment: string
    duration: string
    location: {
      category: string
      regions: string[]
      countries: string[]
    }
  }
  requirements?: Array<{
    id: string
    requirement: string
    type: string
    is_mandatory: boolean
    proficiency_level: "expert" | "advanced" | "beginner" | null
    weight: number
  }>
}

interface JobLayoutProps {
  jobId: string
  jobData: JobData
  children: React.ReactNode
}

export default function JobLayout({ jobId, jobData, children }: JobLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if we're on a job feature route (has a segment after jobId)
  const pathSegments = pathname.split('/').filter(Boolean)
  const isOnFeatureRoute = pathSegments.length > 3 && pathSegments[0] === 'protected' && pathSegments[1] === 'jobs' && pathSegments[2] === jobId && pathSegments[3] !== undefined

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteJob(jobId)
      // Redirect to jobs page after successful deletion
      router.push("/protected/jobs")
    } catch (error) {
      console.error("Error deleting job:", error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Fixed Header Section */}
      <div className="border-b pb-4 mb-4 space-y-2">
        {/* Row 1: Breadcrumb Navigation and Back Button */}
        <div className="flex items-center justify-between">
          <JobBreadcrumb jobId={jobId} jobTitle={jobData.title} />
          {isOnFeatureRoute ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/protected/jobs/${jobId}`)}
              className="gap-1"
              aria-label="Return to job toolkit page"
              title="Go back to the main toolkit for this job"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Job Tools
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/protected/jobs")}
              className="gap-1"
              aria-label="Return to jobs list"
              title="Go back to the jobs list"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to jobs
            </Button>
          )}
        </div>

        {/* Row 2: Job Title at Company and Action Buttons */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {jobData.title} <span className="text-muted-foreground font-normal ml-2">at {jobData.companyName}</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setIsJobDetailsOpen(true)}>Job Details</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div>
        {children}
      </div>

      {/* Job Details Dialog */}
      <JobDetailsDialog
        open={isJobDetailsOpen}
        onOpenChange={setIsJobDetailsOpen}
        jobId={jobId}
        jobData={jobData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job &quot;{jobData.title}&quot; and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
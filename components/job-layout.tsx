"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { JobBreadcrumb } from "@/components/job-breadcrumb"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import JobDetailsDialog from "@/components/job-details-dialog"
import { deleteJob } from "@/app/actions/jobs"

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
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
          <div className="flex items-center justify-between">
            <p className="text-xl text-muted-foreground">{jobData.companyName}</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setIsJobDetailsOpen(true)}>Job Details</Button>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Delete Job</Button>
            </div>
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
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, MoreHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { JobData, deleteJob } from "@/app/actions/jobs"
import CreateJobDialog from "@/components/create-job-dialog"

interface JobsTableProps {
  jobs: JobData[]
}

export default function JobsTable({ jobs: initialJobs }: JobsTableProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState(initialJobs)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleOpen = (jobId: string) => {
    console.log("Opening job:", jobId)
    router.push(`/protected/jobs/${jobId}`)
  }

  const handleDelete = async (jobId: string) => {
    setIsDeleting(true)
    try {
      await deleteJob(jobId)
      setJobs(jobs.filter((job) => job.id !== jobId))
    } catch (error) {
      console.error("Error deleting job:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleJobCreated = (result: { success: boolean; jobId?: string; error?: string }) => {
    console.log("New job created:", result)
    // Refresh the page to show the new job
    router.refresh()
    setShowCreateDialog(false)
  }

  const getCompanyInitial = (companyName: string) => {
    return companyName.charAt(0).toUpperCase()
  }

  const getLogoColor = (companyName: string) => {
    // Generate consistent colors based on company name
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-red-500",
    ]
    const index = companyName.length % colors.length
    return colors[index]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Manage your job listings and track candidate progress</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>Create New Job</Button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-4">Create your first job to get started.</p>
          <Button onClick={() => setShowCreateDialog(true)}>Create New Job</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="group relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              onClick={() => handleOpen(job.id)}
              role="button"
              tabIndex={0}
              aria-label={`Open job: ${job.title} at ${job.company_name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleOpen(job.id)
                }
              }}
            >
              <CardContent className="h-full flex flex-col pt-3 px-6 pb-2">
                {/* 1. Three-dotted menu, aligned to the right */}
                <div className="flex justify-end -mb-8 relative z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Actions for ${job.title}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the job &quot;{job.title}&quot; and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(job.id)}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* 2. Company logo */}
                <div className="flex justify-center mb-3">
                  <div
                    className={`w-10 h-10 rounded-full ${getLogoColor(job.company_name)} flex items-center justify-center text-white font-semibold text-sm`}
                  >
                    {getCompanyInitial(job.company_name)}
                  </div>
                </div>

                {/* 3. Job title */}
                <h3 className="text-lg font-semibold text-center mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {job.title}
                </h3>

                {/* 4. Company name */}
                <p className="text-sm text-muted-foreground text-center">
                  {job.company_name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateJobDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
        onJobCreated={handleJobCreated} 
      />
    </div>
  )
}

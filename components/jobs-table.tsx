"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, MoreHorizontal, Trash2, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

  const getRateDisplay = (job: JobData) => {
    if (!job.rate) return null
    
    // Format the rate based on pay frequency
    const formattedRate = job.rate.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
    
    // Map pay frequency to display text
    const frequencyMap: Record<string, string> = {
      'hourly': '/hour',
      'yearly': '/year',
      'monthly': '/month',
      'weekly': '/week',
      'daily': '/day',
      'project': '/project'
    }
    
    const frequency = job.pay_freq ? frequencyMap[job.pay_freq.toLowerCase()] || `/${job.pay_freq}` : ''
    return `${formattedRate}${frequency}`
  }

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    // Reset time to midnight for both dates to compare calendar days
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const diffInMs = nowOnly.getTime() - dateOnly.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    
    // Less than 2 weeks: show in days
    if (diffInDays < 14) return `${diffInDays} days ago`
    
    // 2-4 weeks: show in weeks
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks <= 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    
    // More than 4 weeks: show in months
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
    
    // More than a year: show in years
    const diffInYears = Math.floor(diffInDays / 365)
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Stay on top of your recruiting pipeline. Create new jobs as they come in</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>Create New Job</Button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-4">Create your first job to get started.</p>
          <Button onClick={() => setShowCreateDialog(true)}>Create New Job</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="flex flex-col overflow-hidden rounded-lg border-border bg-card text-card-foreground shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl cursor-pointer h-80 max-w-sm p-0"
              onClick={() => handleOpen(job.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-4 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                    <span className="text-lg font-bold text-muted-foreground">
                      {getCompanyInitial(job.company_name)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{job.company_name}</p>
                    <p className="text-xs text-muted-foreground">{formatCreatedDate(job.created_at)}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
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
              </CardHeader>
              <CardContent className="flex-1 space-y-3 px-4 py-3 min-h-0">
                <h3 className="text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem]">{job.title}</h3>
                <div className="flex flex-wrap gap-1.5 overflow-hidden min-h-[1.75rem]">
                  {job.commitment_display && (
                    <Badge variant="secondary" className="text-xs">
                      {job.commitment_display}
                    </Badge>
                  )}
                  {job.duration_display && (
                    <Badge variant="secondary" className="text-xs">
                      {job.duration_display}
                    </Badge>
                  )}
                  {job.location_reqs_display && (
                    <Badge variant="secondary" className="text-xs">
                      {job.location_reqs_display}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="mt-auto flex items-center justify-between border-t border-border bg-muted/30 px-4 pt-4 pb-4 flex-shrink-0 m-0">
                <div className="flex flex-col">
                  {getRateDisplay(job) && (
                    <p className="text-base font-semibold m-0">{getRateDisplay(job)}</p>
                  )}
                </div>
                <Button 
                  className="px-4 py-2 text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpen(job.id)
                  }}
                >
                  Open
                </Button>
              </CardFooter>
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

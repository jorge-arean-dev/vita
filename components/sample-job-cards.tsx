"use client"

import { useState } from "react"
import { MoreHorizontal, Eye, Trash2, Building2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import CreateJobDialog from "./create-job-dialog"

// Mock data for demonstration
const mockJobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    candidateCount: 12,
  },
  {
    id: 2,
    title: "Product Manager",
    company: "StartupXYZ",
    candidateCount: 8,
  },
  {
    id: 3,
    title: "UX Designer",
    company: "Design Studio",
    candidateCount: 15,
  },
  {
    id: 4,
    title: "Data Scientist",
    company: "Analytics Pro",
    candidateCount: 6,
  },
  {
    id: 5,
    title: "DevOps Engineer",
    company: "CloudTech Solutions",
    candidateCount: 4,
  },
  {
    id: 6,
    title: "Marketing Manager",
    company: "Growth Labs",
    candidateCount: 9,
  },
]

interface JobsTableProps {
  onJobOpen: (job: { id: number; title: string; company: string }) => void
}

export default function JobsTable({ onJobOpen }: JobsTableProps) {
  const [jobs, setJobs] = useState(mockJobs)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleOpen = (job: (typeof mockJobs)[0]) => {
    onJobOpen(job)
  }

  const handleDelete = (jobId: number) => {
    setJobs(jobs.filter((job) => job.id !== jobId))
    console.log("Deleted job:", jobId)
  }

  const handleJobCreated = (newJob: { success: boolean; jobId?: string; error?: string }) => {
    console.log("New job created:", newJob)
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="group relative aspect-square cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              onClick={() => handleOpen(job)}
              role="button"
              tabIndex={0}
              aria-label={`Open job: ${job.title} at ${job.company}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleOpen(job)
                }
              }}
            >
              <CardContent className="p-4 h-full flex flex-col">
                {/* Action Menu */}
                <div className="flex justify-end mb-2">
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
                      <DropdownMenuItem onClick={() => handleOpen(job)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(job.id)
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Company Logo */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-full ${getLogoColor(job.company)} flex items-center justify-center text-white font-semibold text-lg`}
                  >
                    {getCompanyInitial(job.company)}
                  </div>
                </div>

                {/* Job Title */}
                <h3 className="font-semibold text-center mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {job.title}
                </h3>

                {/* Company Name */}
                <p className="text-sm text-muted-foreground text-center mb-3 line-clamp-1">{job.company}</p>

                {/* Candidate Count */}
                <div className="mt-auto flex justify-center">
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {job.candidateCount} candidate{job.candidateCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateJobDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onJobCreated={handleJobCreated} />
    </div>
  )
}

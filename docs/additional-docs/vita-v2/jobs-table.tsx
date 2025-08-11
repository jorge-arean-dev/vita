"use client"

import { useState } from "react"
import { MoreHorizontal, Eye, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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

  const handleJobCreated = (newJob: any) => {
    console.log("New job created:", newJob)
    // Add the new job to the list
    setShowCreateDialog(false)
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Company</TableHead>
              <TableHead className="font-semibold text-center"># of Candidates</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No jobs found. Create your first job to get started.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell className="text-muted-foreground">{job.company}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium bg-primary/10 text-primary rounded-full">
                      {job.candidateCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted" aria-label="Open menu">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => handleOpen(job)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(job.id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateJobDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onJobCreated={handleJobCreated} />
    </div>
  )
}

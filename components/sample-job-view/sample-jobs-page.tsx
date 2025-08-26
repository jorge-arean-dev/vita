"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { JobCard } from "./job-card"
import { Briefcase } from "lucide-react"
import type { Job } from "@/lib/types"

// Mock data for demonstration
const mockJobs: Job[] = [
  {
    id: 1,
    companyName: "Amazon",
    companyLogoUrl: "/placeholder.svg?height=40&width=40",
    creationDate: "5 days ago",
    jobTitle: "Senior UI/UX Designer",
    commitment: ["Part-time", "Senior level"],
    rate: { value: 120, basis: "hr" },
    locationRequirement: "On-site",
    locationDetail: "San Francisco, CA",
    isSaved: false,
  },
  {
    id: 2,
    companyName: "Google",
    companyLogoUrl: "/placeholder.svg?height=40&width=40",
    creationDate: "30 days ago",
    jobTitle: "Graphic Designer",
    commitment: ["Full-time", "Flexible schedule"],
    rate: { value: 180000, basis: "year" },
    locationRequirement: "Hybrid",
    locationDetail: "Mountain View, CA",
    isSaved: true,
  },
  {
    id: 3,
    companyName: "Dribbble",
    companyLogoUrl: "/placeholder.svg?height=40&width=40",
    creationDate: "18 days ago",
    jobTitle: "Senior Motion Designer",
    commitment: ["Contract", "Remote"],
    rate: { value: 85, basis: "hr" },
    locationRequirement: "Remote Global",
    locationDetail: "San Francisco, CA",
    isSaved: false,
  },
  {
    id: 4,
    companyName: "Meta",
    companyLogoUrl: "/placeholder.svg?height=40&width=40",
    creationDate: "3 months ago",
    jobTitle: "UX Designer",
    commitment: ["Full-time", "In office"],
    rate: { value: 225000, basis: "year" },
    locationRequirement: "On-site",
    locationDetail: "New York, NY",
    isSaved: true,
  },
  {
    id: 5,
    companyName: "Airbnb",
    companyLogoUrl: "/placeholder.svg?height=40&width=40",
    creationDate: "1 day ago",
    jobTitle: "Junior UX/UI Designer",
    commitment: ["Contract", "Remote"],
    rate: { value: 100, basis: "hr" },
    locationRequirement: "Remote – Country Specific",
    locationDetail: "San Francisco, CA",
    isSaved: false,
  },
  {
    id: 6,
    companyName: "Apple",
    companyLogoUrl: "/placeholder.svg?height=40&width=40",
    creationDate: "6 days ago",
    jobTitle: "Graphic Designer",
    commitment: ["Full-time", "Flexible schedule"],
    rate: { value: 100000, basis: "year" },
    locationRequirement: "Hybrid",
    locationDetail: "Cupertino, CA",
    isSaved: false,
  },
]

export default function JobsBoardPage() {
  const [jobs] = useState(mockJobs)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs Board</h1>
          <p className="text-muted-foreground">View and manage your job listings in a visual board layout</p>
        </div>
        <Button>Create New Job</Button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-4">Create your first job to get started.</p>
          <Button>Create New Job</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

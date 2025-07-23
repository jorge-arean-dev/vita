"use client"

import { useState } from "react"
import { FileText, Linkedin, MoreHorizontal, Eye, Trash2, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Mock data for demonstration
const mockCandidates = [
  {
    id: 1,
    fullName: "John Doe",
    country: "United States",
    experience: 5,
    profilePicture: null,
    hasPDF: true,
    hasLinkedIn: true,
  },
  {
    id: 2,
    fullName: "Sarah Johnson",
    country: "Canada",
    experience: 8,
    profilePicture: null,
    hasPDF: true,
    hasLinkedIn: true,
  },
  {
    id: 3,
    fullName: "Miguel Rodriguez",
    country: "Spain",
    experience: 3,
    profilePicture: null,
    hasPDF: false,
    hasLinkedIn: true,
  },
  {
    id: 4,
    fullName: "Emma Chen",
    country: "Singapore",
    experience: 7,
    profilePicture: null,
    hasPDF: true,
    hasLinkedIn: false,
  },
  {
    id: 5,
    fullName: "David Wilson",
    country: "United Kingdom",
    experience: 12,
    profilePicture: null,
    hasPDF: true,
    hasLinkedIn: true,
  },
  {
    id: 6,
    fullName: "Priya Patel",
    country: "India",
    experience: 4,
    profilePicture: null,
    hasPDF: true,
    hasLinkedIn: true,
  },
]

interface Candidate {
  id: number
  fullName: string
  country: string
  experience: number
  profilePicture: string | null
  hasPDF: boolean
  hasLinkedIn: boolean
}

interface CandidatesTableProps {
  onCandidateOpen?: (candidate: Candidate) => void
}

export default function CandidatesTable({ onCandidateOpen }: CandidatesTableProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates)

  const handleOpen = (candidate: Candidate) => {
    console.log("Opening candidate:", candidate)
    onCandidateOpen?.(candidate)
  }

  const handleDelete = (candidateId: number) => {
    setCandidates(candidates.filter((candidate) => candidate.id !== candidateId))
    console.log("Deleted candidate:", candidateId)
  }

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (fullName: string) => {
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
    const index = fullName.length % colors.length
    return colors[index]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground">Manage your candidate profiles and track their progress</p>
        </div>
        <Button>Add Candidate</Button>
      </div>

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No candidates found</h3>
          <p className="text-muted-foreground mb-4">Add your first candidate to get started.</p>
          <Button>Add Candidate</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Headers */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-5">Name</div>
            <div className="col-span-3">Country</div>
            <div className="col-span-2">Experience</div>
            <div className="col-span-2 text-center">Documents</div>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-2">
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                onClick={() => handleOpen(candidate)}
                role="button"
                tabIndex={0}
                aria-label={`Open candidate: ${candidate.fullName}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleOpen(candidate)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Profile Picture + Name */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(candidate.fullName)} flex items-center justify-center text-white font-medium text-sm`}
                      >
                        {getInitials(candidate.fullName)}
                      </div>
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {candidate.fullName}
                      </span>
                    </div>

                    {/* Country */}
                    <div className="col-span-3">
                      <span className="text-muted-foreground">{candidate.country}</span>
                    </div>

                    {/* Experience */}
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        {candidate.experience} year{candidate.experience !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Documents + Actions */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      {/* PDF Icon */}
                      <div
                        className={`p-1.5 rounded ${
                          candidate.hasPDF ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-gray-100 text-gray-400"
                        } transition-colors`}
                        title={candidate.hasPDF ? "PDF Resume Available" : "No PDF Resume"}
                      >
                        <FileText className="h-4 w-4" />
                      </div>

                      {/* LinkedIn Icon */}
                      <div
                        className={`p-1.5 rounded ${
                          candidate.hasLinkedIn
                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-400"
                        } transition-colors`}
                        title={candidate.hasLinkedIn ? "LinkedIn Profile Available" : "No LinkedIn Profile"}
                      >
                        <Linkedin className="h-4 w-4" />
                      </div>

                      {/* Action Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                            aria-label={`Actions for ${candidate.fullName}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => handleOpen(candidate)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(candidate.id)
                            }}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

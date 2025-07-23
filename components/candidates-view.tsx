"use client"

import { useState, useTransition } from "react"
import { FileText, MoreHorizontal, Trash2, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { deleteCandidate, createSampleCandidates, CandidateData } from "@/app/actions/candidates"

interface CandidatesViewProps {
  candidates: CandidateData[]
}

export default function CandidatesView({ candidates: initialCandidates }: CandidatesViewProps) {
  const [candidates, setCandidates] = useState(initialCandidates)
  const [isPending, startTransition] = useTransition()

  const handleOpen = (candidate: CandidateData) => {
    console.log("Opening candidate:", candidate)
    // TODO: Navigate to candidate detail page or open modal
    const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
    toast.info(`Opening ${fullName || 'candidate'}&apos;s profile`)
  }

  const handleDelete = (candidateId: string) => {
    startTransition(async () => {
      try {
        await deleteCandidate(candidateId)
        setCandidates(candidates.filter((candidate) => candidate.id !== candidateId))
        toast.success("Candidate deleted successfully")
      } catch (error) {
        toast.error("Failed to delete candidate")
        console.error("Error deleting candidate:", error)
      }
    })
  }

  const handleCreateSamples = () => {
    startTransition(async () => {
      try {
        await createSampleCandidates()
        toast.success("Sample candidates created successfully")
        // Refresh the page to show new candidates
        window.location.reload()
      } catch (error) {
        toast.error("Failed to create sample candidates")
        console.error("Error creating sample candidates:", error)
      }
    })
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return `${first}${last}`.toUpperCase() || '??'
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
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground">See all the candidates you&apos;ve reviewed, sourced or assessed, past and present</p>
        </div>
        <div className="flex gap-2">
          {candidates.length === 0 && (
            <Button 
              variant="outline" 
              onClick={handleCreateSamples}
              disabled={isPending}
            >
              Create Sample Data
            </Button>
          )}
          <Button>Add Candidate</Button>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No candidates found</h3>
          <p className="text-muted-foreground mb-4">Add your first candidate to get started.</p>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleCreateSamples}
              disabled={isPending}
            >
              Create Sample Data
            </Button>
            <Button>Add Candidate</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Headers */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Experience</div>
            <div className="col-span-2">Added</div>
            <div className="col-span-2"></div>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-2">
            {candidates.map((candidate) => {
              const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Unknown Candidate'
              const location = candidate.country_name || candidate.country || "Unknown"

              return (
                <Card
                  key={candidate.id}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                  onClick={() => handleOpen(candidate)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open candidate: ${fullName}`}
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
                      <div className="col-span-4 flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${getAvatarColor(fullName)} flex items-center justify-center text-white font-medium text-sm`}
                        >
                          {getInitials(candidate.first_name, candidate.last_name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium group-hover:text-primary transition-colors">
                            {fullName}
                          </span>
                          {candidate.email && (
                            <span className="text-xs text-muted-foreground truncate max-w-48">
                              {candidate.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="col-span-2">
                        <span className="text-muted-foreground">{location}</span>
                      </div>

                      {/* Experience */}
                      <div className="col-span-2">
                        <span className="text-muted-foreground">
                          {candidate.years_experience !== null 
                            ? `${candidate.years_experience} year${candidate.years_experience !== 1 ? 's' : ''}`
                            : 'N/A'
                          }
                        </span>
                      </div>

                      {/* Added Date */}
                      <div className="col-span-2">
                        <span className="text-muted-foreground">
                          {new Date(candidate.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Documents + Actions */}
                      <div className="col-span-2 flex items-center justify-center gap-3">
                        {/* PDF Icon */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <FileText 
                              className={`h-5 w-5 cursor-pointer ${
                                candidate.resume_url ? "text-green-600" : "text-gray-400"
                              }`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{candidate.resume_url ? "Resume Available" : "No Resume Uploaded"}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* LinkedIn Icon */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-5 w-5 rounded-sm flex items-center justify-center cursor-pointer ${
                                candidate.linkedin ? "bg-[#0A66C2]" : "bg-gray-400"
                              }`}
                            >
                              <span className="text-white font-bold text-[10px] leading-none">in</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{candidate.linkedin ? "LinkedIn Profile Available" : "No LinkedIn Profile"}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Action Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                              aria-label={`Actions for ${fullName}`}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isPending}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(candidate.id)
                              }}
                              className="cursor-pointer text-destructive focus:text-destructive"
                              disabled={isPending}
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
              )
            })}
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  )
}
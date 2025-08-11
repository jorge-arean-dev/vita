"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Video, Plus, Loader2, AlertCircle } from "lucide-react"
import { createInterview, generateInterviewTitle } from "@/app/actions/interviews"
import { CandidateCombobox } from "./candidate-combobox"

interface CreateInterviewDialogProps {
  jobId: string
  onInterviewCreated: () => void
  variant?: "default" | "outline"
}

export default function CreateInterviewDialog({ 
  jobId, 
  onInterviewCreated,
  variant = "outline" 
}: CreateInterviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [candidateId, setCandidateId] = useState("")
  const [title, setTitle] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [creating, setCreating] = useState(false)
  const [generatingTitle, setGeneratingTitle] = useState(false)
  const { toast } = useToast()

  // Generate title when candidate is selected
  const handleCandidateSelect = async (candidate: { id: string; first_name: string | null; last_name: string | null; email: string | null }) => {
    if (!candidate?.id) return
    
    setGeneratingTitle(true)
    try {
      const { data: generatedTitle } = await generateInterviewTitle(candidate.id, jobId)
      if (generatedTitle) {
        setTitle(generatedTitle)
      }
    } catch (error) {
      console.error("Error generating title:", error)
      // Fallback title
      const candidateName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Unknown'
      setTitle(`Interview - ${candidateName}`)
    } finally {
      setGeneratingTitle(false)
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCandidateId("")
      setTitle("")
      setMeetingLink("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!candidateId) {
      toast({
        title: "Error",
        description: "Please select a candidate",
        variant: "destructive"
      })
      return
    }

    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive"
      })
      return
    }

    if (!meetingLink) {
      toast({
        title: "Error",
        description: "Please enter a Google Meet link",
        variant: "destructive"
      })
      return
    }

    if (!meetingLink.includes("meet.google.com")) {
      toast({
        title: "Error",
        description: "Only Google Meet links are supported in this MVP",
        variant: "destructive"
      })
      return
    }

    setCreating(true)

    try {
      const formData = new FormData()
      formData.append("jobId", jobId)
      formData.append("candidateId", candidateId)
      formData.append("title", title)
      formData.append("meetingLink", meetingLink)
      
      const result = await createInterview(formData)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Interview session created successfully. The bot will join your meeting shortly."
        })
        setOpen(false)
        onInterviewCreated()
      }
    } catch (error) {
      console.error("Error creating interview:", error)
      toast({
        title: "Error",
        description: "Failed to create interview session",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={variant === "default" ? "default" : "sm"}>
          <Plus className="h-4 w-4 mr-2" />
          Create Interview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <DialogTitle>Create Interview Session</DialogTitle>
            </div>
            <DialogDescription>
              Start a new interview recording session. Our AI bot will join your Google Meet to record and transcribe the conversation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="candidate">Candidate *</Label>
              <CandidateCombobox
                jobId={jobId}
                value={candidateId}
                onValueChange={setCandidateId}
                onCandidateSelect={handleCandidateSelect}
              />
              <p className="text-xs text-muted-foreground">
                Select the candidate for this interview
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Interview Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Interview - Candidate Name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={creating || generatingTitle}
                required
              />
              <p className="text-xs text-muted-foreground">
                {generatingTitle ? "Generating title..." : "Customize the interview title or use the auto-generated one"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-link">Google Meet Link *</Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                disabled={creating}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the Google Meet link for your interview
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> This is a mock implementation. In production, a Recall.ai bot would actually join your meeting. 
                For testing, you can use any Google Meet link format.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Create Interview
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
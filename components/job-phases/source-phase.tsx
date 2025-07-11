"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Copy, Edit } from "lucide-react"

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface SourcePhaseProps {
  jobId: string
  jobData?: JobData | null
  onDataChange: (data: Partial<JobData>) => void
}

export default function SourcePhase({ jobId, jobData }: SourcePhaseProps) {
  const [linkedinQuery, setLinkedinQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateQuery = async () => {
    setIsGenerating(true)
    try {
      // TODO: Implement API call to generate LinkedIn boolean query
      console.log("Generating LinkedIn query for job:", jobData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Placeholder data
      setLinkedinQuery(`(title:"Software Engineer" OR title:"Frontend Developer" OR title:"React Developer") AND (skills:"React" OR skills:"JavaScript" OR skills:"TypeScript") AND location:"United States"`)
    } catch (error) {
      console.error("Error generating query:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
    console.log("Copied to clipboard:", text)
  }

  const handleSave = () => {
    console.log("Saving source data:", { linkedinQuery })
    // TODO: Implement save logic
  }

  const handleRequestPreVettedCandidates = () => {
    console.log("Requesting pre-vetted candidates for job:", jobId)
    // TODO: Implement pre-vetted candidates request
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* LinkedIn Boolean Query Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">LinkedIn Boolean Query</h3>
            <p className="text-sm text-muted-foreground">
              Generate search queries for LinkedIn Recruiter or Sales Navigator
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>LinkedIn Search Query</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(linkedinQuery)}
                className="h-8 w-8 p-0"
                disabled={!linkedinQuery}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={linkedinQuery}
              onChange={(e) => setLinkedinQuery(e.target.value)}
              placeholder="LinkedIn boolean query will be generated based on your job requirements..."
              rows={6}
            />
          </div>

          <div className="flex justify-between">
            <Button 
              onClick={handleGenerateQuery}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* Pre-vetted Candidates Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Pre-vetted Candidates Request</h3>
          <p className="text-sm text-muted-foreground">
            Access pre-vetted candidates who are a fit for this job
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">
              Submit a request to access our database of pre-vetted candidates who match your job requirements. 
              Our team will review your job details and provide you with qualified candidates who are actively 
              looking for opportunities.
            </p>
            <Button 
              onClick={handleRequestPreVettedCandidates}
              className="w-full"
            >
              Request Pre-vetted Candidates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
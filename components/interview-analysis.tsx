"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Save } from "lucide-react"

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface Candidate {
  id: string
  name: string
  email?: string
}

interface InterviewAnalysisProps {
  jobId: string
  jobData?: JobData | null
}

export default function InterviewAnalysis({ jobId, jobData }: InterviewAnalysisProps) {
  const router = useRouter()
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [interviewTranscript, setInterviewTranscript] = useState("")
  const [evaluationResults, setEvaluationResults] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Mock candidates data
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" },
    { id: "4", name: "Sarah Wilson", email: "sarah@example.com" },
    { id: "5", name: "David Brown", email: "david@example.com" }
  ]


  const handleEvaluateTranscript = async () => {
    if (!selectedCandidate || !interviewTranscript.trim()) {
      return
    }

    setIsEvaluating(true)
    try {
      // TODO: Implement API call to evaluate interview transcript
      console.log("Evaluating transcript for candidate:", selectedCandidate)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock evaluation results
      const candidate = candidates.find(c => c.id === selectedCandidate)
      setEvaluationResults(`INTERVIEW EVALUATION REPORT
Candidate: ${candidate?.name}
Position: ${jobData?.title || 'Software Engineer'}
Date: ${new Date().toLocaleDateString()}

OVERALL RATING: 4.2/5

TECHNICAL COMPETENCY: 4.5/5
• Strong understanding of React and JavaScript fundamentals
• Demonstrated experience with modern development practices
• Good problem-solving approach with clear reasoning
• Solid grasp of testing methodologies

COMMUNICATION SKILLS: 4.0/5
• Clear and articulate in explanations
• Good at breaking down complex concepts
• Active listener, asked clarifying questions
• Professional demeanor throughout

CULTURAL FIT: 4.0/5
• Shows enthusiasm for continuous learning
• Collaborative mindset evident in examples
• Values align well with team culture
• Positive attitude toward feedback

AREAS OF STRENGTH:
• Technical depth in core technologies
• Problem-solving methodology
• Willingness to learn and adapt
• Team collaboration experience

AREAS FOR IMPROVEMENT:
• Could benefit from more system design experience
• Limited exposure to large-scale applications
• May need mentoring on advanced patterns

RECOMMENDATION: STRONG HIRE
This candidate demonstrates solid technical skills and excellent cultural alignment. Recommend proceeding to final interview stage with focus on system design scenarios.

NEXT STEPS:
• Schedule technical deep-dive session
• Provide system design challenge
• Connect with senior team members for culture assessment
• Prepare reference check questions`)
      
    } catch (error) {
      console.error("Error evaluating transcript:", error)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleSave = () => {
    console.log("Saving interview analysis:", { 
      selectedCandidate, 
      interviewTranscript, 
      evaluationResults 
    })
    // TODO: Implement save logic
  }

  const canEvaluate = selectedCandidate && interviewTranscript.trim()

  return (
    <div className="space-y-6">
      {/* Interview Input Card */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Interview Analysis</h2>
            <p className="text-muted-foreground">Analyze candidate interview responses and get AI-powered evaluation scores to make informed hiring decisions effortlessly.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label htmlFor="candidate-select">Select Candidate</Label>
            <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
              <SelectTrigger id="candidate-select">
                <SelectValue placeholder="Choose a candidate to evaluate" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name}
                    {candidate.email && (
                      <span className="text-muted-foreground"> ({candidate.email})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview Transcript */}
          <div className="space-y-2">
            <Label htmlFor="interview-transcript">Interview Transcript</Label>
            <Textarea
              id="interview-transcript"
              placeholder="Paste the full interview transcript here. Include both interviewer questions and candidate responses for comprehensive analysis..."
              value={interviewTranscript}
              onChange={(e) => setInterviewTranscript(e.target.value)}
              rows={12}
              className="min-h-[200px]"
            />
            <p className="text-sm text-muted-foreground">
              For best results, include the complete conversation with both questions and answers.
            </p>
          </div>

          {/* Evaluate Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleEvaluateTranscript}
              disabled={!canEvaluate || isEvaluating}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isEvaluating ? "Analyzing Interview..." : "Evaluate Interview"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Results Card */}
      {(isEvaluating || evaluationResults) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Evaluation Results</h3>
            <p className="text-sm text-muted-foreground">
              {isEvaluating 
                ? "Analyzing interview responses and generating comprehensive evaluation..." 
                : "AI-powered interview analysis completed"
              }
            </p>
          </CardHeader>
          <CardContent>
              {isEvaluating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <Sparkles className="h-8 w-8 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Analyzing interview transcript...
                    </p>
                  </div>
                </div>
              ) : evaluationResults ? (
                <div className="space-y-6">
                  {/* Evaluation Report */}
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                        {evaluationResults}
                      </pre>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t">
                    <Button onClick={handleSave} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save Evaluation Report
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
    </div>
  )
}
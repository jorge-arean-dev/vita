"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy } from "lucide-react"

interface Candidate {
  id: string
  name: string
  email?: string
}

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface AssessPhaseProps {
  jobId: string
  jobData?: JobData | null
  currentTab?: string
  onDataChange: (data: Partial<JobData>) => void
}

export default function AssessPhase({ jobId, jobData, currentTab, onDataChange }: AssessPhaseProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [interviewQuestions, setInterviewQuestions] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [interviewTranscript, setInterviewTranscript] = useState("")
  const [evaluationResults, setEvaluationResults] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const activeTab = currentTab || "interview-questions"

  // Mock candidates data
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" }
  ]

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("phase", "assess")
    params.set("tab", value)
    router.push(`/protected/jobs/${jobId}?${params.toString()}`)
  }

  const handleGenerateQuestions = async () => {
    setIsGenerating(true)
    try {
      // TODO: Implement API call to generate interview questions
      console.log("Generating interview questions for job:", jobData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock interview questions
      setInterviewQuestions(`1. Can you walk me through your experience with React and modern JavaScript frameworks? What projects have you worked on that demonstrate your proficiency?

2. Describe a challenging technical problem you've solved recently. What was your approach and what did you learn from the experience?

3. How do you approach code review and collaboration with team members? Can you give an example of how you've helped improve code quality in a team setting?

4. What's your experience with testing in frontend applications? How do you balance unit tests, integration tests, and end-to-end tests?

5. Tell me about a time when you had to learn a new technology or framework quickly for a project. How did you approach the learning process?

6. How do you handle performance optimization in React applications? What tools and techniques do you use to identify and fix performance issues?

7. Describe your experience with state management in complex applications. When would you choose Redux vs Context API vs other solutions?

8. What's your approach to handling errors and edge cases in your applications? Can you give an example?

9. How do you stay current with frontend development trends and best practices? What resources do you rely on?

10. Where do you see your career going in the next 2-3 years? What skills are you most interested in developing?`)
    } catch (error) {
      console.error("Error generating questions:", error)
    } finally {
      setIsGenerating(false)
    }
  }

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

AREAS FOR DEVELOPMENT:
• Limited experience with specific domain knowledge
• Could benefit from exposure to larger scale systems
• Room for growth in technical leadership

RECOMMENDATION: PROCEED TO NEXT ROUND
Strong candidate with solid technical foundation and good cultural fit. Recommend technical assessment or final round interview.

NEXT STEPS:
1. Technical coding assessment
2. Team fit interview with senior developers
3. Reference checks`)
    } catch (error) {
      console.error("Error evaluating transcript:", error)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
    console.log("Copied to clipboard")
  }

  const handleSave = () => {
    console.log("Saving assess data:", { interviewQuestions, selectedCandidate, interviewTranscript, evaluationResults })
    // TODO: Implement save logic
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interview-questions">Interview Questions</TabsTrigger>
          <TabsTrigger value="full-review">Full Interview Review</TabsTrigger>
        </TabsList>

        <TabsContent value="interview-questions">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Interview Questions</h3>
              <p className="text-sm text-muted-foreground">
                Generate tailored interview questions based on job requirements
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Interview Questions</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(interviewQuestions)}
                    className="h-8 w-8 p-0"
                    disabled={!interviewQuestions}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={interviewQuestions}
                  onChange={(e) => setInterviewQuestions(e.target.value)}
                  placeholder="Interview questions will be generated based on your job requirements..."
                  rows={15}
                />
              </div>

              <div className="flex justify-between">
                <Button 
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Questions"}
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full-review">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Interview Evaluation</h3>
              <p className="text-sm text-muted-foreground">
                Analyze interview transcripts and generate candidate evaluations
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Candidate Selection */}
              <div className="space-y-2">
                <Label>Candidate</Label>
                <div className="flex space-x-2">
                  <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.name} {candidate.email && `(${candidate.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    New
                  </Button>
                </div>
              </div>

              {/* Interview Transcript */}
              <div className="space-y-2">
                <Label>Interview Transcript</Label>
                <Textarea
                  value={interviewTranscript}
                  onChange={(e) => setInterviewTranscript(e.target.value)}
                  placeholder="Paste the interview transcript here..."
                  rows={8}
                />
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Save</Button>
                  <Button variant="outline" size="sm">Paste</Button>
                </div>
              </div>

              {/* Evaluate Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleEvaluateTranscript}
                  disabled={!selectedCandidate || !interviewTranscript.trim() || isEvaluating}
                  className="w-full sm:w-auto"
                >
                  {isEvaluating ? "Evaluating..." : "Evaluate Interview"}
                </Button>
              </div>

              {/* Evaluation Results */}
              {evaluationResults && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Evaluation Results</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(evaluationResults)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {evaluationResults}
                    </pre>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline">Save Evaluation</Button>
                    <Button variant="outline">Export Report</Button>
                  </div>
                </div>
              )}

              {/* Global Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSave}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
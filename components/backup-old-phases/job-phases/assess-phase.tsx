"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Sparkles, Edit, Save, X } from "lucide-react"

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

interface Question {
  type: string
  question: string
}

interface InterviewQuestion {
  id: string
  question: string
  isEditing: boolean
}

interface QuestionGroup {
  type: string
  displayName: string
  questions: InterviewQuestion[]
}

interface AssessPhaseProps {
  jobId: string
  jobData?: JobData | null
  currentTab?: string
  onDataChange: (data: Partial<JobData>) => void
}

// Question type mapping
const QUESTION_TYPE_MAPPING: Record<string, string> = {
  technical: "Technical Skills & Domain Knowledge",
  problem_solving: "Problem-Solving & Analytical Thinking", 
  communication: "Communication & Collaboration",
  leadership: "Leadership & Initiative",
  learning: "Adaptability & Learning Agility",
  cultural: "Cultural Fit & Values Alignment"
}

export default function AssessPhase({ jobId, jobData, currentTab }: AssessPhaseProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([])
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

  // Check if any questions exist
  const hasExistingQuestions = () => {
    return questionGroups.some(group => group.questions.length > 0)
  }

  const handleGenerateQuestions = async () => {
    // Check for existing content and show confirmation if needed
    if (hasExistingQuestions()) {
      const confirmed = window.confirm(
        "This will overwrite your existing questions. Are you sure you want to continue?"
      )
      if (!confirmed) return
    }

    setIsGenerating(true)
    try {
      // TODO: Implement API call to generate interview questions
      console.log("Generating interview questions for job:", jobData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock API response - matching the provided format
      const mockApiResponse = {
        questions: [
          {
            type: "technical",
            question: "Can you describe your experience with React.js and how you've used it in complex applications?"
          },
          {
            type: "technical", 
            question: "How have you implemented TypeScript in your React projects, and what benefits have you seen?"
          },
          {
            type: "problem_solving",
            question: "Tell me about a time you faced an unexpected technical challenge and how you solved it."
          },
          {
            type: "problem_solving",
            question: "Can you walk me through how you approach debugging a complex issue in a React application?"
          },
          {
            type: "communication",
            question: "How do you ensure your technical ideas are clearly communicated when working with non-technical stakeholders?"
          },
          {
            type: "communication",
            question: "Tell me about a time you had to explain a complex technical concept to someone without your background."
          },
          {
            type: "leadership",
            question: "Describe a situation where you took initiative to improve a development process or mentor a teammate."
          },
          {
            type: "leadership",
            question: "How do you approach code reviews and providing constructive feedback to junior developers?"
          },
          {
            type: "learning",
            question: "Tell me about a time you had to quickly learn a new technology or framework for a project."
          },
          {
            type: "learning",
            question: "How do you stay up to date with the rapidly changing React ecosystem and web development trends?"
          },
          {
            type: "cultural",
            question: "How do you thrive in an agile, collaborative environment with flexible schedules?"
          },
          {
            type: "cultural",
            question: "What does continuous learning mean to you, and how do you incorporate it into your daily work?"
          }
        ]
      }
      
      // Process API response and group questions
      const groupedQuestions: Record<string, InterviewQuestion[]> = {}
      
      mockApiResponse.questions.forEach((q, index) => {
        if (!groupedQuestions[q.type]) {
          groupedQuestions[q.type] = []
        }
        groupedQuestions[q.type].push({
          id: `${q.type}-${index}`,
          question: q.question,
          isEditing: false
        })
      })
      
      // Convert to QuestionGroup array
      const newQuestionGroups: QuestionGroup[] = Object.entries(groupedQuestions).map(([type, questions]) => ({
        type,
        displayName: QUESTION_TYPE_MAPPING[type] || type,
        questions
      }))
      
      setQuestionGroups(newQuestionGroups)
      
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

  // Individual question edit handlers
  const handleEditQuestion = (groupType: string, questionId: string) => {
    setQuestionGroups(prev => prev.map(group => {
      if (group.type === groupType) {
        return {
          ...group,
          questions: group.questions.map(q => 
            q.id === questionId ? { ...q, isEditing: true } : q
          )
        }
      }
      return group
    }))
  }

  const handleSaveQuestion = (groupType: string, questionId: string, newQuestion: string) => {
    setQuestionGroups(prev => prev.map(group => {
      if (group.type === groupType) {
        return {
          ...group,
          questions: group.questions.map(q => 
            q.id === questionId ? { ...q, question: newQuestion, isEditing: false } : q
          )
        }
      }
      return group
    }))
  }

  const handleCancelEdit = (groupType: string, questionId: string) => {
    setQuestionGroups(prev => prev.map(group => {
      if (group.type === groupType) {
        return {
          ...group,
          questions: group.questions.map(q => 
            q.id === questionId ? { ...q, isEditing: false } : q
          )
        }
      }
      return group
    }))
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
    console.log("Copied to clipboard")
  }

  const handleSave = () => {
    console.log("Saving assess data:", { questionGroups, selectedCandidate, interviewTranscript, evaluationResults })
    // TODO: Implement save logic
  }

  // Individual Question Component
  const QuestionItem = ({ question, groupType }: { question: InterviewQuestion; groupType: string }) => {
    const [editedText, setEditedText] = useState(question.question)

    const handleSave = () => {
      handleSaveQuestion(groupType, question.id, editedText)
    }

    const handleCancel = () => {
      setEditedText(question.question)
      handleCancelEdit(groupType, question.id)
    }

    if (question.isEditing) {
      return (
        <div className="space-y-2">
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[80px]"
            placeholder="Enter interview question..."
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-start justify-between space-x-3 p-3 bg-muted/30 rounded-lg">
        <p className="text-sm flex-1 leading-relaxed">{question.question}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditQuestion(groupType, question.id)}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    )
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Interview Questions</h3>
                <p className="text-sm text-muted-foreground">
                  {isGenerating 
                    ? "Generating questions..." 
                    : "Generate tailored interview questions based on job requirements"
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {!isGenerating && (
                  <Button onClick={handleGenerateQuestions} size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                )}
                {isGenerating && (
                  <Button disabled size="sm">
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionGroups.length === 0 && !isGenerating && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No interview questions generated yet.</p>
                  <p className="text-sm">Click "Generate" to create questions based on your job requirements.</p>
                </div>
              )}
              
              {isGenerating && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="h-5 w-5 animate-spin" />
                    <p>Generating questions...</p>
                  </div>
                </div>
              )}

              {questionGroups.map((group) => (
                <Card key={group.type} className="bg-muted/20">
                  <CardHeader className="pb-3">
                    <h4 className="text-base font-medium">{group.displayName}</h4>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.questions.map((question) => (
                      <QuestionItem 
                        key={question.id} 
                        question={question} 
                        groupType={group.type} 
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}

              {questionGroups.length > 0 && (
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              )}
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
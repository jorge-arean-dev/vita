"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Sparkles, Edit, Save, X } from "lucide-react"

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
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

interface InterviewQuestionsGeneratorProps {
  jobId: string
  jobData?: JobData | null
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

export default function InterviewQuestionsGenerator({ jobId, jobData }: InterviewQuestionsGeneratorProps) {
  const router = useRouter()
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([])
  const [isGenerating, setIsGenerating] = useState(false)


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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          {/* Tool Header with responsive layout */}
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Interview Questions Generator</h2>
            </div>
              
              {/* Subtitle spans full width */}
              <p className="text-muted-foreground">Generate tailored interview questions automatically based on your job requirements to streamline your interview process.</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {isGenerating 
                  ? "Generating tailored interview questions..." 
                  : hasExistingQuestions()
                    ? "AI-generated interview questions based on job requirements"
                    : "Generate interview questions tailored to your job requirements"
                }
              </p>
              <div className="flex items-center space-x-2">
                {!isGenerating && (
                  <Button onClick={handleGenerateQuestions} size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {hasExistingQuestions() ? "Regenerate" : "Generate Questions"}
                  </Button>
                )}
                {isGenerating && (
                  <Button disabled size="sm">
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Show prompt message when no questions exist */}
            {!hasExistingQuestions() && !isGenerating && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Click &quot;Generate Questions&quot; to create tailored interview questions based on your job requirements.
                </p>
              </div>
            )}

            {/* Loading state */}
            {isGenerating && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Sparkles className="h-8 w-8 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Generating interview questions...
                  </p>
                </div>
              </div>
            )}

            {/* Generated Questions */}
            {hasExistingQuestions() && !isGenerating && (
              <div className="space-y-6">
                {questionGroups.map((group) => (
                  <div key={group.type} className="space-y-4">
                    <h4 className="text-lg font-medium text-primary border-b pb-2">
                      {group.displayName}
                    </h4>
                    <div className="space-y-3">
                      {group.questions.map((question) => (
                        <QuestionItem 
                          key={question.id} 
                          question={question} 
                          groupType={group.type} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
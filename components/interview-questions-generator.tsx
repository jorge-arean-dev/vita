"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Sparkles, Edit, Save, X, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  getJobDescriptions,
  getExistingQuestions,
  saveInterviewQuestions,
  updateInterviewQuestion,
  getJobDataForQuestions,
  type JobDescription
} from "@/app/actions/interview-questions"

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

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface InterviewQuestionsGeneratorProps {
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

export default function InterviewQuestionsGenerator({ jobData }: InterviewQuestionsGeneratorProps) {
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([])
  const [selectedJobDescription, setSelectedJobDescription] = useState<string>("")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<{ groupType: string; questionId: string } | null>(null)
  const { toast } = useToast()


  // Load data on mount
  useEffect(() => {
    if (!jobData?.id) return
    
    const loadData = async () => {
      try {
        const [descriptions, existingQuestions] = await Promise.all([
          getJobDescriptions(jobData.id),
          getExistingQuestions(jobData.id)
        ])
        
        setJobDescriptions(descriptions)
        
        // Auto-select if only one description
        if (descriptions.length === 1) {
          setSelectedJobDescription(descriptions[0].id)
        }
        
        // Convert existing questions to UI format
        if (existingQuestions.length > 0) {
          const groupedQuestions: Record<string, InterviewQuestion[]> = {}
          
          existingQuestions.forEach((q) => {
            if (!groupedQuestions[q.type]) {
              groupedQuestions[q.type] = []
            }
            groupedQuestions[q.type].push({
              id: q.id,
              question: q.question,
              isEditing: false
            })
          })
          
          const newQuestionGroups: QuestionGroup[] = Object.entries(groupedQuestions).map(([type, questions]) => ({
            type,
            displayName: QUESTION_TYPE_MAPPING[type] || type,
            questions
          }))
          
          setQuestionGroups(newQuestionGroups)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load job descriptions and existing questions",
          variant: "destructive",
        })
      } finally {
        setIsLoadingData(false)
      }
    }
    
    loadData()
  }, [jobData?.id, toast])

  // Check if any questions exist
  const hasExistingQuestions = () => {
    return questionGroups.some(group => group.questions.length > 0)
  }

  // Copy single question to clipboard
  const copyQuestionToClipboard = async (question: string) => {
    try {
      await navigator.clipboard.writeText(question)
      toast({
        title: "Copied to clipboard",
        description: "Question copied successfully",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Copy all questions to clipboard in markdown format
  const copyAllQuestionsToClipboard = async () => {
    try {
      let markdownContent = ""
      
      questionGroups.forEach((group) => {
        markdownContent += `## ${group.displayName}\n\n`
        group.questions.forEach((question) => {
          markdownContent += `- ${question.question}\n`
        })
        markdownContent += "\n"
      })

      await navigator.clipboard.writeText(markdownContent.trim())
      toast({
        title: "Copied to clipboard",
        description: "All questions copied successfully",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleGenerateQuestions = async () => {
    if (!jobData?.id || !selectedJobDescription) {
      toast({
        title: "Error",
        description: "Please select a job description first",
        variant: "destructive",
      })
      return
    }

    // Check for existing content and show confirmation if needed
    if (hasExistingQuestions()) {
      setShowOverwriteDialog(true)
      return
    }

    await generateQuestions()
  }

  const generateQuestions = async () => {
    if (!jobData?.id || !selectedJobDescription) return

    setIsGenerating(true)
    try {
      // Get job data for API call
      const jobDataForAPI = await getJobDataForQuestions(jobData.id, selectedJobDescription)
      console.log('Sending to API:', jobDataForAPI)
      
      // Call the API directly
      const response = await fetch(
        "https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/generate-interview-questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(jobDataForAPI)
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(errorData.error || errorData.details || `API Error: ${response.status} ${response.statusText}`)
      }

      const apiResponse = await response.json()
      
      // Process API response and group questions
      const groupedQuestions: Record<string, InterviewQuestion[]> = {}
      
      apiResponse.questions.forEach((q: { type: string; question: string }, index: number) => {
        if (!groupedQuestions[q.type]) {
          groupedQuestions[q.type] = []
        }
        groupedQuestions[q.type].push({
          id: `${q.type}-${index}-${Date.now()}`, // Unique ID with timestamp
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
      
      // Save to database
      await saveInterviewQuestions(
        jobData.id,
        apiResponse.questions
      )
      
      toast({
        title: "Success",
        description: "Interview questions generated and saved successfully",
      })
      
    } catch (error) {
      console.error("Error generating questions:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate questions"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
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

  const handleSaveQuestion = async (groupType: string, questionId: string, newQuestion: string) => {
    try {
      // Check if it's a UUID (database ID) vs a generated ID with timestamp
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId)
      
      if (isUUID) {
        console.log('Updating question in database:', questionId, newQuestion)
        await updateInterviewQuestion(questionId, newQuestion)
        console.log('Database update completed')
      } else {
        console.log('Skipping database update for generated ID:', questionId)
      }
      
      // Update local state
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
      
      toast({
        title: "Success",
        description: "Question updated successfully",
      })
    } catch (error) {
      console.error("Error saving question:", error)
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = (groupType: string, questionId: string) => {
    // For now, just cancel without checking for changes
    // In a more complex implementation, you could check if the text was modified
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
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyQuestionToClipboard(question.question)}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditQuestion(groupType, question.id)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
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
                  <Button 
                    onClick={handleGenerateQuestions} 
                    size="sm"
                    disabled={isLoadingData || jobDescriptions.length === 0 || !selectedJobDescription}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {hasExistingQuestions() ? "Regenerate" : "Generate"}
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
            {/* Job Description Selection */}
            {jobDescriptions.length > 1 && !isLoadingData && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Job Description <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Choose which job description to use for generating interview questions
                </p>
                <Select value={selectedJobDescription} onValueChange={setSelectedJobDescription}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a job description..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobDescriptions.map((desc) => (
                      <SelectItem key={desc.id} value={desc.id}>
                        {desc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Loading initial data */}
            {isLoadingData && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading job descriptions...
                  </p>
                </div>
              </div>
            )}

            {/* Show prompt message when no questions exist */}
            {!hasExistingQuestions() && !isGenerating && !isLoadingData && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {jobDescriptions.length === 0 
                    ? "No job descriptions found. Please create a job description first." 
                    : selectedJobDescription 
                      ? "Click \"Generate Questions\" to create tailored interview questions based on your job requirements."
                      : "Please select a job description to generate interview questions."
                  }
                </p>
                {jobDescriptions.length === 0 && jobData?.id && (
                  <Button 
                    onClick={() => window.location.href = `/protected/jobs/${jobData.id}/job-description-builder`}
                    size="sm"
                  >
                    Go to Job Description Builder
                  </Button>
                )}
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
                {/* Copy All Questions Button */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllQuestionsToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Questions
                  </Button>
                </div>
                
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

        {/* Overwrite Confirmation Dialog */}
        <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Overwrite Existing Questions?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently replace all existing interview questions with new AI-generated ones. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={async () => {
                  setShowOverwriteDialog(false)
                  await generateQuestions()
                }}
              >
                Yes, Overwrite Questions
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes to this question. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Editing</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  setShowUnsavedChangesDialog(false)
                  if (pendingEdit) {
                    handleCancelEdit(pendingEdit.groupType, pendingEdit.questionId)
                    setPendingEdit(null)
                  }
                }}
              >
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
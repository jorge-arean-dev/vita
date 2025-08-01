"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, ChevronRight, Plus, Sparkles, Save, X, User, UserPlus, Trash2, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CardTitle } from "@/components/ui/card"
import ToggleSlider from "@/components/ui/toggle-slider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

// Mock requirement names lookup - will be replaced with actual DB lookup
const mockRequirementNames: { [key: string]: string } = {
  "req_1": "TypeScript",
  "req_2": "React", 
  "req_3": "Node.js",
  "req_4": "PostgreSQL",
  "req_5": "MongoDB",
  "req_6": "AWS",
  "req_7": "Financial Services Experience"
}

interface Candidate {
  id: string
  name: string
  email?: string
}

interface RequirementEvaluation {
  job_requirement_id: string
  score: number
  status: "strong" | "adequate" | "weak" | "missing"
  feedback: string
}

interface AnalysisResults {
  match_analysis: {
    overall_score: number
    status: "strong" | "adequate" | "weak" | "missing"
    overall_feedback: string
    matched_mandatory_requirements: number
    total_mandatory_requirements: number
  }
  requirement_evaluations: RequirementEvaluation[]
  summary: {
    strengths: string[]
    gaps: string[]
  }
  recruiter_recommendations: {
    interview_strategy: string[]
    other_options: string[]
  }
  candidate: {
    first_name: string
    last_name: string
  }
}

interface MatchAnalysis {
  id: string
  title: string
  candidateInfo: {
    name: string
    type: "existing" | "new"
    source?: string
  }
  results?: AnalysisResults
  created_at: string
  isExpanded?: boolean
  isNew?: boolean
}

// Circular Progress Component
interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  status: "strong" | "adequate" | "weak" | "missing"
}

function CircularProgress({ value, size = 120, strokeWidth = 8, className = "", status }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (status: string) => {
    if (status === "strong") return "stroke-[hsl(var(--match-strong))]"
    if (status === "adequate") return "stroke-[hsl(var(--match-adequate))]"
    if (status === "weak") return "stroke-[hsl(var(--match-weak))]"
    if (status === "missing") return "stroke-[hsl(var(--match-missing))]"
    return "stroke-gray-500"
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getColor(status)}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{value}%</span>
      </div>
    </div>
  )
}

// Utility functions for styling
function getStatusBadge(score: number) {
  if (score >= 75) {
    return <Badge className="bg-[hsl(var(--match-strong-bg))] text-[hsl(var(--match-strong-text))] hover:bg-[hsl(var(--match-strong-bg))] border-[hsl(var(--match-strong-border))]">Strong</Badge>
  }
  if (score >= 50) {
    return <Badge className="bg-[hsl(var(--match-adequate-bg))] text-[hsl(var(--match-adequate-text))] hover:bg-[hsl(var(--match-adequate-bg))] border-[hsl(var(--match-adequate-border))]">Adequate</Badge>
  }
  if (score >= 25) {
    return <Badge className="bg-[hsl(var(--match-weak-bg))] text-[hsl(var(--match-weak-text))] hover:bg-[hsl(var(--match-weak-bg))] border-[hsl(var(--match-weak-border))]">Weak</Badge>
  }
  return <Badge className="bg-[hsl(var(--match-missing-bg))] text-[hsl(var(--match-missing-text))] hover:bg-[hsl(var(--match-missing-bg))] border-[hsl(var(--match-missing-border))]">Missing</Badge>
}

function getProgressBarColor(score: number) {
  if (score >= 75) return "bg-[hsl(var(--match-strong))]"
  if (score >= 50) return "bg-[hsl(var(--match-adequate))]"
  if (score >= 25) return "bg-[hsl(var(--match-weak))]"
  return "bg-[hsl(var(--match-missing))]"
}

function getBannerColor(status: string) {
  if (status === "strong") return "bg-[hsl(var(--match-strong-bg))] text-[hsl(var(--match-strong-text))] border-[hsl(var(--match-strong-border))]"
  if (status === "adequate") return "bg-[hsl(var(--match-adequate-bg))] text-[hsl(var(--match-adequate-text))] border-[hsl(var(--match-adequate-border))]"
  if (status === "weak") return "bg-[hsl(var(--match-weak-bg))] text-[hsl(var(--match-weak-text))] border-[hsl(var(--match-weak-border))]"
  if (status === "missing") return "bg-[hsl(var(--match-missing-bg))] text-[hsl(var(--match-missing-text))] border-[hsl(var(--match-missing-border))]"
  return "bg-gray-100 text-gray-800 border-gray-200"
}

export default function CandidateMatchAnalysis() {
  const [mounted, setMounted] = useState(false)
  const [matchAnalyses, setMatchAnalyses] = useState<MatchAnalysis[]>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({})
  const { toast } = useToast()
  
  // State for new analysis
  const [candidateType, setCandidateType] = useState<"existing" | "new">("new")
  const [selectedExistingCandidate, setSelectedExistingCandidate] = useState<string>("")
  const [isCandidateDropdownOpen, setIsCandidateDropdownOpen] = useState(false)
  const [candidateSearchValue, setCandidateSearchValue] = useState("")
  const [newCandidateMethod, setNewCandidateMethod] = useState<"linkedin" | "pdf">("linkedin")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isRunningAnalysis, setIsRunningAnalysis] = useState<{ [key: string]: boolean }>({})
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})
  
  // Animation states for each analysis
  const [visibleSections, setVisibleSections] = useState<{ [key: string]: string[] }>({})
  const [visibleRequirementCards, setVisibleRequirementCards] = useState<{ [key: string]: number }>({})
  const [visibleProgressBars, setVisibleProgressBars] = useState<{ [key: string]: number }>({})
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: { requirements: boolean; recommendations: boolean } }>({})

  // Mock candidates data - in real implementation, this would come from API
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" },
    { id: "4", name: "Sarah Wilson", email: "sarah@example.com" },
    { id: "5", name: "David Brown", email: "david@example.com" }
  ]

  // Initialize after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter candidates based on search input
  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(candidateSearchValue.toLowerCase())
  )

  // Get next counter for analysis title
  const getNextAnalysisCounter = () => {
    const existingCounts = matchAnalyses
      .map(ma => {
        const match = ma.title.match(/Analysis #(\d+)$/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(count => count > 0)
    
    return existingCounts.length > 0 ? Math.max(...existingCounts) + 1 : 1
  }

  const handleNewMatchAnalysis = () => {
    const counter = getNextAnalysisCounter()
    const newAnalysis: MatchAnalysis = {
      id: `new-${Date.now()}`,
      title: `Match Analysis #${counter}`,
      candidateInfo: {
        name: "Not Selected",
        type: "new"
      },
      created_at: new Date().toISOString(),
      isExpanded: true,
      isNew: true
    }
    
    // Reset form state
    setCandidateType("new")
    setSelectedExistingCandidate("")
    setLinkedinUrl("")
    setUploadedFile(null)
    setNewCandidateMethod("linkedin")
    
    setMatchAnalyses([newAnalysis, ...matchAnalyses])
  }

  const handleToggleExpand = (id: string) => {
    setMatchAnalyses(prevAnalyses => 
      prevAnalyses.map((ma) => 
        ma.id === id ? { ...ma, isExpanded: !ma.isExpanded } : ma
      )
    )
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    
    setIsDeleting({ ...isDeleting, [deleteConfirmId]: true })
    
    try {
      // TODO: Implement API call to delete from database
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMatchAnalyses(matchAnalyses.filter((ma) => ma.id !== deleteConfirmId))
      
      toast({
        title: "Success",
        description: "Match analysis deleted successfully.",
      })
      
      setDeleteConfirmId(null)
    } catch (error) {
      console.error("Error deleting match analysis:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting({ ...isDeleting, [deleteConfirmId]: false })
    }
  }

  // Check if we can run analysis
  const canRunAnalysis = (analysisId: string) => {
    if (candidateType === "existing") {
      return selectedExistingCandidate !== ""
    } else {
      return newCandidateMethod === "linkedin" ? linkedinUrl.trim() !== "" : uploadedFile !== null
    }
  }

  // Handle candidate selection from combobox
  const handleCandidateSelect = (candidateId: string) => {
    setSelectedExistingCandidate(candidateId)
    setIsCandidateDropdownOpen(false)
    setCandidateSearchValue("")
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setUploadedFile(file)
    }
  }

  // Handle running analysis
  const handleRunAnalysis = async (analysisId: string) => {
    if (!canRunAnalysis(analysisId)) return

    setIsRunningAnalysis({ ...isRunningAnalysis, [analysisId]: true })
    try {
      // TODO: Implement API call to analyze candidate
      console.log("Running analysis for:", candidateType, {
        existingCandidate: selectedExistingCandidate,
        newCandidateMethod,
        linkedinUrl,
        uploadedFile: uploadedFile?.name
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Get candidate name for the analysis
      let candidateName = "Unknown Candidate"
      if (candidateType === "existing") {
        const existingCandidate = candidates.find(c => c.id === selectedExistingCandidate)
        candidateName = existingCandidate?.name || "Unknown Candidate"
      } else {
        candidateName = newCandidateMethod === "linkedin" 
          ? linkedinUrl.split('/').pop() || "LinkedIn Candidate"
          : uploadedFile?.name.replace('.pdf', '') || "Resume Candidate"
      }

      // Mock analysis results matching API structure
      const results: AnalysisResults = {
        match_analysis: {
          overall_score: 18,
          status: "missing",
          overall_feedback: "This candidate shows potential but has significant skill gaps for the senior role requirements.",
          matched_mandatory_requirements: 0,
          total_mandatory_requirements: 5
        },
        requirement_evaluations: [
          {
            job_requirement_id: "req_1",
            score: 6,
            status: "missing",
            feedback: "Candidate has beginner-level TypeScript (1 year) but expert level required (5+ years). Significant skill gap identified for senior role."
          },
          {
            job_requirement_id: "req_2",
            score: 39,
            status: "weak",
            feedback: "Candidate demonstrates advanced proficiency in React with 3.5 years of experience, but the expert level is required."
          },
          {
            job_requirement_id: "req_3",
            score: 39,
            status: "weak",
            feedback: "Similar to React, the candidate has advanced experience in Node (3.5 years), yet the role demands expert-level skills."
          },
          {
            job_requirement_id: "req_4",
            score: 11,
            status: "missing",
            feedback: "Candidate has beginner-level experience with PostgreSQL (1 year), while the role requires advanced proficiency."
          },
          {
            job_requirement_id: "req_5",
            score: 11,
            status: "missing",
            feedback: "With only beginner-level experience in MongoDB (1 year), the candidate does not meet the advanced requirement."
          }
        ],
        summary: {
          strengths: [
            "Strong React and Node.js foundation with 3.5 years experience each",
            "5 years of experience in software engineering, demonstrating solid full-stack development background",
            "Advanced skills in Agile methodologies, Scrum, and Test Driven Development"
          ],
          gaps: [
            "TypeScript proficiency significantly below senior level requirements",
            "Missing advanced skills in PostgreSQL and MongoDB, which are critical for the role",
            "Overall experience level doesn't match senior role expectations"
          ]
        },
        recruiter_recommendations: {
          interview_strategy: [
            "Dig deeper into TypeScript projects during technical interview to assess potential for growth",
            "Explore candidate's understanding of advanced React and Node concepts",
            "Discuss past experiences with databases to evaluate problem-solving skills"
          ],
          other_options: [
            "Consider 'Mid-Level with Senior Potential' positioning instead, focusing on growth mindset",
            "Explore opportunities for mentorship or training in TypeScript and databases",
            "Look for roles that allow gradual upskilling while leveraging existing strengths"
          ]
        },
        candidate: {
          first_name: candidateName.split(' ')[0] || "Unknown",
          last_name: candidateName.split(' ')[1] || ""
        }
      }

      // Update the analysis with results
      setMatchAnalyses(prevAnalyses =>
        prevAnalyses.map(ma => 
          ma.id === analysisId 
            ? { 
                ...ma, 
                results,
                candidateInfo: {
                  name: candidateName,
                  type: candidateType,
                  source: candidateType === "new" ? newCandidateMethod : undefined
                },
                title: `Match Analysis for ${results.candidate.first_name}${results.candidate.last_name ? ` ${results.candidate.last_name}` : ""}`
              }
            : ma
        )
      )

      // Trigger animations for the new results
      setTimeout(() => {
        triggerAnimationsForAnalysis(analysisId, results.requirement_evaluations.length)
      }, 100)
    } catch (error) {
      console.error("Error running analysis:", error)
      toast({
        title: "Error",
        description: "Failed to run analysis. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRunningAnalysis({ ...isRunningAnalysis, [analysisId]: false })
    }
  }

  // Handle saving analysis
  const handleSaveAnalysis = async (analysisId: string) => {
    const analysis = matchAnalyses.find(ma => ma.id === analysisId)
    if (!analysis || !analysis.results) return

    setIsSaving({ ...isSaving, [analysisId]: true })
    
    try {
      // TODO: Implement API call to save analysis
      console.log("Saving analysis:", analysis)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update the analysis to mark it as saved
      setMatchAnalyses(prevAnalyses =>
        prevAnalyses.map(ma => 
          ma.id === analysisId 
            ? { ...ma, isNew: false, isExpanded: false }
            : ma
        )
      )
      
      toast({
        title: "Success",
        description: "Match analysis saved successfully.",
      })
    } catch (error) {
      console.error("Error saving analysis:", error)
      toast({
        title: "Error",
        description: "Failed to save analysis. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving({ ...isSaving, [analysisId]: false })
    }
  }

  // Handle discarding analysis
  const handleDiscardAnalysis = (analysisId: string) => {
    setMatchAnalyses(matchAnalyses.filter(ma => ma.id !== analysisId))
    // Clean up animation states
    setVisibleSections(prev => {
      const newState = { ...prev }
      delete newState[analysisId]
      return newState
    })
    setVisibleRequirementCards(prev => {
      const newState = { ...prev }
      delete newState[analysisId]
      return newState
    })
    setVisibleProgressBars(prev => {
      const newState = { ...prev }
      delete newState[analysisId]
      return newState
    })
    toast({
      title: "Analysis discarded",
      description: "The match analysis has been discarded.",
    })
  }

  // Trigger animations for analysis results
  const triggerAnimationsForAnalysis = (analysisId: string, requirementCount: number) => {
    // Reset animation states for this analysis
    setVisibleSections(prev => ({ ...prev, [analysisId]: [] }))
    setVisibleRequirementCards(prev => ({ ...prev, [analysisId]: 0 }))
    setVisibleProgressBars(prev => ({ ...prev, [analysisId]: 0 }))

    // Sequential section reveal
    const timeline = [
      { section: "combined-card", delay: 0 },
      { section: "summary", delay: 800 },
      { section: "requirements-header", delay: 1600 },
      { section: "recommendations", delay: 2400 },
    ]

    timeline.forEach(({ section, delay }) => {
      setTimeout(() => {
        setVisibleSections((prev) => ({
          ...prev,
          [analysisId]: [...(prev[analysisId] || []), section]
        }))
      }, delay)
    })

    // Start progress bars animation after combined card appears
    setTimeout(() => {
      const progressInterval = setInterval(() => {
        setVisibleProgressBars((prev) => {
          const current = prev[analysisId] || 0
          if (current < requirementCount) {
            return { ...prev, [analysisId]: current + 1 }
          } else {
            clearInterval(progressInterval)
            return prev
          }
        })
      }, 200)
    }, 0)

    // Show all requirement cards immediately when requirements section appears
    setTimeout(() => {
      setVisibleRequirementCards((prev) => ({
        ...prev,
        [analysisId]: requirementCount
      }))
    }, 1600)
  }

  // Check if section is visible for specific analysis
  const isVisible = (analysisId: string, section: string) => 
    (visibleSections[analysisId] || []).includes(section)

  // Scroll to requirement evaluation card
  const scrollToRequirement = (requirementId: string) => {
    const element = document.getElementById(`requirement-${requirementId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Toggle collapsible sections
  const toggleSection = (analysisId: string, section: 'requirements' | 'recommendations') => {
    setCollapsedSections(prev => ({
      ...prev,
      [analysisId]: {
        ...prev[analysisId],
        [section]: !prev[analysisId]?.[section]
      }
    }))
  }

  // Check if section is collapsed
  const isSectionCollapsed = (analysisId: string, section: 'requirements' | 'recommendations') => {
    return collapsedSections[analysisId]?.[section] || false
  }

  // Prevent hydration mismatch - return skeleton instead of null
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Candidate Match Analysis</h2>
              <p className="text-muted-foreground">Instantly assess how well candidates match your job requirements with AI-powered analysis.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with New button */}
      <div className="pb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Candidate Match Analysis</h2>
            <p className="text-muted-foreground">
              Upload resumes or LinkedIn profiles to instantly assess how well candidates match your job requirements with AI-powered analysis.
            </p>
          </div>
          <Button onClick={handleNewMatchAnalysis} className="gap-2">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* Match Analyses List */}
      <div className="space-y-4">
        {matchAnalyses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No match analyses created yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first candidate match analysis to get started.
              </p>
              <Button onClick={handleNewMatchAnalysis} className="gap-2">
                <Plus className="h-4 w-4" />
                New Match Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          matchAnalyses.map((analysis) => (
            <Card key={analysis.id} className="w-full">
              <CardHeader className={analysis.isExpanded ? "pb-3" : "py-0"}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Collapse/Expand Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleExpand(analysis.id)}
                      className="h-8 w-8 p-0"
                      aria-label={analysis.isExpanded ? "Collapse" : "Expand"}
                    >
                      {analysis.isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Analysis Title */}
                    <h3 className="text-lg font-semibold">{analysis.title}</h3>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {!analysis.isExpanded && !analysis.isNew && (
                      // Collapsed view - only delete button for saved analyses
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(analysis.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        aria-label="Delete match analysis"
                        disabled={isDeleting[analysis.id]}
                      >
                        {isDeleting[analysis.id] ? (
                          <Trash2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {/* Delete button for saved analyses in expanded view */}
                    {analysis.isExpanded && !analysis.isNew && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(analysis.id)}
                        className="gap-2"
                        disabled={isDeleting[analysis.id]}
                      >
                        {isDeleting[analysis.id] ? (
                          <>
                            <Trash2 className="h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* Save/Discard buttons for new analyses with results */}
                    {analysis.isExpanded && analysis.isNew && analysis.results && (
                      <>
                        <Button 
                          onClick={() => handleDiscardAnalysis(analysis.id)} 
                          variant="outline"
                          size="sm"
                          disabled={isSaving[analysis.id]}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Discard
                        </Button>
                        <Button 
                          onClick={() => handleSaveAnalysis(analysis.id)}
                          size="sm"
                          disabled={isSaving[analysis.id]}
                          className="gap-2"
                        >
                          {isSaving[analysis.id] ? (
                            <>
                              <Save className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content */}
              {analysis.isExpanded && (
                <CardContent className="pt-0">
                  {analysis.isNew && !analysis.results ? (
                    // New Analysis - Candidate Selection Panel
                    <div className="space-y-6">
                      {/* Candidate Type Selection */}
                      <div className="flex justify-center">
                        <ToggleSlider
                          option1="New Candidate"
                          option2="Existing Candidate"
                          icon1={<UserPlus className="h-4 w-4" />}
                          icon2={<User className="h-4 w-4" />}
                          defaultOption={candidateType === "new" ? 1 : 2}
                          onChange={(option) => setCandidateType(option === 1 ? "new" : "existing")}
                        />
                      </div>

                      {/* Existing Candidate Section */}
                      {candidateType === "existing" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Select Candidate</Label>
                            <Popover open={isCandidateDropdownOpen} onOpenChange={setIsCandidateDropdownOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isCandidateDropdownOpen}
                                  className="w-full justify-between"
                                >
                                  {selectedExistingCandidate 
                                    ? candidates.find(c => c.id === selectedExistingCandidate)?.name
                                    : "Select candidate..."
                                  }
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command shouldFilter={false}>
                                  <CommandInput 
                                    placeholder="Search candidates..." 
                                    value={candidateSearchValue}
                                    onValueChange={setCandidateSearchValue}
                                    className="border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
                                  />
                                  <CommandList>
                                    <CommandGroup>
                                      {candidateSearchValue.trim().length > 0 && filteredCandidates.map((candidate) => (
                                        <CommandItem
                                          key={candidate.id}
                                          value={candidate.name}
                                          onSelect={() => handleCandidateSelect(candidate.id)}
                                        >
                                          <User className="mr-2 h-4 w-4" />
                                          {candidate.name}
                                          {candidate.email && (
                                            <span className="ml-2 text-sm text-muted-foreground">
                                              ({candidate.email})
                                            </span>
                                          )}
                                        </CommandItem>
                                      ))}
                                      {candidateSearchValue.trim().length === 0 && (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                          Start typing to search candidates...
                                        </div>
                                      )}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      )}

                      {/* New Candidate Section */}
                      {candidateType === "new" && (
                        <div className="space-y-4">
                          <div className="space-y-4">
                            <Label>Input Method</Label>
                            <RadioGroup 
                              value={newCandidateMethod} 
                              onValueChange={(value) => setNewCandidateMethod(value as "linkedin" | "pdf")}
                              className="flex space-x-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="linkedin" id="linkedin" />
                                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pdf" id="pdf" />
                                <Label htmlFor="pdf">PDF Resume Upload</Label>
                              </div>
                            </RadioGroup>
                            
                            {/* Input fields below radio buttons */}
                            {newCandidateMethod === "linkedin" && (
                              <Input
                                placeholder="https://linkedin.com/in/candidate-name"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                              />
                            )}
                            
                            {newCandidateMethod === "pdf" && (
                              <div>
                                <Input
                                  type="file"
                                  accept=".pdf"
                                  onChange={handleFileUpload}
                                  className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer cursor-pointer"
                                />
                                {uploadedFile && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Selected: {uploadedFile.name}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Run Analysis Button */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => handleRunAnalysis(analysis.id)}
                          disabled={!canRunAnalysis(analysis.id) || isRunningAnalysis[analysis.id]}
                          className="w-full"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          {isRunningAnalysis[analysis.id] ? "Analyzing candidate..." : "Run Analysis"}
                        </Button>
                      </div>
                    </div>
                  ) : analysis.results ? (
                    // Advanced Results View - Matching sample-match-analysis-report UI
                    <div className="space-y-12">
                      {/* Info Banner for New Candidates */}
                      {analysis.isNew && analysis.candidateInfo.type === "new" && (
                        <div className="info-indicator">
                          <Info className="h-4 w-4 flex-shrink-0" />
                          <span>When you save this analysis, the candidate will also be created in the database.</span>
                        </div>
                      )}
                      
                      {/* Element 1: Combined Section - Overall Match Score + Requirement Analysis */}
                      <div
                        className={`transition-all duration-1000 ${isVisible(analysis.id, "combined-card") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                      >
                        {/* Row Container */}
                        <div className="flex flex-col lg:flex-row gap-8">
                          {/* Element 1: Column Container */}
                          <div className="flex flex-col space-y-6 lg:w-1/2">
                            {/* Element 1.1: Overall Match Score */}
                            <div className="space-y-4">
                              <h2 className="text-2xl font-bold text-left">Overall Match Score</h2>
                              <div className="flex justify-center">
                                <CircularProgress 
                                  value={analysis.results.match_analysis.overall_score} 
                                  status={analysis.results.match_analysis.status} 
                                />
                              </div>
                            </div>

                            {/* Element 1.2: Informative Banner */}
                            <div className={`p-4 rounded-lg border ${getBannerColor(analysis.results.match_analysis.status)}`}>
                              <p className="text-sm font-medium">
                                {analysis.results.candidate.first_name}{analysis.results.candidate.last_name ? ` ${analysis.results.candidate.last_name}` : ""} meets {analysis.results.match_analysis.matched_mandatory_requirements} out of{" "}
                                {analysis.results.match_analysis.total_mandatory_requirements} requirements.
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">{analysis.results.match_analysis.overall_feedback}</p>
                            </div>
                          </div>

                          {/* Element 2: Requirement Analysis */}
                          <div className="flex flex-col space-y-6 lg:w-1/2">
                            <h2 className="text-2xl font-bold">Requirement Analysis</h2>
                            <div className="space-y-6">
                              {analysis.results.requirement_evaluations.map((req, index) => (
                                <div
                                  key={req.job_requirement_id}
                                  className={`space-y-2 transition-all duration-500 ${
                                    index < (visibleProgressBars[analysis.id] || 0) ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                                  }`}
                                  style={{ transitionDelay: `${index * 100}ms` }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{mockRequirementNames[req.job_requirement_id] || req.job_requirement_id}</span>
                                      <button
                                        onClick={() => scrollToRequirement(req.job_requirement_id)}
                                        className="p-1 rounded-sm hover:bg-muted/50 transition-colors opacity-60 hover:opacity-100"
                                        title="View detailed evaluation"
                                      >
                                        <Info className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="relative">
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(req.score)}`}
                                        style={{
                                          width: index < (visibleProgressBars[analysis.id] || 0) ? `${req.score}%` : "0%",
                                          transitionDelay: `${index * 100 + 200}ms`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                      </div>

                      {/* Element 2: Candidate Summary */}
                      <div
                        className={`transition-all duration-1000 ${isVisible(analysis.id, "summary") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                      >
                        <div className="space-y-6">
                          <h2 className="text-2xl font-bold">Candidate Summary</h2>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-[hsl(var(--match-strong-text))]">Strengths</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-3">
                                  {analysis.results.summary.strengths.map((strength, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--match-strong))] mt-2 flex-shrink-0" />
                                      <span className="text-sm leading-relaxed">{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-[hsl(var(--match-missing-text))]">Gaps</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-3">
                                  {analysis.results.summary.gaps.map((gap, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--match-missing))] mt-2 flex-shrink-0" />
                                      <span className="text-sm leading-relaxed">{gap}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>

                      {/* Requirement Evaluations Section */}
                      <div
                        className={`space-y-8 mt-8 transition-all duration-1000 ${isVisible(analysis.id, "requirements-header") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                      >
                        <div>
                          <h2 className="text-2xl font-bold mb-2">Per Requirement Analysis</h2>
                          <p className="text-lg text-muted-foreground">
                            See below for a detailed analysis of each requirement.
                          </p>
                        </div>

                        {/* Requirement Cards - Table-style Layout */}
                          <div className="space-y-4 mt-8">
                            {analysis.results.requirement_evaluations.map((req, index) => (
                              <Card
                                key={req.job_requirement_id}
                                id={`requirement-${req.job_requirement_id}`}
                                className="w-full transition-all duration-500 animate-in slide-in-from-left hover:shadow-md"
                                style={{ animationDelay: `${index * 100}ms` }}
                              >
                                <CardContent className="px-8 py-2">
                                  <div className="flex items-center justify-between">
                                    {/* Left Section - Requirement Name and Score Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-4 mb-3">
                                        <h3 className="text-xl font-semibold">{mockRequirementNames[req.job_requirement_id] || req.job_requirement_id}</h3>
                                        <div className="flex items-center gap-3">
                                          {getStatusBadge(req.score)}
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground leading-relaxed pr-4">{req.feedback}</p>
                                    </div>

                                    {/* Right Section - Circular Progress */}
                                    <div className="flex-shrink-0 ml-6">
                                      <CircularProgress value={req.score} size={80} strokeWidth={6} status={req.status} />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                      </div>


                      {/* Recommendations */}
                      <div
                        className={`space-y-6 mt-8 transition-all duration-1000 ${isVisible(analysis.id, "recommendations") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                      >
                        <div>
                          <h2 className="text-2xl font-bold mb-2">Recruiter Recommendations</h2>
                          <p className="text-lg text-muted-foreground">
                            Here's what to consider next
                          </p>
                        </div>
                          <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-blue-700">Assessment Strategy</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {analysis.results.recruiter_recommendations.interview_strategy.map((item, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                    <span className="text-sm leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-purple-700">Other Options</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {analysis.results.recruiter_recommendations.other_options.map((item, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                                    <span className="text-sm leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                          </div>
                      </div>

                    </div>
                    </div>
                  ) : null}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this match analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
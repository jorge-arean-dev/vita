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
  parseLinkedInProfile,
  fetchJobDataForAnalysis,
  runMatchAnalysis,
  saveCandidate,
  saveMatchAnalysis,
  parseResumeSkills,
  savePDFCandidateWithResume,
  deleteMatchAnalysis,
  type ParsedCandidate
} from "@/app/actions/match-analysis"
import { uploadTemporaryResume } from "@/app/actions/candidates"
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

interface Candidate {
  id: string
  name: string
  email?: string
}

interface RequirementEvaluation {
  requirement_name: string
  score: number
  status: "fit" | "developing" | "weak" | "missing"
  feedback: string
}

interface AnalysisResults {
  match_analysis: {
    overall_score: number
    status: "fit" | "developing" | "weak" | "missing"
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
  metadata: {
    analysis_timestamp: string
    job_id: string
    candidate_id: string
    algorithm_version: string
    total_processing_time_ms: number
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
  progressMessage?: string
  parsedCandidate?: ParsedCandidate // Store the parsed candidate data
  tempFilePath?: string // Store temp file path for PDF candidates
  uploadedFile?: File // Store uploaded file reference
}

// Circular Progress Component
interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  status: "fit" | "developing" | "weak" | "missing"
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

interface ExistingMatchAnalysis {
  id: string
  job_id: string
  candidate_id: string
  match_analysis: {
    overall_score: number
    status: "fit" | "developing" | "weak" | "missing"
    overall_feedback: string
    matched_mandatory_requirements: number
    total_mandatory_requirements: number
  }
  requirement_evaluations: Array<{
    requirement_name: string
    score: number
    status: "fit" | "developing" | "weak" | "missing"
    feedback: string
  }>
  summary: {
    strengths: string[]
    gaps: string[]
  }
  recruiter_recommendations: {
    interview_strategy: string[]
    other_options: string[]
  }
  created_at: string
  updated_at: string
  candidates: {
    id: string
    first_name: string
    last_name: string
    email: string
    linkedin: string
    country: string
  } | null
}

interface CandidateMatchAnalysisProps {
  jobId: string
  existingAnalyses?: ExistingMatchAnalysis[]
}

export default function CandidateMatchAnalysis({ jobId, existingAnalyses = [] }: CandidateMatchAnalysisProps) {
  const [mounted, setMounted] = useState(false)
  const [matchAnalyses, setMatchAnalyses] = useState<MatchAnalysis[]>([])
  const [existingAnalysesState, setExistingAnalysesState] = useState<(ExistingMatchAnalysis & { isExpanded?: boolean; isNew: false })[]>([])
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_visibleSections, setVisibleSections] = useState<{ [key: string]: string[] }>({})
  
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

  // Initialize existing analyses
  useEffect(() => {
    if (mounted && existingAnalyses.length > 0) {
      const analysesWithState = existingAnalyses.map(analysis => ({
        ...analysis,
        isExpanded: false,
        isNew: false as const
      }))
      setExistingAnalysesState(analysesWithState)
    }
  }, [mounted, existingAnalyses])

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
    
    setExistingAnalysesState(prevAnalyses =>
      prevAnalyses.map(analysis =>
        analysis.id === id 
          ? { ...analysis, isExpanded: !analysis.isExpanded }
          : analysis
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
      // Check if it's an existing analysis (from database) or new analysis (local only)
      const isExistingAnalysis = existingAnalysesState.some(analysis => analysis.id === deleteConfirmId)
      
      if (isExistingAnalysis) {
        // Delete from database
        const result = await deleteMatchAnalysis(deleteConfirmId)
        if (!result.success) {
          console.error("Failed to delete match analysis:", result.error)
          toast({
            title: "Error",
            description: "Failed to delete analysis. Please try again.",
            variant: "destructive",
          })
          return
        }
        
        // Remove from existing analyses state
        setExistingAnalysesState(existingAnalysesState.filter(analysis => analysis.id !== deleteConfirmId))
        
        toast({
          title: "Success",
          description: "Analysis deleted successfully.",
        })
      } else {
        // Remove from new analyses state (local only)
        setMatchAnalyses(matchAnalyses.filter((ma) => ma.id !== deleteConfirmId))
        
        toast({
          title: "Success",
          description: "Analysis deleted successfully.",
        })
      }
      
      setDeleteConfirmId(null)
    } catch (error) {
      console.error("Error deleting analysis:", error)
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
  const canRunAnalysis = () => {
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
    if (!canRunAnalysis()) return

    setIsRunningAnalysis({ ...isRunningAnalysis, [analysisId]: true })
    
    // Helper to update progress message
    const updateProgress = (message: string) => {
      setMatchAnalyses(prevAnalyses =>
        prevAnalyses.map(ma => 
          ma.id === analysisId 
            ? { ...ma, progressMessage: message }
            : ma
        )
      )
    }
    
    try {
      let parsedCandidate: ParsedCandidate | null = null
      let candidateName = "Unknown Candidate"
      
      if (candidateType === "new" && newCandidateMethod === "linkedin") {
        // LinkedIn parsing flow
        updateProgress("Reviewing LinkedIn profile...")
        parsedCandidate = await parseLinkedInProfile(linkedinUrl)
        
        candidateName = `${parsedCandidate.main.first_name} ${parsedCandidate.main.last_name}`.trim()
        
        updateProgress("Extracting information...")
        await new Promise(resolve => setTimeout(resolve, 500)) // Brief pause for UX
        
        updateProgress("Analyzing skills and experience...")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        updateProgress("Comparing against job requirements...")
      } else if (candidateType === "existing") {
        // TODO: Implement existing candidate flow
        const existingCandidate = candidates.find(c => c.id === selectedExistingCandidate)
        candidateName = existingCandidate?.name || "Unknown Candidate"
        
        toast({
          title: "Coming soon",
          description: "Existing candidate analysis will be implemented next.",
        })
        return
      } else if (candidateType === "new" && newCandidateMethod === "pdf") {
        // PDF parsing flow
        if (!uploadedFile) {
          throw new Error("No PDF file uploaded")
        }
        
        updateProgress("Uploading your resume...")
        const uploadResult = await uploadTemporaryResume(uploadedFile)
        
        if (!uploadResult.success || !uploadResult.tempUrl) {
          throw new Error(uploadResult.error || "Failed to upload resume")
        }
        
        updateProgress("Analyzing your resume with AI...")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        parsedCandidate = await parseResumeSkills(uploadResult.tempUrl)
        candidateName = `${parsedCandidate.main.first_name} ${parsedCandidate.main.last_name}`.trim()
        
        updateProgress("Extracting skills and experience...")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        updateProgress("Comparing against job requirements...")
        
        // Store temp file path for later use
        setMatchAnalyses(prevAnalyses =>
          prevAnalyses.map(ma => 
            ma.id === analysisId 
              ? { 
                  ...ma, 
                  tempFilePath: uploadResult.tempPath,
                  uploadedFile: uploadedFile
                }
              : ma
          )
        )
      }
      
      // Fetch job data
      const jobData = await fetchJobDataForAnalysis(jobId)
      if (!jobData) {
        throw new Error("Failed to fetch job data")
      }
      
      // Run match analysis
      if (!parsedCandidate) {
        throw new Error("Failed to parse candidate data")
      }
      const analysisResults = await runMatchAnalysis(parsedCandidate, jobData)
      
      // Update the analysis with results
      setMatchAnalyses(prevAnalyses =>
        prevAnalyses.map(ma => 
          ma.id === analysisId 
            ? { 
                ...ma, 
                results: analysisResults,
                parsedCandidate, // Store for later saving
                candidateInfo: {
                  name: candidateName,
                  type: candidateType,
                  source: candidateType === "new" ? newCandidateMethod : undefined
                },
                title: `Match Analysis for ${candidateName}`,
                progressMessage: undefined
              }
            : ma
        )
      )

      // Trigger animations for the new results
      setTimeout(() => {
        triggerAnimationsForAnalysis(analysisId, analysisResults.requirement_evaluations.length)
      }, 100)
    } catch (error) {
      console.error("Error running analysis:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to run analysis"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Clear progress message on error
      updateProgress("")
    } finally {
      setIsRunningAnalysis({ ...isRunningAnalysis, [analysisId]: false })
    }
  }

  // Handle saving analysis
  const handleSaveAnalysis = async (analysisId: string) => {
    console.log("🔄 Starting save analysis...")
    
    const analysis = matchAnalyses.find(ma => ma.id === analysisId)
    
    if (!analysis || !analysis.results || !analysis.parsedCandidate) {
      console.log("❌ Missing required data for save")
      return
    }

    setIsSaving({ ...isSaving, [analysisId]: true })
    
    try {
      let candidateId: string
      
      // Save new candidate if needed
      if (analysis.candidateInfo.type === "new") {
        console.log(`📝 Saving ${analysis.candidateInfo.source} candidate...`)
        if (analysis.candidateInfo.source === "pdf" && analysis.tempFilePath) {
          // PDF candidate - use special function that handles resume moving
          candidateId = await savePDFCandidateWithResume(
            analysis.parsedCandidate,
            analysis.tempFilePath,
            jobId,
            analysis.results
          )
        } else {
          // LinkedIn candidate - use regular save
          candidateId = await saveCandidate(
            analysis.parsedCandidate,
            analysis.candidateInfo.source === "linkedin" ? linkedinUrl : undefined,
            "linkedin"
          )
          // Save the match analysis separately for LinkedIn
          await saveMatchAnalysis(jobId, candidateId, analysis.results)
        }
      } else {
        // For existing candidates, we already have the ID
        candidateId = selectedExistingCandidate
        await saveMatchAnalysis(jobId, candidateId, analysis.results)
      }
      
      console.log("✅ Save operation completed successfully")
      
      // Update the analysis to mark it as saved
      setMatchAnalyses(prevAnalyses =>
        prevAnalyses.map(ma => 
          ma.id === analysisId 
            ? { ...ma, isNew: false, isExpanded: false }
            : ma
        )
      )
      
      const successMessage = analysis.candidateInfo.type === "new" 
        ? analysis.candidateInfo.source === "pdf"
          ? "Candidate created with resume, and match analysis saved successfully."
          : "Candidate created and match analysis saved successfully."
        : "Match analysis saved successfully."
      
      toast({
        title: "Success",
        description: successMessage,
      })
    } catch (error) {
      console.error("Error saving analysis:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save analysis"
      toast({
        title: "Error",
        description: errorMessage,
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
    toast({
      title: "Analysis discarded",
      description: "The match analysis has been discarded.",
    })
  }

  // Trigger animations for analysis results
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const triggerAnimationsForAnalysis = (analysisId: string, _requirementCount: number) => {
    // Reset animation states for this analysis
    setVisibleSections(prev => ({ ...prev, [analysisId]: [] }))

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


    // Show all requirement cards immediately when requirements section appears
    // Note: Currently not animating individual requirement cards
  }


  // Helper functions to access data consistently for both new and existing analyses
  const getAnalysisData = (analysis: MatchAnalysis | ExistingMatchAnalysis) => {
    if ('results' in analysis && analysis.results) {
      // New analysis structure
      return {
        match_analysis: analysis.results.match_analysis,
        requirement_evaluations: analysis.results.requirement_evaluations,
        summary: analysis.results.summary,
        recruiter_recommendations: analysis.results.recruiter_recommendations
      }
    } else {
      // Existing analysis structure
      const existingAnalysis = analysis as ExistingMatchAnalysis
      return {
        match_analysis: existingAnalysis.match_analysis,
        requirement_evaluations: existingAnalysis.requirement_evaluations,
        summary: existingAnalysis.summary,
        recruiter_recommendations: existingAnalysis.recruiter_recommendations
      }
    }
  }

  // Scroll to requirement evaluation card
  const scrollToRequirement = (requirementId: string) => {
    const element = document.getElementById(`requirement-${requirementId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
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
        {/* Empty State */}
        {matchAnalyses.length === 0 && existingAnalysesState.length === 0 ? (
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
          <>
            {/* New Analyses First */}
            {matchAnalyses.map((analysis) => (
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
                      {/* Cancel button for new analyses without results (candidate selection mode) */}
                      {analysis.isExpanded && analysis.isNew && !analysis.results && (
                        <Button 
                          onClick={() => handleDiscardAnalysis(analysis.id)} 
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
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
                            disabled={!canRunAnalysis() || isRunningAnalysis[analysis.id]}
                            className="w-full"
                          >
                            <Sparkles className={`mr-2 h-4 w-4 ${isRunningAnalysis[analysis.id] ? "animate-spin" : ""}`} />
                            {isRunningAnalysis[analysis.id] ? "Analyzing candidate..." : "Run Analysis"}
                          </Button>
                          {/* Progress Message */}
                          {analysis.progressMessage && (
                            <p className="text-sm text-muted-foreground text-center mt-2 animate-pulse">
                              {analysis.progressMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Existing Analyses Second */}
            {existingAnalysesState.map((analysis) => (
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
                      <h3 className="text-lg font-semibold">
                        {analysis.candidates 
                          ? `Match Analysis for ${analysis.candidates.first_name} ${analysis.candidates.last_name}`
                          : "Match Analysis"
                        }
                      </h3>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {!analysis.isExpanded ? (
                        // Collapsed view - only delete button
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
                      ) : (
                        // Expanded view - delete button
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
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Content */}
                {analysis.isExpanded && (
                  <CardContent className="pt-0">
                    {/* Analysis Results Display - Full implementation here */}
                    <div className="space-y-8">
                      {/* Element 1: Combined Section - Overall Match Score + Requirement Analysis */}
                      <div className="transition-all duration-1000 opacity-100 translate-y-0">
                        {/* Row Container */}
                        <div className="flex flex-col lg:flex-row gap-8">
                          {/* Element 1: Column Container */}
                          <div className="flex flex-col space-y-6 lg:w-1/2">
                            {/* Element 1.1: Overall Match Score */}
                            <div className="space-y-4">
                              <h2 className="text-2xl font-bold text-left">Overall Match Score</h2>
                              <div className="flex justify-center">
                                <CircularProgress 
                                  value={getAnalysisData(analysis).match_analysis.overall_score} 
                                  status={getAnalysisData(analysis).match_analysis.status} 
                                />
                              </div>
                            </div>

                            {/* Element 1.2: Informative Banner */}
                            <div className={`p-4 rounded-lg border ${getBannerColor(getAnalysisData(analysis).match_analysis.status)}`}>
                              <p className="text-sm font-medium">
                                {`${analysis.candidates?.first_name || "Unknown"} ${analysis.candidates?.last_name || "Candidate"}`} meets {getAnalysisData(analysis).match_analysis.matched_mandatory_requirements} out of{" "}
                                {getAnalysisData(analysis).match_analysis.total_mandatory_requirements} requirements.
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">{getAnalysisData(analysis).match_analysis.overall_feedback}</p>
                            </div>
                          </div>

                          {/* Element 2: Requirement Analysis */}
                          <div className="flex flex-col space-y-6 lg:w-1/2">
                            <h2 className="text-2xl font-bold">Requirement Analysis</h2>
                            <div className="space-y-6">
                              {getAnalysisData(analysis).requirement_evaluations.map((req) => (
                                <div
                                  key={req.requirement_name}
                                  className="space-y-2 transition-all duration-500 opacity-100 translate-x-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium">{req.requirement_name}</span>
                                      <button
                                        onClick={() => scrollToRequirement(req.requirement_name)}
                                        className="p-1 rounded-sm hover:bg-muted/50 transition-colors opacity-60 hover:opacity-100"
                                        title="View detailed evaluation"
                                      >
                                        <Info className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {getStatusBadge(req.score)}
                                    </div>
                                  </div>
                                  <div className="relative">
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(req.score)}`}
                                        style={{ width: `${req.score}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Element 2: Candidate Summary */}
                      <div className="transition-all duration-1000 opacity-100 translate-y-0">
                        <div className="space-y-6">
                          <h2 className="text-2xl font-bold">Candidate Summary</h2>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-[hsl(var(--match-strong-text))]">Strengths</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-3">
                                  {getAnalysisData(analysis).summary.strengths.map((strength, index) => (
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
                                  {getAnalysisData(analysis).summary.gaps.map((gap, index) => (
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
                      <div className="space-y-8 mt-8 transition-all duration-1000 opacity-100 translate-y-0">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">Per Requirement Analysis</h2>
                          <p className="text-lg text-muted-foreground">
                            See below for a detailed analysis of each requirement.
                          </p>
                        </div>

                        {/* Requirement Cards - Table-style Layout */}
                        <div className="space-y-4 mt-8">
                          {getAnalysisData(analysis).requirement_evaluations.map((req, index) => (
                            <Card
                              key={req.requirement_name}
                              id={`requirement-${req.requirement_name}`}
                              className="w-full transition-all duration-500 animate-in slide-in-from-left hover:shadow-md"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <CardContent className="px-8 py-2">
                                <div className="flex items-center justify-between">
                                  {/* Left Section - Requirement Name and Score Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-4 mb-3">
                                      <h3 className="text-xl font-semibold">{req.requirement_name}</h3>
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
                      <div className="space-y-6 mt-8 transition-all duration-1000 opacity-100 translate-y-0">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">Recruiter Recommendations</h2>
                          <p className="text-lg text-muted-foreground">
                            Here&apos;s what to consider next
                          </p>
                        </div>
                        <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-blue-700">Assessment Strategy</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {getAnalysisData(analysis).recruiter_recommendations.interview_strategy.map((item, index) => (
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
                                {getAnalysisData(analysis).recruiter_recommendations.other_options.map((item, index) => (
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
                  </CardContent>
                )}
              </Card>
            ))}
          </>
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
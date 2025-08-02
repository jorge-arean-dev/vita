"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Sparkles } from "lucide-react"
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
import { deleteMatchAnalysis } from "@/app/actions/match-analysis"

// Import refactored components
import { AnalysisCard } from "./analysis-card"
import { CandidateSelectionForm } from "./candidate-selection-form"
import { AnalysisResultsDisplay } from "./analysis-results-display"
import { useAnimations } from "./hooks/use-animations"
import { useMatchAnalysis } from "./hooks/use-match-analysis"

// Import types
import {
  CandidateMatchAnalysisProps,
  MatchAnalysis,
  ExistingMatchAnalysis,
  Candidate
} from "./types"

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
  
  // Mock candidates data - in real implementation, this would come from API
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" },
    { id: "4", name: "Sarah Wilson", email: "sarah@example.com" },
    { id: "5", name: "David Brown", email: "david@example.com" }
  ]

  // Use custom hooks
  const { triggerAnimationsForAnalysis, cleanupAnimationState } = useAnimations()
  const { 
    isRunningAnalysis, 
    isSaving, 
    canRunAnalysis, 
    handleRunAnalysis, 
    handleSaveAnalysis 
  } = useMatchAnalysis(jobId, candidates)

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

  // Handle discarding analysis
  const handleDiscardAnalysis = (analysisId: string) => {
    setMatchAnalyses(matchAnalyses.filter(ma => ma.id !== analysisId))
    // Clean up animation states
    cleanupAnimationState(analysisId)
    toast({
      title: "Analysis discarded",
      description: "The match analysis has been discarded.",
    })
  }

  // Wrapper functions for hooks
  const runAnalysis = (analysisId: string) => {
    handleRunAnalysis(
      analysisId,
      candidateType,
      selectedExistingCandidate,
      newCandidateMethod,
      linkedinUrl,
      uploadedFile,
      setMatchAnalyses,
      triggerAnimationsForAnalysis
    )
  }

  const saveAnalysis = (analysisId: string) => {
    handleSaveAnalysis(
      analysisId,
      matchAnalyses,
      setMatchAnalyses,
      selectedExistingCandidate,
      linkedinUrl
    )
  }

  const canRun = canRunAnalysis(
    candidateType,
    selectedExistingCandidate,
    newCandidateMethod,
    linkedinUrl,
    uploadedFile
  )

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
              <AnalysisCard
                key={analysis.id}
                id={analysis.id}
                title={analysis.title}
                isExpanded={analysis.isExpanded || false}
                isNew={analysis.isNew}
                hasResults={!!analysis.results}
                isSaving={isSaving[analysis.id]}
                onToggleExpand={handleToggleExpand}
                onDiscard={handleDiscardAnalysis}
                onSave={saveAnalysis}
              >
                {analysis.isNew && !analysis.results ? (
                  // New Analysis - Candidate Selection Panel
                  <CandidateSelectionForm
                    candidateType={candidateType}
                    setCandidateType={setCandidateType}
                    selectedExistingCandidate={selectedExistingCandidate}
                    setSelectedExistingCandidate={setSelectedExistingCandidate}
                    isCandidateDropdownOpen={isCandidateDropdownOpen}
                    setIsCandidateDropdownOpen={setIsCandidateDropdownOpen}
                    candidateSearchValue={candidateSearchValue}
                    setCandidateSearchValue={setCandidateSearchValue}
                    newCandidateMethod={newCandidateMethod}
                    setNewCandidateMethod={setNewCandidateMethod}
                    linkedinUrl={linkedinUrl}
                    setLinkedinUrl={setLinkedinUrl}
                    uploadedFile={uploadedFile}
                    candidates={candidates}
                    onCandidateSelect={handleCandidateSelect}
                    onFileUpload={handleFileUpload}
                    onRunAnalysis={() => runAnalysis(analysis.id)}
                    canRunAnalysis={canRun}
                    isRunningAnalysis={isRunningAnalysis[analysis.id] || false}
                    progressMessage={analysis.progressMessage}
                  />
                ) : analysis.results ? (
                  // Analysis Results Display
                  <AnalysisResultsDisplay
                    analysis={analysis}
                    candidateName={analysis.candidateInfo.name}
                  />
                ) : null}
              </AnalysisCard>
            ))}

            {/* Existing Analyses Second */}
            {existingAnalysesState.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                id={analysis.id}
                title={analysis.candidates 
                  ? `Match Analysis for ${analysis.candidates.first_name} ${analysis.candidates.last_name}`
                  : "Match Analysis"
                }
                isExpanded={analysis.isExpanded || false}
                isNew={false}
                isDeleting={isDeleting[analysis.id]}
                onToggleExpand={handleToggleExpand}
                onDelete={handleDelete}
              >
                <AnalysisResultsDisplay analysis={analysis} />
              </AnalysisCard>
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
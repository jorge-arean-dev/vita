"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, ChevronRight, Plus, Sparkles, Save, X, User, UserPlus, Trash2 } from "lucide-react"
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

interface Candidate {
  id: string
  name: string
  email?: string
}

interface AnalysisResults {
  candidateInfo: {
    name: string
    source?: string
  }
  overallMatch: number
  strengths: string[]
  concerns: string[]
  recommendation: string
  nextSteps: string[]
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

      // Mock analysis results
      const results: AnalysisResults = {
        candidateInfo: {
          name: candidateName,
          source: candidateType === "new" ? newCandidateMethod : undefined
        },
        overallMatch: 85,
        strengths: [
          "Strong technical background in React and TypeScript",
          "5+ years of frontend development experience", 
          "Experience with modern development tools and practices",
          "Good communication skills based on profile"
        ],
        concerns: [
          "Limited experience with specific industry domain",
          "No mention of team leadership experience",
          "Location may require relocation discussion"
        ],
        recommendation: "Strong candidate for interview. Recommend technical screening followed by culture fit assessment.",
        nextSteps: [
          "Schedule initial phone screening",
          "Prepare technical assessment", 
          "Review portfolio/GitHub if available"
        ]
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
                title: `Match Analysis for ${candidateName}`
              }
            : ma
        )
      )
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
    toast({
      title: "Analysis discarded",
      description: "The match analysis has been discarded.",
    })
  }

  // Prevent hydration mismatch - return skeleton instead of null
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Candidate Match Analysis</h2>
              <p className="text-muted-foreground">Upload resumes or LinkedIn profiles to instantly assess how well candidates match your job requirements with AI-powered analysis.</p>
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
                    // Results View
                    <div className="space-y-6">
                      {/* Analysis Results */}
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-semibold mb-2">Overall Match: {analysis.results.overallMatch}%</h4>
                          <p className="text-sm text-muted-foreground">
                            Candidate: {analysis.results.candidateInfo.name}
                          </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h5 className="font-medium text-green-700">Key Strengths</h5>
                            <ul className="space-y-1">
                              {analysis.results.strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                  <span className="text-green-600 mr-2">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium text-amber-700">Areas of Concern</h5>
                            <ul className="space-y-1">
                              {analysis.results.concerns.map((concern: string, idx: number) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                  <span className="text-amber-600 mr-2">•</span>
                                  {concern}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium mb-2">Recommendation</h5>
                          <p className="text-sm text-muted-foreground mb-3">
                            {analysis.results.recommendation}
                          </p>
                          <h6 className="font-medium text-sm mb-1">Next Steps:</h6>
                          <ul className="space-y-1">
                            {analysis.results.nextSteps.map((step: string, idx: number) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                <span className="text-primary mr-2">•</span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Save/Discard Buttons - Only show for new analyses */}
                      {analysis.isNew && (
                        <div className="pt-4 border-t flex justify-end gap-2">
                          <Button 
                            onClick={() => handleDiscardAnalysis(analysis.id)} 
                            variant="outline"
                            disabled={isSaving[analysis.id]}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Discard
                          </Button>
                          <Button 
                            onClick={() => handleSaveAnalysis(analysis.id)}
                            disabled={isSaving[analysis.id]}
                          >
                            {isSaving[analysis.id] ? (
                              <>
                                <Save className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Analysis
                              </>
                            )}
                          </Button>
                        </div>
                      )}
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
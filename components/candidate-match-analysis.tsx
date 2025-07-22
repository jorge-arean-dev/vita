"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sparkles, ChevronDown, User, Save, UserPlus, ArrowLeft } from "lucide-react"
import ToggleSlider from "@/components/ui/toggle-slider"

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

interface CandidateMatchAnalysisProps {
  jobId: string
  jobData?: JobData | null
}

export default function CandidateMatchAnalysis({ jobId }: CandidateMatchAnalysisProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Candidate selection state
  const [candidateType, setCandidateType] = useState<"existing" | "new">("existing")
  const [selectedExistingCandidate, setSelectedExistingCandidate] = useState<string>("")
  const [isCandidateDropdownOpen, setIsCandidateDropdownOpen] = useState(false)
  const [candidateSearchValue, setCandidateSearchValue] = useState("")
  
  // New candidate state
  const [newCandidateMethod, setNewCandidateMethod] = useState<"linkedin" | "pdf">("linkedin")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  
  // Analysis state
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)
  const [hasUnsavedAnalysis, setHasUnsavedAnalysis] = useState(false)

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

  const handleBack = () => {
    router.push(`/protected/jobs/${jobId}`)
  }

  // Filter candidates based on search input
  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(candidateSearchValue.toLowerCase())
  )

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
  const handleRunAnalysis = async () => {
    // Check for unsaved analysis
    if (hasUnsavedAnalysis) {
      const confirmed = window.confirm(
        "You have an unsaved analysis. Running a new analysis will overwrite the current results. Do you want to continue?"
      )
      if (!confirmed) return
    }

    if (!canRunAnalysis()) return

    setIsRunningAnalysis(true)
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
      
      // Mock analysis results
      const existingCandidate = candidateType === "existing" 
        ? candidates.find(c => c.id === selectedExistingCandidate)
        : null

      setAnalysisResults({
        candidateInfo: candidateType === "existing" 
          ? { name: existingCandidate?.name || "Unknown Candidate", source: undefined }
          : { name: "New Candidate", source: newCandidateMethod },
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
      })
      setHasUnsavedAnalysis(true)
    } catch (error) {
      console.error("Error running analysis:", error)
    } finally {
      setIsRunningAnalysis(false)
    }
  }

  // Handle saving evaluation
  const handleSaveEvaluation = () => {
    console.log("Saving evaluation:", analysisResults)
    // TODO: Implement save logic
    setHasUnsavedAnalysis(false)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Candidate Panel */}
      <Card>
          <CardHeader>
            {/* Tool Header with responsive layout */}
            <div className="space-y-4">
              {/* Title and Back button - Option A layout */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Candidate Match Analysis</h2>
                <Button variant="outline" size="sm" onClick={handleBack} className="gap-2 sm:mt-0">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Tools
                </Button>
              </div>
              
              {/* Subtitle spans full width */}
              <p className="text-muted-foreground">Upload resumes or LinkedIn profiles to instantly assess how well candidates match your job requirements with AI-powered analysis.</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Candidate Type Selection */}
              <div className="flex justify-center">
                <ToggleSlider
                  option1="Existing Candidate"
                  option2="New Candidate"
                  icon1={<User className="h-4 w-4" />}
                  icon2={<UserPlus className="h-4 w-4" />}
                  defaultOption={candidateType === "existing" ? 1 : 2}
                  onChange={(option) => setCandidateType(option === 1 ? "existing" : "new")}
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
                  onClick={handleRunAnalysis}
                  disabled={!canRunAnalysis() || isRunningAnalysis}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isRunningAnalysis ? "Analyzing candidate..." : "Run Analysis"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {(isRunningAnalysis || analysisResults) && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              <p className="text-sm text-muted-foreground">
                {isRunningAnalysis 
                  ? "Analyzing candidate profile and matching against job requirements..." 
                  : "Candidate match analysis completed"
                }
              </p>
            </CardHeader>
            <CardContent>
              {isRunningAnalysis ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <Sparkles className="h-8 w-8 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Running analysis...
                    </p>
                  </div>
                </div>
              ) : analysisResults ? (
                <div className="space-y-6">
                  {/* Analysis Results */}
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Overall Match: {analysisResults.overallMatch}%</h4>
                      <p className="text-sm text-muted-foreground">
                        Candidate: {analysisResults.candidateInfo.name}
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-green-700">Key Strengths</h5>
                        <ul className="space-y-1">
                          {analysisResults.strengths.map((strength: string, idx: number) => (
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
                          {analysisResults.concerns.map((concern: string, idx: number) => (
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
                        {analysisResults.recommendation}
                      </p>
                      <h6 className="font-medium text-sm mb-1">Next Steps:</h6>
                      <ul className="space-y-1">
                        {analysisResults.nextSteps.map((step: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start">
                            <span className="text-primary mr-2">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Save Button */}
                  {hasUnsavedAnalysis && (
                    <div className="pt-4 border-t">
                      <Button onClick={handleSaveEvaluation} className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Save Evaluation
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
    </div>
  )
}
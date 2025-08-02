import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  parseLinkedInProfile,
  fetchJobDataForAnalysis,
  runMatchAnalysis,
  saveCandidate,
  saveMatchAnalysis,
  parseResumeSkills,
  savePDFCandidateWithResume,
  fetchCandidateForAnalysis,
  type ParsedCandidate
} from "@/app/actions/match-analysis"
import { uploadTemporaryResume } from "@/app/actions/candidates"
import { MatchAnalysis, Candidate } from "../types"

export function useMatchAnalysis(
  jobId: string, 
  candidates: Candidate[],
  onAnalysisSaved?: (analysisId: string) => Promise<void>
) {
  const [isRunningAnalysis, setIsRunningAnalysis] = useState<{ [key: string]: boolean }>({})
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})
  const { toast } = useToast()

  // Check if we can run analysis
  const canRunAnalysis = (
    candidateType: "existing" | "new",
    selectedExistingCandidate: string,
    newCandidateMethod: "linkedin" | "pdf",
    linkedinUrl: string,
    uploadedFile: File | null
  ) => {
    if (candidateType === "existing") {
      return selectedExistingCandidate !== ""
    } else {
      return newCandidateMethod === "linkedin" ? linkedinUrl.trim() !== "" : uploadedFile !== null
    }
  }

  // Handle running analysis
  const handleRunAnalysis = async (
    analysisId: string,
    candidateType: "existing" | "new",
    selectedExistingCandidate: string,
    newCandidateMethod: "linkedin" | "pdf",
    linkedinUrl: string,
    uploadedFile: File | null,
    setMatchAnalyses: React.Dispatch<React.SetStateAction<MatchAnalysis[]>>,
    triggerAnimationsForAnalysis: (analysisId: string, requirementCount: number) => void
  ) => {
    if (!canRunAnalysis(candidateType, selectedExistingCandidate, newCandidateMethod, linkedinUrl, uploadedFile)) return

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
        // Existing candidate flow
        const existingCandidate = candidates.find(c => c.id === selectedExistingCandidate)
        candidateName = existingCandidate?.name || "Unknown Candidate"
        
        updateProgress("Fetching candidate data...")
        parsedCandidate = await fetchCandidateForAnalysis(selectedExistingCandidate)
        
        updateProgress("Analyzing skills and experience...")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        updateProgress("Comparing against job requirements...")
        await new Promise(resolve => setTimeout(resolve, 500))
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
  const handleSaveAnalysis = async (
    analysisId: string,
    matchAnalyses: MatchAnalysis[],
    setMatchAnalyses: React.Dispatch<React.SetStateAction<MatchAnalysis[]>>,
    selectedExistingCandidate: string,
    linkedinUrl: string
  ) => {
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
      
      const successMessage = analysis.candidateInfo.type === "new" 
        ? analysis.candidateInfo.source === "pdf"
          ? "Candidate created with resume, and match analysis saved successfully."
          : "Candidate created and match analysis saved successfully."
        : "Match analysis saved successfully."
      
      toast({
        title: "Success",
        description: successMessage,
      })

      // Call the callback to handle post-save logic (e.g., reload analyses)
      if (onAnalysisSaved) {
        await onAnalysisSaved(analysisId)
      }
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

  return {
    isRunningAnalysis,
    isSaving,
    canRunAnalysis,
    handleRunAnalysis,
    handleSaveAnalysis
  }
}
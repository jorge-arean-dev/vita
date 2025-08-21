import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  fetchJobDataForAnalysis,
  runMatchAnalysis,
  analyzeLinkedInCandidateSimplifiedEnhanced,
  analyzePDFCandidate,
  saveMatchAnalysis,
  type ParsedCandidate
} from "@/app/actions/match-analysis"
import { runEnhancedMatchAnalysis, saveNewCandidateWithRawData } from "@/app/actions/enhanced-match-analysis"
import { cleanupTempResumeFile } from "@/app/actions/temp-file-cleanup"
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
        // Simplified Enhanced LinkedIn analysis flow (v3)
        updateProgress("🔍 Scraping LinkedIn profile...")
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress("🔄 Processing profile data...")
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress("🧠 Extracting skills with AI...")
        await new Promise(resolve => setTimeout(resolve, 400))
        
        updateProgress("⚡ Running embedding-based skill matching...")
        await new Promise(resolve => setTimeout(resolve, 400))
        
        updateProgress("📊 Generating enhanced analysis...")
        
        // Use simplified enhanced analysis flow (v3) - now direct without reducer
        const enhancedResult = await analyzeLinkedInCandidateSimplifiedEnhanced(linkedinUrl, jobId, false)
        parsedCandidate = enhancedResult.candidate
        candidateName = `${parsedCandidate.main.first_name} ${parsedCandidate.main.last_name}`.trim()
        
        // Store the enhanced analysis results and raw profile
        setMatchAnalyses(prevAnalyses =>
          prevAnalyses.map(ma => 
            ma.id === analysisId 
              ? { 
                  ...ma, 
                  results: enhancedResult.analysis,
                  parsedCandidate: parsedCandidate || undefined,
                  rawProfile: enhancedResult.rawProfile, // Store for saving
                  candidateInfo: {
                    name: candidateName,
                    type: candidateType,
                    source: newCandidateMethod
                  },
                  title: `Enhanced Match Analysis for ${candidateName}`,
                  progressMessage: undefined
                }
              : ma
          )
        )

        // Trigger animations for the enhanced results
        setTimeout(() => {
          triggerAnimationsForAnalysis(analysisId, enhancedResult.analysis.requirement_evaluations.length)
        }, 100)
        
        // Early return since we've already set the results
        setIsRunningAnalysis({ ...isRunningAnalysis, [analysisId]: false })
        return
      } else if (candidateType === "existing") {
        // Enhanced existing candidate flow - uses smart routing
        const existingCandidate = candidates.find(c => c.id === selectedExistingCandidate)
        candidateName = existingCandidate?.name || "Unknown Candidate"
        
        updateProgress("🔍 Checking for enhanced data sources...")
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress("⚡ Running enhanced match analysis...")
        await new Promise(resolve => setTimeout(resolve, 400))
        
        updateProgress("📊 Generating analysis results...")
        
        // Use enhanced match analysis with smart routing
        const enhancedResult = await runEnhancedMatchAnalysis(selectedExistingCandidate, jobId)
        
        if (!enhancedResult.success || !enhancedResult.data) {
          throw new Error(enhancedResult.error || "Enhanced analysis failed")
        }
        
        // Store the enhanced analysis results
        setMatchAnalyses(prevAnalyses =>
          prevAnalyses.map(ma => 
            ma.id === analysisId 
              ? { 
                  ...ma, 
                  results: enhancedResult.data!,
                  candidateInfo: {
                    name: candidateName,
                    type: candidateType
                  },
                  title: `Enhanced Match Analysis for ${candidateName}`,
                  progressMessage: undefined,
                  analysisStrategy: enhancedResult.data?.analysisMetadata?.strategy,
                  rawDataSources: enhancedResult.data?.analysisMetadata?.rawDataSources
                }
              : ma
          )
        )

        // Trigger animations for the enhanced results
        setTimeout(() => {
          triggerAnimationsForAnalysis(analysisId, enhancedResult.data?.requirement_evaluations.length || 0)
        }, 100)
        
        // Early return since we've already set the results
        setIsRunningAnalysis({ ...isRunningAnalysis, [analysisId]: false })
        return
      } else if (candidateType === "new" && newCandidateMethod === "pdf") {
        // Enhanced PDF analysis flow
        if (!uploadedFile) {
          throw new Error("No PDF file uploaded")
        }
        
        updateProgress("📤 Uploading your resume...")
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress("🧠 Analyzing resume with AI...")
        await new Promise(resolve => setTimeout(resolve, 500))
        
        updateProgress("⚡ Running enhanced PDF match analysis...")
        await new Promise(resolve => setTimeout(resolve, 400))
        
        updateProgress("📊 Generating analysis results...")
        
        // Use enhanced PDF analysis flow
        const pdfResult = await analyzePDFCandidate(uploadedFile, jobId, false)
        parsedCandidate = pdfResult.candidate
        candidateName = `${parsedCandidate.main.first_name} ${parsedCandidate.main.last_name}`.trim()
        
        // Store the enhanced PDF analysis results and temp file info
        setMatchAnalyses(prevAnalyses =>
          prevAnalyses.map(ma => 
            ma.id === analysisId 
              ? { 
                  ...ma, 
                  results: pdfResult.analysis,
                  parsedCandidate: parsedCandidate || undefined,
                  tempFilePath: pdfResult.tempFilePath,
                  uploadedFile: uploadedFile,
                  rawProfile: pdfResult.rawPdfText, // Store raw PDF text
                  candidateInfo: {
                    name: candidateName,
                    type: candidateType,
                    source: newCandidateMethod
                  },
                  title: `Enhanced PDF Match Analysis for ${candidateName}`,
                  progressMessage: undefined,
                  needsCleanup: true // Mark for cleanup since temp file was created
                }
              : ma
          )
        )

        // Trigger animations for the enhanced results
        setTimeout(() => {
          triggerAnimationsForAnalysis(analysisId, pdfResult.analysis.requirement_evaluations.length)
        }, 100)
        
        // Early return since we've already set the results
        setIsRunningAnalysis({ ...isRunningAnalysis, [analysisId]: false })
        return
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
                parsedCandidate: parsedCandidate || undefined, // Store for later saving
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
      const errorMessage = error instanceof Error ? error.message : "Failed to run analysis"
      
      // Clean up temp files if analysis failed and we have them
      setMatchAnalyses(prevAnalyses => {
        const analysis = prevAnalyses.find(ma => ma.id === analysisId)
        if (analysis?.tempFilePath && analysis?.needsCleanup) {
          cleanupTempResumeFile(analysis.tempFilePath)
            .then(() => console.log('Cleaned up temp file after analysis error'))
            .catch(cleanupError => console.error('Failed to cleanup temp file after analysis error:', cleanupError))
        }
        return prevAnalyses // Return unchanged state
      })
      
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
    const analysis = matchAnalyses.find(ma => ma.id === analysisId)
    
    console.log('=== SAVE ANALYSIS START ===')
    console.log('analysisId:', analysisId)
    console.log('analysis found:', !!analysis)
    console.log('analysis.results:', !!analysis?.results)
    console.log('analysis.parsedCandidate:', !!analysis?.parsedCandidate)
    console.log('analysis.candidateInfo:', analysis?.candidateInfo)
    
    if (!analysis || !analysis.results) {
      console.error('Missing analysis or results')
      return
    }
    
    if (!analysis.parsedCandidate && analysis.candidateInfo.type === "new") {
      console.error('Missing parsedCandidate for new candidate')
      console.error('Attempting to extract from analysis results...')
      
      // Try to extract candidate data from analysis results if available
      if (analysis.results?.metadata?.candidate_id) {
        console.log('Found candidate_id in metadata, might be already saved')
        toast({
          title: "Error", 
          description: "Cannot re-save candidate: data structure mismatch",
          variant: "destructive",
        })
        return
      }
      
      toast({
        title: "Error",
        description: "Cannot save new candidate: missing candidate data from analysis",
        variant: "destructive",
      })
      return
    }

    setIsSaving({ ...isSaving, [analysisId]: true })
    
    try {
      let candidateId: string
      
      // Save new candidate if needed
      if (analysis.candidateInfo.type === "new") {
        // Use enhanced save function that captures raw data
        const candidateData = {
          firstName: analysis.parsedCandidate!.main.first_name,
          lastName: analysis.parsedCandidate!.main.last_name,
          email: analysis.parsedCandidate!.main.email,
          yearsOfExperience: analysis.parsedCandidate!.years_of_experience,
          country: analysis.parsedCandidate!.main.country
        }

        const skills = analysis.parsedCandidate!.skills.map(skill => ({
          name: skill.name,
          type: skill.type,
          yearsOfExperience: skill.yoe || undefined,
          proficiencyLevel: skill.proficiency_level || undefined
        }))

        const rawData = {
          linkedInProfile: analysis.candidateInfo.source === "linkedin" && analysis.rawProfile 
            ? analysis.rawProfile as Record<string, unknown>
            : undefined,
          linkedInUrl: analysis.candidateInfo.source === "linkedin" ? linkedinUrl : undefined,
          resumeText: analysis.candidateInfo.source === "pdf" && typeof analysis.rawProfile === "string"
            ? analysis.rawProfile
            : undefined,
          resumeUrl: analysis.tempFilePath || undefined,
          tempFilePath: analysis.tempFilePath || undefined, // For moving temp file to permanent location
          fileName: analysis.uploadedFile?.name,
          fileSize: analysis.uploadedFile?.size
        }


        
        let saveResult
        try {
          saveResult = await saveNewCandidateWithRawData(candidateData, skills, rawData, analysis.candidateInfo.source as "linkedin" | "pdf")
        } catch (serverActionError) {
          console.error('Server action threw error:', serverActionError)
          throw new Error(`Server action failed: ${serverActionError instanceof Error ? serverActionError.message : 'Unknown server error'}`)
        }
        
        if (!saveResult) {
          throw new Error("Save function returned no result")
        }
        
        if (!saveResult.success) {
          throw new Error(saveResult.error || "Save operation failed")
        }
        
        if (!saveResult.candidateId) {
          throw new Error("Save succeeded but no candidate ID returned")
        }
        
        candidateId = saveResult.candidateId
        
        // Save the match analysis
        await saveMatchAnalysis(jobId, candidateId, analysis.results)
      } else {
        // For existing candidates, we already have the ID
        candidateId = selectedExistingCandidate
        await saveMatchAnalysis(jobId, candidateId, analysis.results)
      }
      
      const successMessage = analysis.candidateInfo.type === "new" 
        ? analysis.candidateInfo.source === "pdf"
          ? "Candidate created with enhanced resume data and match analysis saved successfully."
          : "Candidate created with enhanced LinkedIn data and match analysis saved successfully."
        : "Enhanced match analysis saved successfully."
      
      toast({
        title: "Success",
        description: successMessage,
      })

      // Note: Temp file cleanup is handled automatically by moveTempResumeToCandidate for PDF files

      // Call the callback to handle post-save logic (e.g., reload analyses)
      if (onAnalysisSaved) {
        await onAnalysisSaved(analysisId)
      }
    } catch (error) {
      console.error('=== SAVE ANALYSIS ERROR (CLIENT SIDE) ===')
      console.error('Error details:', error)
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('=== END CLIENT ERROR LOG ===')
      
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
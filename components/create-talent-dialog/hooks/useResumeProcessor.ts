import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { uploadTemporaryResume } from "@/app/actions/candidates"
import type { CandidateFormData, ParsedSkill } from "../types"

interface UseResumeProcessorReturn {
  processResume: (file: File) => Promise<{
    success: boolean
    formData?: Partial<CandidateFormData>
    skills?: ParsedSkill[]
    tempFilePath?: string
  }>
  isProcessing: boolean
  uploadProgress: string
  parsingProgress: string
}

export function useResumeProcessor(): UseResumeProcessorReturn {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [parsingProgress, setParsingProgress] = useState("")

  const processResume = async (file: File) => {
    setIsProcessing(true)
    
    try {
      // Step 1: Upload file to temporary location
      console.log("Starting PDF upload...")
      setUploadProgress("Uploading your resume...")
      const uploadResult = await uploadTemporaryResume(file)
      
      console.log("Upload result:", uploadResult)
      if (!uploadResult.success) {
        console.error("Upload failed:", uploadResult.error)
        toast({
          title: "Error",
          description: uploadResult.error || "Failed to upload file",
          variant: "destructive",
        })
        return { success: false }
      }
      
      const tempFilePath = uploadResult.tempPath!
      setUploadProgress("Upload complete!")
      console.log("Upload complete, starting parsing...")
      
      // Step 2: Parse the resume
      setParsingProgress("Analyzing your resume with AI...")
      console.log("Making API call to parse resume with URL:", uploadResult.tempUrl)
      
      const parseResponse = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdf_url: uploadResult.tempUrl })
      })
      
      console.log("Parse response status:", parseResponse.status)
      const parseData = await parseResponse.json()
      console.log("Parse response data:", parseData)
      
      if (!parseResponse.ok) {
        console.error("Parse failed:", parseData.error)
        toast({
          title: "Error",
          description: parseData.error || "Failed to parse resume",
          variant: "destructive",
        })
        return { success: false }
      }
      
      setParsingProgress("Analysis complete!")
      console.log("Parsing complete, returning data...")
      
      // Step 3: Format the data
      const formData: Partial<CandidateFormData> = {
        firstName: parseData.main?.first_name || "",
        lastName: parseData.main?.last_name || "",
        email: parseData.main?.email || "",
        country: parseData.main?.country || "",
        linkedin: parseData.main?.linkedin || "",
        github: parseData.main?.github || "",
        yearsExperience: parseData.years_of_experience ? parseData.years_of_experience.toString() : ""
      }
      
      // Store parsed skills with resume source
      const resumeSkills = (parseData.skills || []).map((skill: ParsedSkill) => ({
        name: skill.name,
        type: skill.type,
        yoe: skill.yoe,
        proficiency_level: skill.proficiency_level,
        source: 'resume'
      }))
      
      toast({
        title: "Success",
        description: "Resume data extracted successfully!",
      })
      
      return {
        success: true,
        formData,
        skills: resumeSkills,
        tempFilePath
      }
    } catch (error) {
      console.error("Error processing resume:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false }
    } finally {
      setIsProcessing(false)
      setUploadProgress("")
      setParsingProgress("")
    }
  }

  return {
    processResume,
    isProcessing,
    uploadProgress,
    parsingProgress
  }
}
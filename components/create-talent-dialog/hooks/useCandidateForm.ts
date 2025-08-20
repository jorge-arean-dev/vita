import { useState, useTransition } from "react"
import { useToast } from "@/components/ui/use-toast"
import { 
  createCandidate, 
  moveTempResumeToCandidate, 
  insertCandidateSkills, 
  updateCandidateResumeUrl,
  cleanupTempResume,
  searchCountries,
  CandidateData 
} from "@/app/actions/candidates"
import { 
  storeLinkedInRawDataAction, 
  storeResumeRawDataAction 
} from "@/app/actions/raw-data"
import type { CandidateFormData, ParsedSkill, Country } from "../types"
import type { LinkedInProfile } from "@/types/linkedin.types"

interface UseCandidateFormReturn {
  formData: CandidateFormData
  setFormData: React.Dispatch<React.SetStateAction<CandidateFormData>>
  parsedSkills: ParsedSkill[]
  setParsedSkills: React.Dispatch<React.SetStateAction<ParsedSkill[]>>
  tempFilePath: string
  setTempFilePath: React.Dispatch<React.SetStateAction<string>>
  isDirty: boolean
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>
  isPending: boolean
  
  // Country search
  countries: Country[]
  countrySearchValue: string
  setCountrySearchValue: React.Dispatch<React.SetStateAction<string>>
  handleSearchCountries: (searchTerm: string) => Promise<void>
  handleCountrySelect: (countryCode: string, countryName: string) => void
  
  // Form actions
  handleSubmit: (onSuccess?: (candidate: CandidateData) => void, rawData?: { linkedInProfile?: LinkedInProfile, resumeText?: string, linkedinUrl?: string, resumeUrl?: string, fileName?: string, fileSize?: number }) => void
  resetForm: () => void
  updateFormWithCountry: (countryCode: string) => Promise<void>
  cleanupTempFile: (tempFilePath: string) => Promise<void>
}

const initialFormData: CandidateFormData = {
  firstName: "",
  lastName: "",
  email: "",
  country: "",
  linkedin: "",
  github: "",
  yearsExperience: ""
}

export function useCandidateForm(): UseCandidateFormReturn {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  // Form state
  const [formData, setFormData] = useState<CandidateFormData>(initialFormData)
  const [parsedSkills, setParsedSkills] = useState<ParsedSkill[]>([])
  const [tempFilePath, setTempFilePath] = useState("")
  const [isDirty, setIsDirty] = useState(false)
  
  // Country search state
  const [countries, setCountries] = useState<Country[]>([])
  const [countrySearchValue, setCountrySearchValue] = useState("")

  const resetForm = () => {
    setFormData(initialFormData)
    setParsedSkills([])
    setTempFilePath("")
    setIsDirty(false)
    setCountries([])
    setCountrySearchValue("")
  }

  const handleSearchCountries = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCountries([])
      return
    }

    try {
      const results = await searchCountries(searchTerm)
      setCountries(results)
    } catch (error) {
      console.error("Error searching countries:", error)
      setCountries([])
    }
  }

  const handleCountrySelect = (countryCode: string, countryName: string) => {
    setFormData(prev => ({ ...prev, country: countryCode }))
    setCountrySearchValue(countryName)
    setIsDirty(true)
  }

  const updateFormWithCountry = async (countryCode: string) => {
    if (!countryCode) return
    
    try {
      const countryResults = await searchCountries(countryCode)
      if (countryResults.length > 0) {
        const exactMatch = countryResults.find(c => c.iso_code === countryCode)
        if (exactMatch) {
          setCountrySearchValue(exactMatch.display_name)
        }
      }
    } catch (error) {
      console.error("Error fetching country display name:", error)
    }
  }

  const handleSubmit = (onSuccess?: (candidate: CandidateData) => void, rawData?: { linkedInProfile?: LinkedInProfile, resumeText?: string, linkedinUrl?: string, resumeUrl?: string, fileName?: string, fileSize?: number }) => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name is required",
        variant: "destructive",
      })
      return
    }
    
    if (!formData.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Last name is required",
        variant: "destructive",
      })
      return
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      })
      return
    }
    
    if (!formData.country) {
      toast({
        title: "Validation Error",
        description: "Country is required",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        // Step 1: Create the candidate
        const result = await createCandidate({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          country: formData.country || undefined,
          linkedin: formData.linkedin || undefined,
          github: formData.github || undefined,
          yearsExperience: formData.yearsExperience ? parseFloat(formData.yearsExperience) : undefined
        })
        
        if (!result.success) {
          toast({
            title: "Error",
            description: result.error || "Failed to create candidate",
            variant: "destructive",
          })
          return
        }

        const candidateId = result.candidateId
        const createdCandidate = result.candidate
        
        if (!candidateId || !createdCandidate) {
          toast({
            title: "Error",
            description: "Failed to get candidate data",
            variant: "destructive",
          })
          return
        }

        // Step 2: Store LinkedIn raw data if available
        if (rawData?.linkedInProfile) {
          const linkedInResult = await storeLinkedInRawDataAction(
            candidateId, 
            rawData.linkedInProfile, 
            rawData.linkedinUrl
          )
          if (!linkedInResult.success) {
            console.error("Failed to store LinkedIn raw data:", linkedInResult.error)
          } else {
            console.log("LinkedIn raw data stored successfully")
          }
        }

        // Step 3: Move temporary file to final location (if we have one)
        let finalResumeUrl = null
        if (tempFilePath) {
          const moveResult = await moveTempResumeToCandidate(tempFilePath, candidateId)
          if (!moveResult.success) {
            console.error("Failed to move resume file:", moveResult.error)
            toast({
              title: "Warning",
              description: "Failed to move resume file, but candidate was created",
              variant: "destructive",
            })
          } else if (moveResult.finalUrl) {
            finalResumeUrl = moveResult.finalUrl
            // Step 3a: Update candidate with resume URL
            const updateResult = await updateCandidateResumeUrl(candidateId, moveResult.finalUrl)
            if (!updateResult.success) {
              console.error("Failed to update resume URL:", updateResult.error)
              toast({
                title: "Warning",
                description: "Resume uploaded but URL not saved to candidate",
                variant: "destructive",
              })
            }
          }
        }
        
        // Step 4: Store resume raw data with permanent URL (after file move)
        if (rawData?.resumeText && rawData.resumeText.trim()) {
          const resumeResult = await storeResumeRawDataAction(
            candidateId, 
            rawData.resumeText,
            {
              url: finalResumeUrl || rawData.resumeUrl, // Use permanent URL if available
              fileName: rawData.fileName,
              fileSize: rawData.fileSize
            }
          )
          if (!resumeResult.success) {
            console.error("Failed to store resume raw data:", resumeResult.error)
          } else {
            console.log("Resume raw data stored successfully with permanent URL")
          }
        }

        // Step 5: Insert skills (if we have any)
        if (parsedSkills.length > 0) {
          const skillsResult = await insertCandidateSkills(candidateId, parsedSkills)
          if (!skillsResult.success) {
            console.error("Failed to insert skills:", skillsResult.error)
            // Don't fail the entire process, just log the error
          }
        }

        toast({
          title: "Success",
          description: "Candidate created successfully!",
        })
        resetForm()
        onSuccess?.(createdCandidate)
      } catch (error) {
        console.error("Error creating candidate:", error)
        toast({
          title: "Error",
          description: "Failed to create candidate",
          variant: "destructive",
        })
      }
    })
  }

  const cleanupTempFile = async (tempFilePath: string) => {
    if (!tempFilePath) return
    
    try {
      const result = await cleanupTempResume(tempFilePath)
      if (!result.success) {
        console.error("Failed to cleanup temp file:", result.error)
      } else {
        console.log("Temporary file cleaned up successfully")
      }
    } catch (error) {
      console.error("Error cleaning up temp file:", error)
    }
  }

  return {
    formData,
    setFormData,
    parsedSkills,
    setParsedSkills,
    tempFilePath,
    setTempFilePath,
    isDirty,
    setIsDirty,
    isPending,
    countries,
    countrySearchValue,
    setCountrySearchValue,
    handleSearchCountries,
    handleCountrySelect,
    handleSubmit,
    resetForm,
    updateFormWithCountry,
    cleanupTempFile
  }
}
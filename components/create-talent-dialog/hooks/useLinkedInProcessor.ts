import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { CandidateFormData, ParsedSkill } from "../types"
import type { LinkedInProfile } from "@/types/linkedin.types"

interface UseLinkedInProcessorReturn {
  processLinkedIn: (linkedinUrl: string) => Promise<{
    success: boolean
    formData?: Partial<CandidateFormData>
    skills?: ParsedSkill[]
    rawLinkedInProfile?: LinkedInProfile // Store the raw scraped LinkedIn profile
  }>
  isProcessing: boolean
  linkedinProgress: string
}

export function useLinkedInProcessor(): UseLinkedInProcessorReturn {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [linkedinProgress, setLinkedinProgress] = useState("")

  const processLinkedIn = async (linkedinUrl: string) => {
    setIsProcessing(true)
    
    try {
      // Step 1: Scrape LinkedIn profile
      setLinkedinProgress("Scraping LinkedIn profile...")
      console.log("Step 1: Calling apify-linkedin-scraper...")
      
      const scrapeResponse = await fetch(`https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items?token=apify_api_93zdEJsXGrvPFQdzh2as637W3Za2VE0C3Bi2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileUrls: [linkedinUrl]
        })
      })
      
      console.log("Scrape response status:", scrapeResponse.status)
      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json()
        console.error("Scrape failed:", errorData)
        if (scrapeResponse.status === 401) {
          throw new Error("LinkedIn scraper authentication failed")
        }
        if (scrapeResponse.status === 429) {
          throw new Error("Too many requests. Please try again later.")
        }
        throw new Error("Failed to scrape LinkedIn profile. Please check the URL and try again.")
      }
      
      const scrapedData = await scrapeResponse.json()
      console.log("Scrape response data:", scrapedData)
      
      if (!scrapedData || !Array.isArray(scrapedData) || scrapedData.length === 0) {
        throw new Error("No profile data found. The LinkedIn profile may be private or the URL is incorrect.")
      }
      
      const profileData = scrapedData[0]
      setLinkedinProgress("Profile scraped successfully!")
      
      // Step 2: Parse skills and extract structured data directly from raw profile
      setLinkedinProgress("Analyzing profile with AI...")
      console.log("Step 2: Calling parse-linkedin-skill with raw profile data...")
      
      const parseResponse = await fetch('https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/parse-linkedin-skill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(profileData)
      })
      
      console.log("Parse response status:", parseResponse.status)
      if (!parseResponse.ok) {
        const errorData = await parseResponse.json()
        console.error("Parse failed:", errorData)
        if (parseResponse.status === 400) {
          throw new Error("Profile missing required information (name or experience). Please try a different profile.")
        }
        if (parseResponse.status === 500 && errorData.error?.includes('OpenAI')) {
          throw new Error("AI analysis service is temporarily unavailable. Please try again later.")
        }
        throw new Error("Failed to analyze profile with AI. Please try again.")
      }
      
      const parsedData = await parseResponse.json()
      console.log("Parse response data:", parsedData)
      
      // Validate the parsed data has required fields
      if (!parsedData.main || (!parsedData.main.first_name && !parsedData.main.last_name)) {
        throw new Error("Could not extract name from LinkedIn profile. Please check the profile URL.")
      }
      
      setLinkedinProgress("Profile analysis complete!")
      
      // Step 3: Format the data
      const formData: Partial<CandidateFormData> = {
        firstName: parsedData.main?.first_name || "",
        lastName: parsedData.main?.last_name || "",
        email: parsedData.main?.email || "",
        country: parsedData.main?.country || "",
        linkedin: parsedData.main?.linkedin || linkedinUrl,
        github: parsedData.main?.github || "",
        yearsExperience: parsedData.years_of_experience ? parsedData.years_of_experience.toString() : ""
      }
      
      // Store parsed skills with linkedin source
      const linkedinSkills = (parsedData.skills || []).map((skill: ParsedSkill) => ({
        name: skill.name,
        type: skill.type,
        yoe: skill.yoe,
        proficiency_level: skill.proficiency_level,
        source: 'linkedin'
      }))
      
      toast({
        title: "Success",
        description: "LinkedIn profile analyzed successfully!",
      })
      
      return {
        success: true,
        formData,
        skills: linkedinSkills,
        rawLinkedInProfile: profileData // Include the raw scraped profile
      }
    } catch (error) {
      console.error("Error processing LinkedIn:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false }
    } finally {
      setIsProcessing(false)
      setLinkedinProgress("")
    }
  }

  return {
    processLinkedIn,
    isProcessing,
    linkedinProgress
  }
}
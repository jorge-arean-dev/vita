import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { CandidateFormData, ParsedSkill } from "../types"

interface UseLinkedInProcessorReturn {
  processLinkedIn: (linkedinUrl: string) => Promise<{
    success: boolean
    formData?: Partial<CandidateFormData>
    skills?: ParsedSkill[]
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
      
      // Step 2: Reduce/format the profile data
      setLinkedinProgress("Formatting profile data...")
      console.log("Step 2: Calling linkedin-profile-reducer...")
      
      const reduceResponse = await fetch('https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/linkedin-profile-reducer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(profileData)
      })
      
      console.log("Reduce response status:", reduceResponse.status)
      
      if (!reduceResponse.ok) {
        let errorData = {}
        try {
          errorData = await reduceResponse.json()
        } catch {
          const textError = await reduceResponse.text()
          console.error("Reduce failed - not JSON response:", textError)
          throw new Error(`LinkedIn profile reducer returned ${reduceResponse.status}: ${textError || 'Unknown error'}`)
        }
        
        console.error("Reduce failed:", errorData)
        
        if (reduceResponse.status === 400) {
          throw new Error("Invalid profile data format. Please try a different LinkedIn URL.")
        }
        if (reduceResponse.status === 405) {
          throw new Error("Method not allowed - LinkedIn profile reducer configuration error.")
        }
        if (reduceResponse.status >= 500) {
          throw new Error("LinkedIn profile reducer service error. Please try again later.")
        }
        throw new Error(`Failed to format profile data (${reduceResponse.status}). Please try again.`)
      }
      
      const reducedData = await reduceResponse.json()
      setLinkedinProgress("Profile formatted successfully!")
      
      // Step 3: Parse skills and extract structured data
      setLinkedinProgress("Analyzing profile with AI...")
      console.log("Step 3: Calling parse-linkedin-skill...")
      
      const parseResponse = await fetch('https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/parse-linkedin-skill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(reducedData)
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
      
      // Step 4: Format the data
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
        skills: linkedinSkills
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
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Copy, Sparkles, Check, X } from "lucide-react"

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface QueryVariations {
  complete_query_all: string
  complete_query_skills_only: string
  complete_query_job_titles_only: string
  mandatory_only_query_all: string
  mandatory_only_query_skills_only: string
  mandatory_only_query_job_titles_only: string
}

interface Recommendation {
  type: string
  display_name_type: string
  recommendation: string
}

interface LinkedInQueryData {
  boolean_queries: QueryVariations
  recommendations: Recommendation[]
}

interface LinkedInQueryBuilderProps {
  jobData?: JobData | null
}

export default function LinkedInQueryBuilder({ jobData }: LinkedInQueryBuilderProps) {
  const [mounted, setMounted] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // New state for query variations and recommendations
  const [queryData, setQueryData] = useState<LinkedInQueryData | null>(null)
  const [selectedQueryType, setSelectedQueryType] = useState<keyof QueryVariations>("complete_query_all")
  const [hasGeneratedData, setHasGeneratedData] = useState(false)
  
  // State management for Save/Cancel functionality
  const [savedQueryData, setSavedQueryData] = useState<LinkedInQueryData | null>(null)
  const [backupQueryData, setBackupQueryData] = useState<LinkedInQueryData | null>(null)
  const [backupSelectedQueryType, setBackupSelectedQueryType] = useState<keyof QueryVariations>("complete_query_all")

  // Initialize after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])


  // Check if any content exists that would be overwritten
  const hasExistingContent = () => {
    return savedQueryData !== null
  }

  const handleGenerate = async () => {
    // Check for existing content and show confirmation if needed
    if (hasExistingContent()) {
      const confirmed = window.confirm(
        "This will overwrite your existing LinkedIn query. Are you sure you want to continue?"
      )
      if (!confirmed) return
    }

    setIsGenerating(true)
    try {
      // TODO: Implement API call to generate LinkedIn boolean query
      console.log("Generating LinkedIn query for job:", jobData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock API response matching the actual API structure
      const mockQueryData: LinkedInQueryData = {
        boolean_queries: {
          complete_query_all: `("Senior Full-Stack Developer" OR "Senior Fullstack Developer" OR "Full Stack Engineer" OR "Fullstack Engineer" OR "Senior Software Engineer") AND (TypeScript AND React AND Node AND Postgres AND Mongo AND AWS OR "Financial Services")`,
          complete_query_skills_only: `(TypeScript AND React AND Node AND Postgres AND Mongo AND AWS OR "Financial Services")`,
          complete_query_job_titles_only: `("Senior Full-Stack Developer" OR "Senior Fullstack Developer" OR "Full Stack Engineer" OR "Fullstack Engineer" OR "Senior Software Engineer")`,
          mandatory_only_query_all: `("Senior Full-Stack Developer" OR "Senior Fullstack Developer" OR "Full Stack Engineer" OR "Fullstack Engineer" OR "Senior Software Engineer") AND (TypeScript AND React AND Node AND Postgres AND Mongo)`,
          mandatory_only_query_skills_only: `(TypeScript AND React AND Node AND Postgres AND Mongo)`,
          mandatory_only_query_job_titles_only: `("Senior Full-Stack Developer" OR "Senior Fullstack Developer" OR "Full Stack Engineer" OR "Fullstack Engineer" OR "Senior Software Engineer")`
        },
        recommendations: [
          {
            type: "location",
            display_name_type: "Location",
            recommendation: "Use the 'Location' filter to select 'South America' as the region. Since the job is remote, you can also select 'Remote' in the 'Location' filter."
          },
          {
            type: "industry",
            display_name_type: "Industry",
            recommendation: "Use the 'Industry' filter to select 'Financial Services'. This is not a mandatory requirement, but it may help find candidates with relevant industry experience."
          },
          {
            type: "experience",
            display_name_type: "Experience",
            recommendation: "Use the 'Experience' filter to select '5+ years' for TypeScript, React, and Node, and '2-5 years' for Postgres and Mongo. This aligns with the proficiency levels specified in the job requirements."
          }
        ]
      }
      
      setQueryData(mockQueryData)
      setSelectedQueryType("complete_query_all")
      setHasGeneratedData(true)
      
      // Create backup when entering edit mode
      setBackupQueryData(queryData) // Previous state (could be null)
      setBackupSelectedQueryType(selectedQueryType)
      
      setIsEditMode(true) // Auto-enter edit mode
      
    } catch (error) {
      console.error("Error generating query:", error)
      // TODO: Show error toast/alert
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEdit = () => {
    // Create backup when entering edit mode
    setBackupQueryData(queryData)
    setBackupSelectedQueryType(selectedQueryType)
    setIsEditMode(true)
  }

  const handleSaveQuery = () => {
    // TODO: Implement save logic for LinkedIn query data
    console.log("Saving LinkedIn query data:", queryData)
    
    // Save current data as the confirmed saved state
    setSavedQueryData(queryData)
    setHasGeneratedData(true)
    
    // Clear backup data
    setBackupQueryData(null)
    setBackupSelectedQueryType("complete_query_all")
    
    // Return to view mode
    setIsEditMode(false)
  }

  const handleCancel = () => {
    // Restore from backup (state when edit mode was entered)
    setQueryData(backupQueryData)
    setSelectedQueryType(backupSelectedQueryType)
    
    // If backup was null, clear generated data flag
    if (backupQueryData === null) {
      setHasGeneratedData(false)
    }
    
    // Clear backup data
    setBackupQueryData(null)
    setBackupSelectedQueryType("complete_query_all")
    
    // Return to view mode
    setIsEditMode(false)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add toast notification
    console.log("Copied to clipboard:", text)
  }

  // Get the data to display (current data in edit mode, saved data in view mode)
  const getDisplayData = () => {
    if (isEditMode) return queryData
    return savedQueryData
  }

  // Get current query based on selected radio button
  const getCurrentQuery = () => {
    const displayData = getDisplayData()
    if (!displayData) return ""
    return displayData.boolean_queries[selectedQueryType]
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Main LinkedIn Query Card */}
      <Card>
        <CardHeader>
          {/* Tool Header with responsive layout */}
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">LinkedIn Query Builder</h2>
            </div>
            
            {/* Subtitle spans full width */}
            <p className="text-muted-foreground">Generate Boolean search strings optimized for LinkedIn Recruiter to find the perfect candidates for your role.</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {isGenerating 
                ? "Generating LinkedIn Boolean query..." 
                : hasGeneratedData 
                  ? "AI-generated LinkedIn search queries and recommendations"
                  : "Generate search queries for LinkedIn Recruiter or Sales Navigator"
              }
            </p>
            <div className="flex items-center space-x-2">
              {!isEditMode && !isGenerating && !hasGeneratedData && !savedQueryData && (
                <Button onClick={handleGenerate} size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              )}
              {!isEditMode && !isGenerating && (hasGeneratedData || savedQueryData) && (
                <>
                  <Button onClick={handleGenerate} variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button onClick={handleEdit} size="sm">
                    Edit
                  </Button>
                </>
              )}
              {isEditMode && (
                <>
                  <Button onClick={handleSaveQuery} size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              {isGenerating && (
                <Button disabled size="sm">
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show prompt message when no data exists */}
          {!hasGeneratedData && !savedQueryData && !isGenerating && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Click the &quot;Generate&quot; button to create LinkedIn search queries based on your job requirements.
              </p>
            </div>
          )}

          {/* Show generated content - use queryData in edit mode, savedQueryData in view mode */}
          {(hasGeneratedData || savedQueryData) && (() => {
            const displayData = getDisplayData()
            if (!displayData) return null
            
            return (
            <>
              {/* LinkedIn Search Query Section */}
              <div className="space-y-4">
                <Label className="text-base font-medium">LinkedIn Search Query</Label>
                
                {/* Radio buttons in 3x2 grid */}
                <RadioGroup 
                  value={selectedQueryType} 
                  onValueChange={(value) => setSelectedQueryType(value as keyof QueryVariations)}
                  className="grid grid-cols-2 gap-4"
                >
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="complete_query_all" id="complete_query_all" />
                      <Label htmlFor="complete_query_all" className="text-sm font-normal cursor-pointer">
                        Full Query
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="complete_query_skills_only" id="complete_query_skills_only" />
                      <Label htmlFor="complete_query_skills_only" className="text-sm font-normal cursor-pointer">
                        Skills Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="complete_query_job_titles_only" id="complete_query_job_titles_only" />
                      <Label htmlFor="complete_query_job_titles_only" className="text-sm font-normal cursor-pointer">
                        Job Titles Only
                      </Label>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mandatory_only_query_all" id="mandatory_only_query_all" />
                      <Label htmlFor="mandatory_only_query_all" className="text-sm font-normal cursor-pointer">
                        Must-Haves Only (All)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mandatory_only_query_skills_only" id="mandatory_only_query_skills_only" />
                      <Label htmlFor="mandatory_only_query_skills_only" className="text-sm font-normal cursor-pointer">
                        Must-Haves Skills Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mandatory_only_query_job_titles_only" id="mandatory_only_query_job_titles_only" />
                      <Label htmlFor="mandatory_only_query_job_titles_only" className="text-sm font-normal cursor-pointer">
                        Must-Haves Job Titles Only
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* Query display with copy button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Query Text</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(getCurrentQuery())}
                      className="h-8 w-8 p-0"
                      disabled={!getCurrentQuery()}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={getCurrentQuery()}
                    readOnly
                    rows={4}
                    className="cursor-default bg-muted/50"
                  />
                </div>
              </div>

              {/* LinkedIn Search Recommendations Section */}
              <div className="space-y-4">
                <Label className="text-base font-medium">LinkedIn Search Recommendations</Label>
                <div className="grid gap-4">
                  {displayData.recommendations.map((recommendation, index) => (
                    <Card key={index} className="p-4">
                      <h4 className="font-medium mb-2">{recommendation.display_name_type}</h4>
                      <p className="text-sm text-muted-foreground">{recommendation.recommendation}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
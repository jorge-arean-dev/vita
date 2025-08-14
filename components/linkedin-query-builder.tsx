"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Copy, Sparkles, Check, X, Info } from "lucide-react"
import { getJobForLinkedInQuery } from "@/app/actions/jobs"
import { generateLinkedInQueries, saveLinkedInQueries, loadLinkedInQueries } from "@/lib/api/linkedin-queries"
import { useToast } from "@/components/ui/use-toast"

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
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()
  
  // Core display state (what user sees - read-only or editable)
  const [queryData, setQueryData] = useState<LinkedInQueryData | null>(null)
  const [selectedQueryType, setSelectedQueryType] = useState<keyof QueryVariations>("complete_query_all")
  
  // Editing values (temporary values during editing sessions)
  const [editingValues, setEditingValues] = useState<{
    queryData: LinkedInQueryData | null
    selectedQueryType: keyof QueryVariations
  } | null>(null)
  
  // Original values (baseline for change detection - represents saved state)
  const [originalValues, setOriginalValues] = useState<{
    queryData: LinkedInQueryData | null
    selectedQueryType: keyof QueryVariations
  } | null>(null)
  
  // Track if content was just generated (for showing info banner)
  const [showGenerationBanner, setShowGenerationBanner] = useState(false)

  // Dialog state for confirmations
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)

  // Initialize after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load existing queries when component mounts
  useEffect(() => {
    const loadExistingQueries = async () => {
      if (!mounted || !jobData) return
      
      try {
        const existingQueries = await loadLinkedInQueries(jobData.id)
        if (existingQueries) {
          setQueryData(existingQueries)
          setSelectedQueryType("complete_query_all")
        }
      } catch (error) {
        console.error("Error loading existing LinkedIn queries:", error)
        // Don't show error to user - just continue without saved data
      }
    }

    loadExistingQueries()
  }, [mounted, jobData])


  // Change detection function following the pattern
  const hasChanges = useCallback((): boolean => {
    const current = editingValues
    const original = originalValues
    
    // If no current editing values, no changes
    if (!current) return false
    
    // If no original values (new content), check if there's any content
    if (!original) {
      if (!current.queryData) return false
      
      // Check if any query has content
      const queries = current.queryData.boolean_queries
      return Object.values(queries).some(query => query.trim() !== '')
    }
    
    // Compare current values with original values
    if (!current.queryData && !original.queryData) return false
    if (!current.queryData || !original.queryData) return true
    
    // Compare query type selection
    if (current.selectedQueryType !== original.selectedQueryType) return true
    
    // Compare all query variations
    const currentQueries = current.queryData.boolean_queries
    const originalQueries = original.queryData.boolean_queries
    
    const queryTypes: (keyof QueryVariations)[] = [
      'complete_query_all',
      'complete_query_skills_only', 
      'complete_query_job_titles_only',
      'mandatory_only_query_all',
      'mandatory_only_query_skills_only',
      'mandatory_only_query_job_titles_only'
    ]
    
    return queryTypes.some(queryType => 
      currentQueries[queryType] !== originalQueries[queryType]
    )
  }, [editingValues, originalValues])

  // Check if any content exists that would be overwritten
  const hasExistingContent = () => {
    if (isEditing && editingValues?.queryData) {
      const queries = editingValues.queryData.boolean_queries
      return Object.values(queries).some(query => query.trim() !== '')
    }
    return queryData !== null
  }

  // Get current display data based on mode
  const getCurrentData = () => {
    return isEditing ? editingValues?.queryData : queryData
  }

  // Get current query type based on mode
  const getCurrentQueryType = () => {
    return isEditing ? (editingValues?.selectedQueryType || "complete_query_all") : selectedQueryType
  }

  // Get current query text
  const getCurrentQuery = () => {
    const data = getCurrentData()
    if (!data) return ""
    return data.boolean_queries[getCurrentQueryType()]
  }

  // Check if we have any saved content
  const hasSavedContent = () => {
    return queryData !== null
  }

  // Handle overwrite confirmation
  const handleOverwriteConfirm = () => {
    setShowOverwriteDialog(false)
    proceedWithGeneration()
  }

  // Handle unsaved changes confirmation
  const handleUnsavedChangesConfirm = () => {
    setShowUnsavedChangesDialog(false)
    proceedWithCancel()
  }

  const handleGenerate = async () => {
    if (!jobData) {
      console.error("No job data available for generation")
      return
    }

    // Check for existing content and show confirmation if needed
    if (hasExistingContent()) {
      setShowOverwriteDialog(true)
      return
    }

    // If no existing content, proceed directly
    proceedWithGeneration()
  }

  const proceedWithGeneration = async () => {
    if (!jobData) return // Early return for safety
    
    // If not in edit mode, enter edit mode first
    if (!isEditing) {
      setIsEditing(true)
      
      // Initialize editing state with current saved data
      setEditingValues({
        queryData: queryData,
        selectedQueryType: selectedQueryType
      })
      
      // Set original values to represent the baseline (current saved state)
      // Only set originalValues when entering edit mode, NOT during generation
      if (!originalValues) {
        setOriginalValues({
          queryData: queryData,
          selectedQueryType: selectedQueryType
        })
      }
    }

    setIsGenerating(true)
    try {
      console.log('About to call getJobForLinkedInQuery with jobData.id:', jobData.id)
      
      // Fetch job data with requirements
      const jobForGeneration = await getJobForLinkedInQuery(jobData.id)
      console.log('Successfully fetched job data:', jobForGeneration)
      
      // Call the real API to generate LinkedIn queries
      console.log('About to call generateLinkedInQueries')
      const apiResponse = await generateLinkedInQueries(jobForGeneration)
      console.log('Successfully generated LinkedIn queries:', apiResponse)
      
      // Update editing values with generated data (acts like manual editing)
      setEditingValues({
        queryData: apiResponse,
        selectedQueryType: "complete_query_all"
      })
      
      // NEVER update originalValues during generation - this acts like manual editing
      setShowGenerationBanner(true)
      
    } catch (error) {
      console.error("Error generating LinkedIn queries:", error)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Failed to generate LinkedIn queries"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEdit = () => {
    // Enter edit mode and initialize editing state with current saved data
    setIsEditing(true)
    
    // Set editing values to current saved data
    setEditingValues({
      queryData: queryData,
      selectedQueryType: selectedQueryType
    })
    
    // Set original values to represent the baseline (current saved state)
    setOriginalValues({
      queryData: queryData,
      selectedQueryType: selectedQueryType
    })
    
    setShowGenerationBanner(false)
  }

  const handleSave = async () => {
    if (!editingValues?.queryData || !jobData) return

    setIsSaving(true)
    try {
      // Save to database
      await saveLinkedInQueries(jobData.id, editingValues.queryData)
      
      // Update main display state with saved data
      setQueryData(editingValues.queryData)
      setSelectedQueryType(editingValues.selectedQueryType)
      
      // Set original values to current editing values (represents new saved state)
      setOriginalValues({
        queryData: editingValues.queryData,
        selectedQueryType: editingValues.selectedQueryType
      })
      
      // Clear editing state and exit edit mode
      setEditingValues(null)
      setIsEditing(false)
      setShowGenerationBanner(false)
      
      // Show success toast
      toast({
        title: "Success",
        description: "LinkedIn queries saved successfully.",
      })
      
    } catch (error) {
      console.error("Error saving LinkedIn queries:", error)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Failed to save LinkedIn queries"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Show confirmation if there are unsaved changes
    if (hasChanges()) {
      setShowUnsavedChangesDialog(true)
      return
    }
    
    // If no unsaved changes, proceed directly
    proceedWithCancel()
  }

  const proceedWithCancel = () => {
    // Clear editing state and return to view mode
    setEditingValues(null)
    setOriginalValues(null)
    setIsEditing(false)
    setShowGenerationBanner(false)
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Success",
        description: "Copied to clipboard",
      })
      console.log("Copied to clipboard:", text)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Handle unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges()) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Handle query type selection (available in both modes)
  const handleQueryTypeChange = (value: keyof QueryVariations) => {
    if (isEditing && editingValues) {
      setEditingValues({
        ...editingValues,
        selectedQueryType: value
      })
    } else {
      setSelectedQueryType(value)
    }
  }

  // Handle query text changes (only in edit mode)
  const handleQueryTextChange = (value: string) => {
    if (!isEditing || !editingValues?.queryData) return
    
    const updatedQueryData = {
      ...editingValues.queryData,
      boolean_queries: {
        ...editingValues.queryData.boolean_queries,
        [editingValues.selectedQueryType]: value
      }
    }
    
    setEditingValues({
      ...editingValues,
      queryData: updatedQueryData
    })
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
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                {isGenerating 
                  ? "Generating LinkedIn Boolean query..." 
                  : isSaving
                    ? "Saving LinkedIn query..."
                    : isEditing
                      ? "Edit mode - make changes and save"
                      : hasSavedContent() 
                        ? "AI-generated LinkedIn search queries and recommendations"
                        : "Generate search queries for LinkedIn Recruiter or Sales Navigator"
                }
              </p>
              {hasChanges() && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* View Mode Buttons */}
              {!isEditing && !isGenerating && !isSaving && (
                <>
                  {/* Generate button - always available in view mode */}
                  <Button 
                    onClick={handleGenerate} 
                    variant={hasSavedContent() ? "outline" : "default"} 
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {hasSavedContent() ? "Regenerate" : "Generate"}
                  </Button>
                  
                  {/* Edit button - only when we have saved content */}
                  {hasSavedContent() && (
                    <Button onClick={handleEdit} size="sm">
                      Edit
                    </Button>
                  )}
                </>
              )}
              
              {/* Edit Mode Buttons */}
              {isEditing && (
                <>
                  <Button 
                    onClick={handleGenerate} 
                    variant="outline" 
                    size="sm"
                    disabled={isGenerating || isSaving}
                  >
                    <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? "Generating..." : "Generate"}
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    size="sm"
                    disabled={!hasChanges() || isGenerating || isSaving}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={isGenerating || isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show generation info banner in edit mode after generation */}
          {isEditing && showGenerationBanner && editingValues?.queryData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    LinkedIn query generated successfully
                  </h4>
                  <p className="text-sm text-blue-700">
                    Review the generated search queries and recommendations below. You can select different query variations and make manual edits before saving.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Show prompt message when no data exists */}
          {!hasSavedContent() && !getCurrentData() && !isGenerating && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Click the &quot;Generate&quot; button to create LinkedIn search queries based on your job requirements.
              </p>
            </div>
          )}

          {/* Show content when available */}
          {getCurrentData() && (() => {
            const displayData = getCurrentData()
            if (!displayData) return null
            
            return (
            <div className="relative">
              {/* LinkedIn Search Query Section */}
              <div className="space-y-4">
                <Label className="text-base font-medium">LinkedIn Search Query</Label>
                
                {/* Radio buttons in 3x2 grid - disabled during generation */}
                <div className="grid grid-cols-2 gap-4">
                  <RadioGroup 
                    value={getCurrentQueryType()} 
                    onValueChange={handleQueryTypeChange}
                    className="contents"
                    disabled={isGenerating}
                  >
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="complete_query_all" id="complete_query_all" disabled={isGenerating} />
                        <Label htmlFor="complete_query_all" className="text-sm font-normal cursor-pointer">
                          Full Query
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="complete_query_skills_only" id="complete_query_skills_only" disabled={isGenerating} />
                        <Label htmlFor="complete_query_skills_only" className="text-sm font-normal cursor-pointer">
                          Skills Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="complete_query_job_titles_only" id="complete_query_job_titles_only" disabled={isGenerating} />
                        <Label htmlFor="complete_query_job_titles_only" className="text-sm font-normal cursor-pointer">
                          Job Titles Only
                        </Label>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mandatory_only_query_all" id="mandatory_only_query_all" disabled={isGenerating} />
                        <Label htmlFor="mandatory_only_query_all" className="text-sm font-normal cursor-pointer">
                          Must-Haves Only (All)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mandatory_only_query_skills_only" id="mandatory_only_query_skills_only" disabled={isGenerating} />
                        <Label htmlFor="mandatory_only_query_skills_only" className="text-sm font-normal cursor-pointer">
                          Must-Haves Skills Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mandatory_only_query_job_titles_only" id="mandatory_only_query_job_titles_only" disabled={isGenerating} />
                        <Label htmlFor="mandatory_only_query_job_titles_only" className="text-sm font-normal cursor-pointer">
                          Must-Haves Job Titles Only
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Query display with copy button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Query Text</Label>
                    {/* Copy button only in view mode */}
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(getCurrentQuery())}
                        className="h-8 w-8 p-0"
                        disabled={!getCurrentQuery()}
                        title="Copy query to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Textarea
                    value={getCurrentQuery()}
                    onChange={(e) => handleQueryTextChange(e.target.value)}
                    readOnly={!isEditing || isGenerating}
                    rows={4}
                    className={`${!isEditing ? 'cursor-default bg-muted/50' : ''} resize-none`}
                    placeholder={isEditing ? "Query will appear here after generation" : ""}
                  />
                </div>
              </div>

              {/* LinkedIn Search Recommendations Section */}
              {displayData.recommendations && displayData.recommendations.length > 0 && (
                <div className="space-y-4 mt-6">
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
              )}
              
              {/* Generation Loading Overlay - Covers entire content area */}
              {isGenerating && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Sparkles className="h-8 w-8 animate-spin text-primary" />
                    <div className="space-y-1">
                      <p className="text-lg font-medium">Generating LinkedIn queries...</p>
                      <p className="text-sm text-muted-foreground">
                        Please wait while AI creates your search queries and recommendations
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Overwrite Confirmation Dialog */}
      <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Existing Content</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite your existing LinkedIn query. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOverwriteConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to cancel without saving? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnsavedChangesConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Trash2, Plus, Sparkles, Save, X, AlertCircle, Copy, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { 
  createJobDescription, 
  updateJobDescription, 
  deleteJobDescription, 
  generateJobDescription 
} from "@/app/actions/job-management"
import { useToast } from "@/components/ui/use-toast"

interface JobDescription {
  id: string
  job_id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  isExpanded?: boolean
  isEditing?: boolean
}

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string | null
}

interface JobDescriptionBuilderProps {
  jobData?: JobData | null
  existingDescriptions?: JobDescription[]
}

export default function JobDescriptionBuilder({ jobData, existingDescriptions = [] }: JobDescriptionBuilderProps) {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([])
  const [editingValues, setEditingValues] = useState<{ [key: string]: { title: string; content: string } }>({})
  const [showGenerateAlert, setShowGenerateAlert] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({})
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({})
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  // Storage key for expanded states
  const expandedStateKey = jobData?.id ? `job-desc-expanded-${jobData.id}` : null


  // Initialize only once on mount
  useEffect(() => {
    setMounted(true)
    // Try to restore expanded states from sessionStorage
    let savedExpandedStates: { [key: string]: boolean } = {}
    if (expandedStateKey && typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(expandedStateKey)
        if (saved) {
          savedExpandedStates = JSON.parse(saved)
        }
      } catch (e) {
        console.error('Error loading expanded states:', e)
      }
    }
    
    // Initialize with existing descriptions
    const descriptionsWithState = existingDescriptions.map(desc => ({
      ...desc,
      isExpanded: savedExpandedStates[desc.id] ?? false,
      isEditing: false
    }))
    setJobDescriptions(descriptionsWithState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount
  
  // Update job descriptions when existingDescriptions changes, but preserve expanded state
  useEffect(() => {
    if (!mounted) return
    
    setJobDescriptions(prev => {
      // Create a map of current expanded states
      const expandedStates = new Map(prev.map(jd => [jd.id, jd.isExpanded]))
      const editingStates = new Map(prev.map(jd => [jd.id, jd.isEditing]))
      
      // Map new descriptions with preserved states
      return existingDescriptions.map(desc => ({
        ...desc,
        isExpanded: expandedStates.get(desc.id) ?? false,
        isEditing: editingStates.get(desc.id) ?? false
      }))
    })
  }, [existingDescriptions, mounted])

  // Save expanded states to sessionStorage whenever they change
  useEffect(() => {
    if (!expandedStateKey || !mounted || typeof window === 'undefined') return
    
    const expandedStates: { [key: string]: boolean } = {}
    jobDescriptions.forEach(jd => {
      if (jd.isExpanded) {
        expandedStates[jd.id] = true
      }
    })
    
    try {
      sessionStorage.setItem(expandedStateKey, JSON.stringify(expandedStates))
    } catch (e) {
      console.error('Error saving expanded states:', e)
    }
  }, [jobDescriptions, expandedStateKey, mounted])

  // Get next counter for job description title
  const getNextDescriptionCounter = () => {
    const existingCounts = jobDescriptions
      .map(jd => {
        const match = jd.title.match(/job desc\. (\d+)$/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(count => count > 0)
    
    return existingCounts.length > 0 ? Math.max(...existingCounts) + 1 : 1
  }

  const handleNewJobDescription = () => {
    const counter = getNextDescriptionCounter()
    const newJobDescription: JobDescription = {
      id: `new-${Date.now()}`, // Temporary ID for new descriptions
      job_id: jobData?.id || '',
      title: `${jobData?.title || 'Job'} - job desc. ${counter}`,
      description: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isExpanded: true,
      isEditing: true,
    }
    
    // Initialize editing values for the new description
    setEditingValues({
      ...editingValues,
      [newJobDescription.id]: {
        title: newJobDescription.title,
        content: newJobDescription.description
      }
    })
    
    setJobDescriptions([newJobDescription, ...jobDescriptions])
    setUnsavedChanges(prev => new Set(prev).add(newJobDescription.id))
  }

  const handleToggleExpand = (id: string) => {
    const jobDesc = jobDescriptions.find(jd => jd.id === id)
    if (!jobDesc) return
    
    // Check for unsaved changes before collapsing
    if (unsavedChanges.has(id) && jobDesc.isExpanded && jobDesc.isEditing) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to collapse without saving?"
      )
      if (!confirmed) return
    }

    setJobDescriptions(prevDescriptions => 
      prevDescriptions.map((jd) => 
        jd.id === id ? { ...jd, isExpanded: !jd.isExpanded, isEditing: false } : jd
      )
    )
    
    // Clear editing values and unsaved changes when collapsing
    if (jobDesc.isExpanded) {
      if (editingValues[id]) {
        const newEditingValues = { ...editingValues }
        delete newEditingValues[id]
        setEditingValues(newEditingValues)
      }
      setUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    
    setIsDeleting({ ...isDeleting, [deleteConfirmId]: true })
    
    try {
      // Call API to delete from database if not a new description
      if (!deleteConfirmId.startsWith('new-')) {
        const result = await deleteJobDescription(deleteConfirmId)
        if (!result.success) {
          console.error("Failed to delete job description:", result.error)
          toast({
            title: "Error",
            description: "Failed to delete job description. Please try again.",
            variant: "destructive",
          })
          return
        }
        
        toast({
          title: "Success",
          description: "Job description deleted successfully.",
        })
      }
      
      setJobDescriptions(jobDescriptions.filter((jd) => jd.id !== deleteConfirmId))
      
      // Clear editing values for deleted item
      if (editingValues[deleteConfirmId]) {
        const newEditingValues = { ...editingValues }
        delete newEditingValues[deleteConfirmId]
        setEditingValues(newEditingValues)
      }
      
      // Remove from unsaved changes
      setUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(deleteConfirmId)
        return newSet
      })
      
      setDeleteConfirmId(null)
    } catch (error) {
      console.error("Error deleting job description:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting({ ...isDeleting, [deleteConfirmId]: false })
    }
  }

  const handleGenerate = async (id: string) => {
    const jobDescription = jobDescriptions.find(jd => jd.id === id)
    if (!jobDescription) return
    
    // Get current content (from editing values if in edit mode, or saved content)
    const currentContent = jobDescription.isEditing 
      ? (editingValues[id]?.content || jobDescription.description)
      : jobDescription.description
    
    // Check if content exists and show overwrite confirmation
    if (currentContent && currentContent.trim() !== '') {
      setOverwriteConfirmId(id)
      return
    }
    
    await proceedWithGeneration(id)
  }

  const proceedWithGeneration = async (id: string) => {
    setIsGenerating({ ...isGenerating, [id]: true })
    
    try {
      console.log("proceedWithGeneration - jobData:", jobData)
      
      if (!jobData?.id) {
        console.error("No job data available for generation")
        toast({
          title: "Error",
          description: "No job data available. Please refresh the page.",
          variant: "destructive",
        })
        return
      }

      // Call the server action to generate job description
      const result = await generateJobDescription(jobData.id)
      
      if (!result.success) {
        console.error("Failed to generate job description:", result.error)
        toast({
          title: "Generation Failed",
          description: "Failed to generate job description. Please try again.",
          variant: "destructive",
        })
        return
      }
      
      // Update the job description with generated content
      const jobDescription = jobDescriptions.find(jd => jd.id === id)
      if (jobDescription) {
        // Store current values for editing
        setEditingValues({
          ...editingValues,
          [id]: {
            title: jobDescription.title,
            content: result.description || ''
          }
        })
        
        // Enter edit mode
        setJobDescriptions(
          jobDescriptions.map((jd) =>
            jd.id === id ? { ...jd, isEditing: true, isExpanded: true } : jd
          )
        )
        
        // Mark as having unsaved changes
        setUnsavedChanges(prev => new Set(prev).add(id))
        
        // Show the alert banner
        setShowGenerateAlert(true)
      }
    } catch (error) {
      console.error("Error generating description:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during generation.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating({ ...isGenerating, [id]: false })
    }
  }

  const handleEdit = (id: string) => {
    const jobDescription = jobDescriptions.find((jd) => jd.id === id)
    if (jobDescription) {
      // Store current values for editing
      setEditingValues({
        ...editingValues,
        [id]: {
          title: jobDescription.title,
          content: jobDescription.description,
        },
      })
      // Set editing mode
      setJobDescriptions(
        jobDescriptions.map((jd) => (jd.id === id ? { ...jd, isEditing: true, isExpanded: true } : jd))
      )
    }
  }

  const handleSave = async (id: string) => {
    const editingValue = editingValues[id]
    if (!editingValue || !jobData?.id) return
    
    setIsSaving({ ...isSaving, [id]: true })
    
    try {
      let result: { success: boolean; error?: string; id?: string }
      const isNewDescription = id.startsWith('new-')
      
      // Check if this is a new description (temporary ID) or existing one
      if (isNewDescription) {
        // Create new job description
        result = await createJobDescription(
          jobData.id,
          editingValue.title,
          editingValue.content
        )
        
        if (result.success && result.id) {
          // Update the job description with the real ID from database
          setJobDescriptions(
            jobDescriptions.map((jd) =>
              jd.id === id
                ? {
                    ...jd,
                    id: result.id!, // Use the real ID from database
                    title: editingValue.title,
                    description: editingValue.content,
                    isEditing: false,
                    isExpanded: jd.isExpanded, // Preserve expanded state
                    updated_at: new Date().toISOString(),
                  }
                : jd,
            ),
          )
          
          toast({
            title: "Success",
            description: "Job description created successfully.",
          })
        }
      } else {
        // Update existing job description
        result = await updateJobDescription(
          id,
          editingValue.title,
          editingValue.content
        )
        
        if (result.success) {
          // Update local state
          setJobDescriptions(
            jobDescriptions.map((jd) =>
              jd.id === id
                ? {
                    ...jd,
                    title: editingValue.title,
                    description: editingValue.content,
                    isEditing: false,
                    isExpanded: jd.isExpanded, // Preserve expanded state
                    updated_at: new Date().toISOString(),
                  }
                : jd,
            ),
          )
          
          toast({
            title: "Success",
            description: "Job description updated successfully.",
          })
        }
      }
      
      if (!result.success) {
        console.error("Failed to save job description:", result.error)
        toast({
          title: "Error",
          description: `Failed to ${isNewDescription ? 'create' : 'update'} job description. Please try again.`,
          variant: "destructive",
        })
        return
      }
      
      // Clear editing values
      const newEditingValues = { ...editingValues }
      delete newEditingValues[id]
      setEditingValues(newEditingValues)
      
      // Remove from unsaved changes
      setUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      
      // Hide generate alert if visible
      setShowGenerateAlert(false)
    } catch (error) {
      console.error("Error saving job description:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      })
    } finally {
      setIsSaving({ ...isSaving, [id]: false })
    }
  }

  const handleCancel = (id: string) => {
    // Check if this is a new unsaved description
    if (id.startsWith('new-') && !jobDescriptions.find(jd => jd.id === id)?.description) {
      // Remove the new empty description
      setJobDescriptions(jobDescriptions.filter(jd => jd.id !== id))
    } else {
      // Cancel editing without saving
      setJobDescriptions(
        jobDescriptions.map((jd) => (jd.id === id ? { ...jd, isEditing: false, isExpanded: jd.isExpanded } : jd))
      )
    }
    
    // Clear editing values
    const newEditingValues = { ...editingValues }
    delete newEditingValues[id]
    setEditingValues(newEditingValues)
    
    // Remove from unsaved changes
    setUnsavedChanges(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    
    // Hide generate alert if visible
    setShowGenerateAlert(false)
  }

  const handleEditingTitleChange = (id: string, title: string) => {
    setEditingValues({
      ...editingValues,
      [id]: {
        ...editingValues[id],
        title,
      },
    })
    setUnsavedChanges(prev => new Set(prev).add(id))
  }

  const handleEditingContentChange = (id: string, content: string) => {
    setEditingValues({
      ...editingValues,
      [id]: {
        ...editingValues[id],
        content,
      },
    })
    setUnsavedChanges(prev => new Set(prev).add(id))
  }

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Success",
        description: "Copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header with New button */}
      <div className="pb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Job Description Builder</h2>
            <p className="text-muted-foreground">
              Create polished job descriptions from rough notes or client calls with AI assistance to attract the right candidates.
            </p>
          </div>
          <Button onClick={handleNewJobDescription} className="gap-2">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* Generate Alert Banner */}
      {showGenerateAlert && (
        <div className="info-indicator">
          <AlertCircle className="h-4 w-4" />
          <span>
            Please review the AI-generated job description and make any necessary adjustments before saving.
          </span>
        </div>
      )}

      {/* Job Descriptions List */}
      <div className="space-y-4">
        {jobDescriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No job descriptions created yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first job description to get started.
              </p>
              <Button onClick={handleNewJobDescription} className="gap-2">
                <Plus className="h-4 w-4" />
                New Job Description
              </Button>
            </CardContent>
          </Card>
        ) : (
          jobDescriptions.map((jobDescription) => (
            <Card key={jobDescription.id} className="w-full">
              <CardHeader className={jobDescription.isExpanded ? "pb-3" : "py-0"}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Collapse/Expand Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleExpand(jobDescription.id)}
                      className="h-8 w-8 p-0"
                      aria-label={jobDescription.isExpanded ? "Collapse" : "Expand"}
                    >
                      {jobDescription.isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Job Title */}
                    {jobDescription.isEditing && jobDescription.isExpanded ? (
                      <div className="flex-1 mr-6">
                        <Input
                          value={editingValues[jobDescription.id]?.title || jobDescription.title}
                          onChange={(e) => handleEditingTitleChange(jobDescription.id, e.target.value)}
                          className="text-lg font-normal p-2 h-auto focus-visible:ring-0"
                          placeholder="Enter job title..."
                        />
                      </div>
                    ) : (
                      <h3 className="text-lg font-semibold">{jobDescription.title}</h3>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {!jobDescription.isExpanded ? (
                      // Collapsed view - only delete button
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(jobDescription.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        aria-label="Delete job description"
                        disabled={isDeleting[jobDescription.id]}
                      >
                        {isDeleting[jobDescription.id] ? (
                          <Trash2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    ) : jobDescription.isEditing ? (
                      // Edit Mode Buttons
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerate(jobDescription.id)}
                          className="gap-2"
                          disabled={isGenerating[jobDescription.id] || isSaving[jobDescription.id]}
                        >
                          {isGenerating[jobDescription.id] ? (
                            <>
                              <Sparkles className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Generate
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleSave(jobDescription.id)}
                          size="sm"
                          className="gap-2"
                          disabled={
                            isSaving[jobDescription.id] || 
                            isGenerating[jobDescription.id] ||
                            !editingValues[jobDescription.id]?.title?.trim() ||
                            !editingValues[jobDescription.id]?.content?.trim()
                          }
                        >
                          {isSaving[jobDescription.id] ? (
                            <>
                              <Save className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(jobDescription.id)}
                          className="gap-2"
                          disabled={isSaving[jobDescription.id] || isGenerating[jobDescription.id]}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      // Expanded View Mode Buttons
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleEdit(jobDescription.id)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(jobDescription.id)}
                          className="gap-2"
                          disabled={isDeleting[jobDescription.id]}
                        >
                          {isDeleting[jobDescription.id] ? (
                            <>
                              <Trash2 className="h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content */}
              {jobDescription.isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Copy Button - Only visible in view mode */}
                    {!jobDescription.isEditing && (
                      <div className="flex justify-end -mt-2 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(jobDescription.description)}
                          className="h-8 w-8 p-0"
                          disabled={!jobDescription.description || jobDescription.description.trim() === ''}
                          aria-label="Copy job description"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Text Area */}
                    <div className="space-y-2">
                      <Textarea
                        value={
                          jobDescription.isEditing
                            ? editingValues[jobDescription.id]?.content || jobDescription.description
                            : jobDescription.description
                        }
                        onChange={(e) => {
                          if (jobDescription.isEditing) {
                            handleEditingContentChange(jobDescription.id, e.target.value)
                          }
                        }}
                        className="min-h-[500px] resize-none"
                        placeholder="Enter job description content or click Generate to create one with AI..."
                        readOnly={!jobDescription.isEditing}
                      />
                    </div>
                  </div>
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
            <AlertDialogTitle>Delete Job Description</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job description? This action cannot be undone.
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

      {/* Overwrite Confirmation Dialog */}
      <AlertDialog open={!!overwriteConfirmId} onOpenChange={() => setOverwriteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Existing Content</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite your existing job description. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (overwriteConfirmId) {
                proceedWithGeneration(overwriteConfirmId)
                setOverwriteConfirmId(null)
              }
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
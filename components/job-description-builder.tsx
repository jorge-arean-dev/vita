"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Trash2, Plus, Sparkles, Save, X, AlertCircle, Copy, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
  const [originalValues, setOriginalValues] = useState<{ [key: string]: { title: string; content: string } }>({})
  const [showGenerateAlert, setShowGenerateAlert] = useState<{ [key: string]: boolean }>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const [collapseConfirmId, setCollapseConfirmId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({})
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({})
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  // Storage keys
  const expandedStateKey = jobData?.id ? `job-desc-expanded-${jobData.id}` : null
  const unsavedDescriptionsKey = jobData?.id ? `job-desc-unsaved-${jobData.id}` : null


  // Initialize only once on mount
  useEffect(() => {
    setMounted(true)
    // Try to restore expanded states from sessionStorage
    let savedExpandedStates: { [key: string]: boolean } = {}
    let savedUnsavedDescriptions: JobDescription[] = []
    let savedEditingValues: { [key: string]: { title: string; content: string } } = {}
    
    if (typeof window !== 'undefined') {
      // Restore expanded states
      if (expandedStateKey) {
        try {
          const saved = sessionStorage.getItem(expandedStateKey)
          if (saved) {
            savedExpandedStates = JSON.parse(saved)
          }
        } catch (e) {
          console.error('Error loading expanded states:', e)
        }
      }
      
      // Restore unsaved descriptions
      if (unsavedDescriptionsKey) {
        try {
          const savedUnsaved = sessionStorage.getItem(unsavedDescriptionsKey)
          if (savedUnsaved) {
            const parsed = JSON.parse(savedUnsaved)
            savedUnsavedDescriptions = parsed.descriptions || []
            savedEditingValues = parsed.editingValues || {}
            console.log('Restored unsaved descriptions:', savedUnsavedDescriptions.length, 'descriptions')
          }
        } catch (e) {
          console.error('Error loading unsaved descriptions:', e)
        }
      }
    }
    
    // Initialize with existing descriptions
    const descriptionsWithState = existingDescriptions.map(desc => ({
      ...desc,
      isExpanded: savedExpandedStates[desc.id] ?? false,
      isEditing: false
    }))
    
    // Add saved unsaved descriptions
    const allDescriptions = [...savedUnsavedDescriptions, ...descriptionsWithState]
    setJobDescriptions(allDescriptions)
    
    // Restore editing values
    if (Object.keys(savedEditingValues).length > 0) {
      setEditingValues(savedEditingValues)
      setUnsavedChanges(new Set(Object.keys(savedEditingValues)))
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount
  
  // Update job descriptions when existingDescriptions changes, but preserve expanded state and new descriptions
  useEffect(() => {
    if (!mounted) return
    
    setJobDescriptions(prev => {
      // Create a map of current expanded states
      const expandedStates = new Map(prev.map(jd => [jd.id, jd.isExpanded]))
      const editingStates = new Map(prev.map(jd => [jd.id, jd.isEditing]))
      
      // Keep all new descriptions that haven't been saved yet
      const unsavedNewDescriptions = prev.filter(jd => jd.id.startsWith('new-'))
      
      // Map existing descriptions with preserved states
      const updatedExistingDescriptions = existingDescriptions.map(desc => ({
        ...desc,
        isExpanded: expandedStates.get(desc.id) ?? false,
        isEditing: editingStates.get(desc.id) ?? false
      }))
      
      // Combine unsaved new descriptions with updated existing ones
      return [...unsavedNewDescriptions, ...updatedExistingDescriptions]
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

  // Save unsaved descriptions to sessionStorage
  useEffect(() => {
    if (!unsavedDescriptionsKey || !mounted || typeof window === 'undefined') return
    
    // Filter only new unsaved descriptions - save all new descriptions
    const unsavedDescriptions = jobDescriptions.filter(jd => 
      jd.id.startsWith('new-')
    )
    
    // If there are unsaved descriptions, save them
    if (unsavedDescriptions.length > 0 || Object.keys(editingValues).length > 0) {
      try {
        sessionStorage.setItem(unsavedDescriptionsKey, JSON.stringify({
          descriptions: unsavedDescriptions,
          editingValues: editingValues
        }))
        console.log('Saved unsaved descriptions:', unsavedDescriptions.length, 'descriptions')
      } catch (e) {
        console.error('Error saving unsaved descriptions:', e)
      }
    } else {
      // Clear storage if no unsaved descriptions
      try {
        sessionStorage.removeItem(unsavedDescriptionsKey)
      } catch (e) {
        console.error('Error removing unsaved descriptions:', e)
      }
    }
  }, [jobDescriptions, editingValues, unsavedChanges, unsavedDescriptionsKey, mounted])

  // Handle visibility changes to ensure data persistence
  useEffect(() => {
    if (typeof window === 'undefined' || !unsavedDescriptionsKey) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (tab switch, minimize, etc.)
        // Force save current state - save all new descriptions
        const unsavedDescriptions = jobDescriptions.filter(jd => 
          jd.id.startsWith('new-')
        )
        
        if (unsavedDescriptions.length > 0 || Object.keys(editingValues).length > 0) {
          try {
            sessionStorage.setItem(unsavedDescriptionsKey, JSON.stringify({
              descriptions: unsavedDescriptions,
              editingValues: editingValues
            }))
          } catch (e) {
            console.error('Error saving on visibility change:', e)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also handle beforeunload to save state
    const handleBeforeUnload = () => {
      const unsavedDescriptions = jobDescriptions.filter(jd => 
        jd.id.startsWith('new-')
      )
      
      if (unsavedDescriptions.length > 0 || Object.keys(editingValues).length > 0) {
        sessionStorage.setItem(unsavedDescriptionsKey, JSON.stringify({
          descriptions: unsavedDescriptions,
          editingValues: editingValues
        }))
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [jobDescriptions, editingValues, unsavedChanges, unsavedDescriptionsKey])

  // Check if values have changed from original
  const hasChanges = (id: string): boolean => {
    const current = editingValues[id]
    const original = originalValues[id]
    
    if (!current || !original) return false
    
    // Compare title and content
    return current.title !== original.title || current.content !== original.content
  }

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
    
    const initialValues = {
      title: newJobDescription.title,
      content: newJobDescription.description
    }
    
    // Initialize editing values for the new description
    setEditingValues({
      ...editingValues,
      [newJobDescription.id]: initialValues
    })
    
    // Store original values for comparison
    setOriginalValues({
      ...originalValues,
      [newJobDescription.id]: initialValues
    })
    
    setJobDescriptions([newJobDescription, ...jobDescriptions])
    setUnsavedChanges(prev => new Set(prev).add(newJobDescription.id))
  }

  const handleToggleExpand = (id: string) => {
    const jobDesc = jobDescriptions.find(jd => jd.id === id)
    if (!jobDesc) return
    
    // Check for unsaved changes before collapsing
    if (jobDesc.isExpanded && jobDesc.isEditing && hasChanges(id)) {
      setCollapseConfirmId(id)
      return
    }

    // No changes, proceed with toggle
    proceedWithToggleExpand(id)
  }
  
  const proceedWithToggleExpand = (id: string) => {
    const jobDesc = jobDescriptions.find(jd => jd.id === id)
    if (!jobDesc) return

    // For new descriptions, behave exactly like cancel button (remove from UI)
    if (id.startsWith('new-')) {
      setJobDescriptions(jobDescriptions.filter(jd => jd.id !== id))
    } else {
      // For existing descriptions, just toggle expand/collapse
      setJobDescriptions(prevDescriptions => 
        prevDescriptions.map((jd) => 
          jd.id === id ? { ...jd, isExpanded: !jd.isExpanded, isEditing: false } : jd
        )
      )
    }
    
    // Clear editing values and unsaved changes when collapsing
    if (jobDesc.isExpanded) {
      if (editingValues[id]) {
        const newEditingValues = { ...editingValues }
        delete newEditingValues[id]
        setEditingValues(newEditingValues)
      }
      if (originalValues[id]) {
        const newOriginalValues = { ...originalValues }
        delete newOriginalValues[id]
        setOriginalValues(newOriginalValues)
      }
      setUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      
      // Hide generate alert for this job description
      setShowGenerateAlert(prev => {
        const newAlerts = { ...prev }
        delete newAlerts[id]
        return newAlerts
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
      
      // Clear original values for deleted item
      if (originalValues[deleteConfirmId]) {
        const newOriginalValues = { ...originalValues }
        delete newOriginalValues[deleteConfirmId]
        setOriginalValues(newOriginalValues)
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
        const newValues = {
          title: jobDescription.title,
          content: result.description || ''
        }
        
        // Store current values for editing
        setEditingValues({
          ...editingValues,
          [id]: newValues
        })
        
        // For new job descriptions, don't update original values after generation
        // This keeps the Save button enabled for generated content
        // For existing descriptions, update original values to match generated content
        const isNewDescription = id.startsWith('new-')
        if (!isNewDescription) {
          setOriginalValues({
            ...originalValues,
            [id]: newValues
          })
        }
        
        // Enter edit mode
        setJobDescriptions(
          jobDescriptions.map((jd) =>
            jd.id === id ? { ...jd, isEditing: true, isExpanded: true } : jd
          )
        )
        
        // Mark as having unsaved changes
        setUnsavedChanges(prev => new Set(prev).add(id))
        
        // Show the alert banner for this specific job description
        setShowGenerateAlert(prev => ({ ...prev, [id]: true }))
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
      const values = {
        title: jobDescription.title,
        content: jobDescription.description,
      }
      
      // Store current values for editing
      setEditingValues({
        ...editingValues,
        [id]: values,
      })
      
      // Store original values for comparison
      setOriginalValues({
        ...originalValues,
        [id]: values,
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
          setJobDescriptions(prevDescriptions =>
            prevDescriptions.map((jd) =>
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
          
          // Clean up editing values for the old temporary ID
          setEditingValues(prev => {
            const newValues = { ...prev }
            delete newValues[id]
            // If the ID changed, we don't need to track it anymore
            return newValues
          })
          
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
      
      // Clear original values
      const newOriginalValues = { ...originalValues }
      delete newOriginalValues[id]
      setOriginalValues(newOriginalValues)
      
      // Remove from unsaved changes
      setUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      
      // Hide generate alert for this job description
      setShowGenerateAlert(prev => {
        const newAlerts = { ...prev }
        delete newAlerts[id]
        return newAlerts
      })
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
    // Check if there are unsaved changes
    if (hasChanges(id)) {
      setCancelConfirmId(id)
      return
    }
    
    // No changes, proceed with cancel
    proceedWithCancel(id)
  }
  
  const proceedWithCancel = (id: string) => {
    // For new descriptions, remove from list entirely
    if (id.startsWith('new-')) {
      setJobDescriptions(jobDescriptions.filter(jd => jd.id !== id))
    } else {
      // For existing descriptions, exit edit mode
      setJobDescriptions(
        jobDescriptions.map((jd) => (jd.id === id ? { ...jd, isEditing: false, isExpanded: jd.isExpanded } : jd))
      )
    }
    
    // Clear editing values
    setEditingValues(prev => {
      const newValues = { ...prev }
      delete newValues[id]
      return newValues
    })
    
    // Clear original values
    setOriginalValues(prev => {
      const newValues = { ...prev }
      delete newValues[id]
      return newValues
    })
    
    // Remove from unsaved changes
    setUnsavedChanges(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    
    // Hide generate alert for this job description
    setShowGenerateAlert(prev => {
      const newAlerts = { ...prev }
      delete newAlerts[id]
      return newAlerts
    })
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
                            !editingValues[jobDescription.id]?.content?.trim() ||
                            !hasChanges(jobDescription.id)
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
                    {/* Generate Alert Banner - Show only for this specific job description */}
                    {showGenerateAlert[jobDescription.id] && (
                      <div className="info-indicator">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Please review the AI-generated job description and make any necessary adjustments before saving.
                        </span>
                      </div>
                    )}
                    
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
                    <div className="space-y-2 relative">
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
                        readOnly={!jobDescription.isEditing || isGenerating[jobDescription.id]}
                      />
                      
                      {/* Generation Loading Overlay */}
                      {isGenerating[jobDescription.id] && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center z-10">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <Sparkles className="h-8 w-8 animate-spin text-primary" />
                            <div className="space-y-1">
                              <p className="text-lg font-medium">Generating job description...</p>
                              <p className="text-sm text-muted-foreground">
                                Please wait while AI creates your job description
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelConfirmId} onOpenChange={() => setCancelConfirmId(null)}>
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
              onClick={() => {
                if (cancelConfirmId) {
                  proceedWithCancel(cancelConfirmId)
                  setCancelConfirmId(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Collapse Confirmation Dialog */}
      <AlertDialog open={!!collapseConfirmId} onOpenChange={() => setCollapseConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Collapse and Discard Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to collapse without saving? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (collapseConfirmId) {
                  proceedWithToggleExpand(collapseConfirmId)
                  setCollapseConfirmId(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Collapse and Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
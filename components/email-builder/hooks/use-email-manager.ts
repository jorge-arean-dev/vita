import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Email, EditingValues, Candidate, EmailTemplate, JobData } from '../types/email-builder.types'
import { getNextEmailCounter, createNewEmail } from '../utils/email-builder.utils'
import { saveEmail, loadSavedEmails, deleteEmail } from '@/app/actions/email-builder'

interface JobEmailBuilderWithRelations {
  id: string
  job_id: string
  candidate_id: string | null
  template: string
  type: string
  title: string
  body: string
  subject?: string
  created_at: string
  updated_at: string
  candidates?: {
    first_name: string | null
    last_name: string | null
  } | null
  email_builder_templates?: {
    display_name: string
  } | null
}

interface UseEmailManagerProps {
  jobData: JobData | null | undefined
  candidates: Candidate[]
  emailTemplates: EmailTemplate[]
  mounted: boolean
  editingValues: EditingValues
  setEditingValues: (values: EditingValues) => void
  unsavedChanges: Set<string>
  setUnsavedChanges: (changes: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  clearEditingState: (id: string) => void
  initializeEditingValues: (email: Email) => void
  emailType: 'candidate' | 'client'
}

interface UseEmailManagerReturn {
  emails: Email[]
  filteredEmails: Email[]
  setEmails: (emails: Email[] | ((prev: Email[]) => Email[])) => void
  isSaving: { [key: string]: boolean }
  isDeleting: { [key: string]: boolean }
  deleteConfirmId: string | null
  setDeleteConfirmId: (id: string | null) => void
  cancelConfirmId: string | null
  setCancelConfirmId: (id: string | null) => void
  handleNewEmail: () => void
  handleToggleExpand: (id: string) => void
  handleSave: (id: string) => Promise<void>
  handleCancel: (id: string) => void
  confirmCancel: () => void
  handleDelete: (id: string) => void
  confirmDelete: () => Promise<void>
  handleCopyToClipboard: (content: string) => Promise<void>
  initializeEmails: (savedUnsavedEmails: Email[], savedExpandedStates: { [key: string]: boolean }, savedEditingValues: EditingValues) => void
}

export const useEmailManager = ({
  jobData,
  candidates,
  emailTemplates,
  mounted,
  editingValues,
  setEditingValues,
  unsavedChanges,
  setUnsavedChanges,
  clearEditingState,
  initializeEditingValues,
  emailType
}: UseEmailManagerProps): UseEmailManagerReturn => {
  const [emails, setEmails] = useState<Email[]>([])
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

  // Filter emails by type
  const filteredEmails = emails.filter(email => email.type === emailType)

  const handleNewEmail = () => {
    const counter = getNextEmailCounter(emails.filter(e => e.type === emailType))
    const newEmail = createNewEmail(jobData, emailType)
    const typeLabel = emailType === 'candidate' ? 'Candidate' : 'Client'
    newEmail.title = `${jobData?.title || 'Job'} - ${typeLabel} Email ${counter}`
    
    // Initialize editing values for the new email
    initializeEditingValues(newEmail)
    
    setEmails([newEmail, ...emails])
  }

  const handleToggleExpand = (id: string) => {
    const email = emails.find(e => e.id === id)
    if (!email) return
    
    // Check for unsaved changes before collapsing
    if (unsavedChanges.has(id) && email.isExpanded && email.isEditing) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to collapse without saving?"
      )
      if (!confirmed) return
    }

    setEmails(prevEmails => 
      prevEmails.map((e) => 
        e.id === id ? { ...e, isExpanded: !e.isExpanded, isEditing: false } : e
      )
    )
    
    // Clear editing values and unsaved changes when collapsing
    if (email.isExpanded) {
      clearEditingState(id)
    }
  }

  const handleSave = async (id: string) => {
    const editingValue = editingValues[id]
    if (!editingValue || !jobData?.id) return
    
    setIsSaving({ ...isSaving, [id]: true })
    
    try {
      // Create form data for server action
      const formData = new FormData()
      formData.append('jobId', jobData.id)
      formData.append('emailType', emailType)
      formData.append('templateId', editingValue.templateId)
      formData.append('title', editingValue.title)
      formData.append('subject', editingValue.subject)
      formData.append('body', editingValue.content)
      
      if (editingValue.candidateId && editingValue.candidateId !== '') {
        formData.append('candidateId', editingValue.candidateId)
      }
      
      // Call server action to save email
      const result = await saveEmail(formData)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      
      // Update local state
      setEmails(prevEmails =>
        prevEmails.map((e) =>
          e.id === id
            ? {
                ...e,
                // If this was a new email, update with the database ID
                id: result.data?.id || e.id,
                title: editingValue.title,
                candidate_id: editingValue.candidateId || null,
                candidate_name: candidates.find(c => c.id === editingValue.candidateId)?.name || null,
                template_id: editingValue.templateId || null,
                template_name: emailTemplates.find(t => t.id === editingValue.templateId)?.name || null,
                subject: editingValue.subject,
                content: editingValue.content,
                isEditing: false,
                isExpanded: e.isExpanded,
                updated_at: new Date().toISOString(),
              }
            : e,
        ),
      )
      
      toast({
        title: "Success",
        description: "Email saved successfully.",
      })
      
      // Clear editing state
      clearEditingState(id)
      
    } catch (error) {
      console.error("Error saving email:", error)
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
    const email = emails.find(e => e.id === id)
    
    // For new emails, check if user has made changes
    if (id.startsWith('new-') && email) {
      const hasChanges = 
        editingValues[id]?.title?.trim() !== email.title ||
        editingValues[id]?.content?.trim() ||
        editingValues[id]?.subject?.trim() ||
        editingValues[id]?.candidateId ||
        editingValues[id]?.templateId ||
        editingValues[id]?.customPrompt?.trim()
      
      if (hasChanges) {
        // Show confirmation dialog for new emails with changes
        setCancelConfirmId(id)
        return
      } else {
        // Remove the new empty email directly
        setEmails(emails.filter(e => e.id !== id))
      }
    } else {
      // Cancel editing without saving for existing emails
      setEmails(
        emails.map((e) => (e.id === id ? { ...e, isEditing: false, isExpanded: e.isExpanded } : e))
      )
    }
    
    // Clear editing state
    clearEditingState(id)
  }

  const confirmCancel = () => {
    if (!cancelConfirmId) return
    
    // Remove the new email completely
    setEmails(emails.filter(e => e.id !== cancelConfirmId))
    
    // Clear editing state
    clearEditingState(cancelConfirmId)
    
    // Clear from sessionStorage completely - remove both the email and its editing values
    if (typeof window !== 'undefined' && jobData?.id) {
      const storageKey = `email-builder-unsaved-${jobData.id}`
      const stored = sessionStorage.getItem(storageKey)
      if (stored) {
        try {
          const parsedData = JSON.parse(stored)
          const updatedEmails = parsedData.emails?.filter((e: Email) => e.id !== cancelConfirmId) || []
          
          // Also remove from editing values
          const updatedEditingValues = { ...parsedData.editingValues }
          delete updatedEditingValues[cancelConfirmId]
          
          if (updatedEmails.length === 0 && Object.keys(updatedEditingValues).length === 0) {
            // If no emails left, remove the entire storage entry
            sessionStorage.removeItem(storageKey)
          } else {
            // Update with filtered data
            sessionStorage.setItem(storageKey, JSON.stringify({
              emails: updatedEmails,
              editingValues: updatedEditingValues
            }))
          }
        } catch (error) {
          console.error('Error updating sessionStorage:', error)
          // Fallback: clear the entire storage for this job
          sessionStorage.removeItem(storageKey)
        }
      }
    }
    
    setCancelConfirmId(null)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    
    setIsDeleting({ ...isDeleting, [deleteConfirmId]: true })
    
    try {
      // If it's not a new email (has been saved to database), delete from database
      if (!deleteConfirmId.startsWith('new-')) {
        const result = await deleteEmail(deleteConfirmId)
        
        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
          return
        }
      }
      
      // Remove from local state
      setEmails(emails.filter((e) => e.id !== deleteConfirmId))
      
      // Clear editing state
      clearEditingState(deleteConfirmId)
      
      toast({
        title: "Success",
        description: "Email deleted successfully.",
      })
      
      setDeleteConfirmId(null)
    } catch (error) {
      console.error("Error deleting email:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting({ ...isDeleting, [deleteConfirmId]: false })
    }
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

  const initializeEmails = async (
    savedUnsavedEmails: Email[], 
    savedExpandedStates: { [key: string]: boolean }, 
    savedEditingValues: EditingValues
  ) => {
    if (!jobData?.id) return
    
    try {
      // Load saved emails from database
      const result = await loadSavedEmails(jobData.id)
      
      let savedEmails: Email[] = []
      if (result.success && result.data) {
        savedEmails = result.data.map((dbEmail: JobEmailBuilderWithRelations) => ({
          id: dbEmail.id,
          job_id: dbEmail.job_id,
          title: dbEmail.title,
          type: dbEmail.type as 'candidate' | 'client',
          candidate_id: dbEmail.candidate_id || null,
          candidate_name: dbEmail.candidates?.first_name && dbEmail.candidates?.last_name 
            ? `${dbEmail.candidates.first_name} ${dbEmail.candidates.last_name}` 
            : null,
          template_id: dbEmail.template || null,
          template_name: dbEmail.email_builder_templates?.display_name || null,
          subject: dbEmail.subject || dbEmail.body.split('\n\n')[0].replace('Subject: ', ''),
          content: dbEmail.subject ? dbEmail.body : dbEmail.body.split('\n\n').slice(1).join('\n\n'),
          created_at: dbEmail.created_at,
          updated_at: dbEmail.updated_at,
          isExpanded: savedExpandedStates[dbEmail.id] ?? false,
          isEditing: false
        }))
      }
      
      // Add saved unsaved emails (new emails not yet saved to DB)
      const allEmails = [...savedUnsavedEmails, ...savedEmails]
      setEmails(allEmails)
      
      // Restore editing values
      if (Object.keys(savedEditingValues).length > 0) {
        setEditingValues(savedEditingValues)
        setUnsavedChanges(new Set(Object.keys(savedEditingValues)))
      }
    } catch (error) {
      console.error('Error loading saved emails:', error)
      toast({
        title: "Error",
        description: "Failed to load saved emails.",
        variant: "destructive",
      })
      
      // Fallback to just unsaved emails
      setEmails(savedUnsavedEmails)
      if (Object.keys(savedEditingValues).length > 0) {
        setEditingValues(savedEditingValues)
        setUnsavedChanges(new Set(Object.keys(savedEditingValues)))
      }
    }
  }

  // Reload emails when jobData changes
  useEffect(() => {
    if (!mounted || !jobData?.id) return
    
    const reloadEmails = async () => {
      try {
        const result = await loadSavedEmails(jobData.id)
        
        if (result.success && result.data) {
          const savedEmails: Email[] = result.data.map((dbEmail: JobEmailBuilderWithRelations) => ({
            id: dbEmail.id,
            job_id: dbEmail.job_id,
            title: dbEmail.title,
            type: dbEmail.type as 'candidate' | 'client',
            candidate_id: dbEmail.candidate_id || null,
            candidate_name: dbEmail.candidates?.first_name && dbEmail.candidates?.last_name 
              ? `${dbEmail.candidates.first_name} ${dbEmail.candidates.last_name}` 
              : null,
            template_id: dbEmail.template || null,
            template_name: dbEmail.email_builder_templates?.display_name || null,
            subject: dbEmail.subject || dbEmail.body.split('\n\n')[0].replace('Subject: ', ''),
            content: dbEmail.subject ? dbEmail.body : dbEmail.body.split('\n\n').slice(1).join('\n\n'),
            created_at: dbEmail.created_at,
            updated_at: dbEmail.updated_at,
            isExpanded: false,
            isEditing: false
          }))
          
          setEmails(prev => {
            // Keep unsaved new emails and combine with loaded emails
            const unsavedNewEmails = prev.filter(email => email.id.startsWith('new-'))
            return [...unsavedNewEmails, ...savedEmails]
          })
        }
      } catch (error) {
        console.error('Error reloading emails:', error)
      }
    }
    
    reloadEmails()
  }, [jobData?.id, mounted])

  return {
    emails,
    filteredEmails,
    setEmails,
    isSaving,
    isDeleting,
    deleteConfirmId,
    setDeleteConfirmId,
    cancelConfirmId,
    setCancelConfirmId,
    handleNewEmail,
    handleToggleExpand,
    handleSave,
    handleCancel,
    confirmCancel,
    handleDelete,
    confirmDelete,
    handleCopyToClipboard,
    initializeEmails
  }
}
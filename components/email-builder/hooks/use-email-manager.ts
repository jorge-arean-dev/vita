import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Email, EditingValues, Candidate, EmailTemplate, JobData } from '../types/email-builder.types'
import { getNextEmailCounter, createNewEmail, getMockExistingEmails } from '../utils/email-builder.utils'

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
}

interface UseEmailManagerReturn {
  emails: Email[]
  setEmails: (emails: Email[] | ((prev: Email[]) => Email[])) => void
  isSaving: { [key: string]: boolean }
  isDeleting: { [key: string]: boolean }
  deleteConfirmId: string | null
  setDeleteConfirmId: (id: string | null) => void
  handleNewEmail: () => void
  handleToggleExpand: (id: string) => void
  handleSave: (id: string) => Promise<void>
  handleCancel: (id: string) => void
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
  initializeEditingValues
}: UseEmailManagerProps): UseEmailManagerReturn => {
  const [emails, setEmails] = useState<Email[]>([])
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleNewEmail = () => {
    const counter = getNextEmailCounter(emails)
    const newEmail = createNewEmail(jobData)
    newEmail.title = `${jobData?.title || 'Job'} - Email ${counter}`
    
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
      // TODO: Implement API call
      console.log("Saving email:", { id, ...editingValue })
      
      // Update local state
      setEmails(
        emails.map((e) =>
          e.id === id
            ? {
                ...e,
                title: editingValue.title,
                candidate_id: editingValue.candidateId,
                candidate_name: candidates.find(c => c.id === editingValue.candidateId)?.name || null,
                template_id: editingValue.templateId,
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
    
    // Check if this is a new unsaved email with no content
    if (id.startsWith('new-') && email && !email.content && (!editingValues[id]?.content || editingValues[id]?.content.trim() === '')) {
      // Remove the new empty email
      setEmails(emails.filter(e => e.id !== id))
    } else {
      // Cancel editing without saving
      setEmails(
        emails.map((e) => (e.id === id ? { ...e, isEditing: false, isExpanded: e.isExpanded } : e))
      )
    }
    
    // Clear editing state
    clearEditingState(id)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    
    setIsDeleting({ ...isDeleting, [deleteConfirmId]: true })
    
    try {
      // TODO: Call API to delete from database if not a new email
      console.log("Deleting email:", deleteConfirmId)
      
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

  const initializeEmails = (
    savedUnsavedEmails: Email[], 
    savedExpandedStates: { [key: string]: boolean }, 
    savedEditingValues: EditingValues
  ) => {
    // Mock some existing emails for demonstration
    const mockExistingEmails = getMockExistingEmails(jobData)
    
    // Initialize with existing emails with state
    const emailsWithState = mockExistingEmails.map(email => ({
      ...email,
      isExpanded: savedExpandedStates[email.id] ?? false,
      isEditing: false
    }))
    
    // Add saved unsaved emails
    const allEmails = [...savedUnsavedEmails, ...emailsWithState]
    setEmails(allEmails)
    
    // Restore editing values
    if (Object.keys(savedEditingValues).length > 0) {
      setEditingValues(savedEditingValues)
      setUnsavedChanges(new Set(Object.keys(savedEditingValues)))
    }
  }

  // Update emails when external props change, but preserve expanded state and new emails
  useEffect(() => {
    if (!mounted) return
    
    setEmails(prev => {
      // Create a map of current expanded states
      const expandedStates = new Map(prev.map(email => [email.id, email.isExpanded]))
      const editingStates = new Map(prev.map(email => [email.id, email.isEditing]))
      
      // Keep all new emails that haven't been saved yet
      const unsavedNewEmails = prev.filter(email => email.id.startsWith('new-'))
      
      // Mock existing emails (in real implementation, this would come from props)
      const mockExistingEmails = getMockExistingEmails(jobData)
      
      // Map existing emails with preserved states
      const updatedExistingEmails = mockExistingEmails.map(email => ({
        ...email,
        isExpanded: expandedStates.get(email.id) ?? false,
        isEditing: editingStates.get(email.id) ?? false
      }))
      
      // Combine unsaved new emails with updated existing ones
      return [...unsavedNewEmails, ...updatedExistingEmails]
    })
  }, [jobData, mounted])

  return {
    emails,
    setEmails,
    isSaving,
    isDeleting,
    deleteConfirmId,
    setDeleteConfirmId,
    handleNewEmail,
    handleToggleExpand,
    handleSave,
    handleCancel,
    handleDelete,
    confirmDelete,
    handleCopyToClipboard,
    initializeEmails
  }
}
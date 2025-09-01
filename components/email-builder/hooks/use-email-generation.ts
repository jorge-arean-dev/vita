import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Email, EditingValues, EmailTemplate, JobData } from '../types/email-builder.types'
import { generateEmail } from '@/app/actions/email-builder'

interface UseEmailGenerationProps {
  candidateEmailTemplates: EmailTemplate[]
  clientEmailTemplates: EmailTemplate[]
  jobData: JobData | null | undefined
}

interface UseEmailGenerationReturn {
  isGenerating: { [key: string]: boolean }
  showGenerateAlert: { [key: string]: boolean }
  overwriteConfirmId: string | null
  setOverwriteConfirmId: (id: string | null) => void
  handleGenerate: (id: string, email: Email, editingValues: EditingValues, setEditingValues: (values: EditingValues) => void, setUnsavedChanges: (fn: (prev: Set<string>) => Set<string>) => void) => Promise<void>
  proceedWithGeneration: (id: string, editingValues: EditingValues, setEditingValues: (values: EditingValues) => void, setUnsavedChanges: (fn: (prev: Set<string>) => Set<string>) => void) => Promise<void>
  generateClientEmail: (candidateId: string, templateId: string) => Promise<string>
}

export const useEmailGeneration = ({
  candidateEmailTemplates,
  clientEmailTemplates,
  jobData
}: UseEmailGenerationProps): UseEmailGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({})
  const [showGenerateAlert, setShowGenerateAlert] = useState<{ [key: string]: boolean }>({})
  const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

  // Helper function to check if a template is custom
  const isCustomTemplate = (templateId: string) => {
    const allTemplates = [...candidateEmailTemplates, ...clientEmailTemplates]
    const template = allTemplates.find(t => t.id === templateId)
    return template?.templateName === 'custom_candidate' || template?.templateName === 'custom_client'
  }

  const handleGenerate = async (
    id: string, 
    email: Email, 
    editingValues: EditingValues,
    setEditingValues: (values: EditingValues) => void,
    setUnsavedChanges: (fn: (prev: Set<string>) => Set<string>) => void
  ) => {
    const editingValue = editingValues[id]
    if (!editingValue?.templateId) {
      toast({
        title: "Error",
        description: "Please select an email template.",
        variant: "destructive",
      })
      return
    }
    
    // If custom prompt is selected, ensure the custom prompt is not empty
    if (isCustomTemplate(editingValue.templateId) && !editingValue.customPrompt?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom prompt for AI generation.",
        variant: "destructive",
      })
      return
    }
    
    // Get current content (from editing values if in edit mode, or saved content)
    const currentContent = email.isEditing 
      ? (editingValues[id]?.content || email.content)
      : email.content
    
    // Check if content exists and show overwrite confirmation
    if (currentContent && currentContent.trim() !== '') {
      setOverwriteConfirmId(id)
      return
    }
    
    // No content exists, proceed directly with generation
    await proceedWithGeneration(id, editingValues, setEditingValues, setUnsavedChanges)
  }

  const proceedWithGeneration = async (
    id: string, 
    editingValues: EditingValues,
    setEditingValues: (values: EditingValues) => void,
    setUnsavedChanges: (fn: (prev: Set<string>) => Set<string>) => void
  ) => {
    setIsGenerating({ ...isGenerating, [id]: true })
    
    try {
      const editingValue = editingValues[id]
      if (!editingValue || !jobData?.id) return
      
      // Determine email type based on which templates are being used
      const isClientEmail = clientEmailTemplates.some(t => t.id === editingValue.templateId)
      const emailType = isClientEmail ? 'client' : 'candidate'
      
      // Create form data for server action
      const formData = new FormData()
      formData.append('jobId', jobData.id)
      formData.append('emailType', emailType)
      formData.append('templateId', editingValue.templateId)
      
      if (editingValue.candidateId && editingValue.candidateId !== '') {
        formData.append('candidateId', editingValue.candidateId)
      }
      
      // Only send custom prompt if a custom template is selected
      // This prevents old custom prompts from interfering with other templates
      if (isCustomTemplate(editingValue.templateId) && editingValue.customPrompt) {
        formData.append('customPrompt', editingValue.customPrompt)
      }
      
      // Call the server action
      const result = await generateEmail(formData)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      
      if (!result.data) {
        toast({
          title: "Error",
          description: "No email content received from the server.",
          variant: "destructive",
        })
        return
      }
      
      // Update the email with generated content
      setEditingValues({
        ...editingValues,
        [id]: {
          ...editingValue,
          subject: result.data.subject,
          content: result.data.body
        }
      })
      
      // Mark as having unsaved changes
      setUnsavedChanges(prev => new Set(prev).add(id))
      
      // Show the alert banner for this specific email
      setShowGenerateAlert(prev => ({ ...prev, [id]: true }))
      
      toast({
        title: "Success",
        description: "Email generated successfully.",
      })
    } catch (error) {
      console.error("Error generating email:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during generation.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating({ ...isGenerating, [id]: false })
    }
  }

  const generateClientEmail = async (candidateId: string, templateId: string): Promise<string> => {
    if (!jobData?.id) {
      throw new Error('Job data is required for email generation')
    }
    
    try {
      // Create form data for server action
      const formData = new FormData()
      formData.append('jobId', jobData.id)
      formData.append('emailType', 'client')
      formData.append('templateId', templateId)
      formData.append('candidateId', candidateId)
      
      // Call the server action
      const result = await generateEmail(formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (!result.data) {
        throw new Error('No email content received from the server')
      }
      
      // Return combined subject and body for compatibility
      return `Subject: ${result.data.subject}\n\n${result.data.body}`
    } catch (error) {
      console.error('Error generating client email:', error)
      throw error
    }
  }

  return {
    isGenerating,
    showGenerateAlert,
    overwriteConfirmId,
    setOverwriteConfirmId,
    handleGenerate,
    proceedWithGeneration,
    generateClientEmail
  }
}
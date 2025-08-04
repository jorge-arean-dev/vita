import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Email, EditingValues, Candidate, EmailTemplate, JobData } from '../types/email-builder.types'
import { generateMockEmailContent, generateMockClientEmailContent } from '../utils/email-builder.utils'

interface UseEmailGenerationProps {
  candidates: Candidate[]
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
  candidates,
  candidateEmailTemplates,
  clientEmailTemplates,
  jobData
}: UseEmailGenerationProps): UseEmailGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({})
  const [showGenerateAlert, setShowGenerateAlert] = useState<{ [key: string]: boolean }>({})
  const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

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
    if (editingValue.templateId === 'custom-prompt' && !editingValue.customPrompt?.trim()) {
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
      if (!editingValue) return
      
      // TODO: Implement API call to generate email
      console.log("Generating email:", { 
        emailId: id, 
        candidateId: editingValue.candidateId, 
        templateId: editingValue.templateId,
        customPrompt: editingValue.customPrompt,
        jobData 
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if this is a client email by looking at which templates are being used
      const isClientEmail = clientEmailTemplates.some(t => t.id === editingValue.templateId)
      
      let subject: string
      let content: string
      
      if (isClientEmail) {
        // Generate client email content
        content = generateMockClientEmailContent(
          editingValue.templateId,
          editingValue.candidateId,
          candidates,
          clientEmailTemplates,
          jobData,
          editingValue.customPrompt
        )
        // Extract subject from content (first line)
        const lines = content.split('\n')
        subject = lines[0].replace('Subject: ', '')
        content = lines.slice(2).join('\n') // Remove subject line from content
      } else {
        // Generate candidate email content
        const result = generateMockEmailContent(
          editingValue.templateId,
          editingValue.candidateId,
          editingValue.customPrompt,
          candidates,
          candidateEmailTemplates,
          jobData
        )
        subject = result.subject
        content = result.content
      }
      
      // Update the email with generated content
      setEditingValues({
        ...editingValues,
        [id]: {
          ...editingValue,
          subject,
          content
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
    // TODO: Implement API call to generate client email
    console.log("Generating client email:", { candidateId, templateId, jobData })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return generateMockClientEmailContent(
      templateId,
      candidateId,
      candidates,
      clientEmailTemplates,
      jobData
    )
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
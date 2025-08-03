"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Copy, 
  Sparkles, 
  Save, 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  Plus, 
  X, 
  AlertCircle, 
  Edit 
} from "lucide-react"
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
import { useToast } from "@/components/ui/use-toast"

interface Candidate {
  id: string
  name: string
  email?: string
}

interface EmailTemplate {
  id: string
  name: string
  description: string
}

interface Email {
  id: string
  job_id: string
  title: string
  type: 'candidate' | 'client'
  candidate_id: string | null
  candidate_name: string | null
  template_id: string | null
  template_name: string | null
  subject: string
  content: string
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
  initialNotes?: string
}

interface EmailBuilderProps {
  jobData?: JobData | null
}

export default function EmailBuilder({ jobData }: EmailBuilderProps) {
  const [candidateEmails, setCandidateEmails] = useState<Email[]>([])
  const [editingValues, setEditingValues] = useState<{ 
    [key: string]: { 
      title: string
      candidateId: string
      templateId: string
      customPrompt: string
      subject: string
      content: string
    } 
  }>({})
  const [showGenerateAlert, setShowGenerateAlert] = useState<{ [key: string]: boolean }>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({})
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({})
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({})
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  // Legacy state for old email generation (keeping for backward compatibility)
  const [candidateSelectedCandidate, setCandidateSelectedCandidate] = useState("")
  const [candidateSelectedTemplate, setCandidateSelectedTemplate] = useState("")
  const [candidateEmailMessage, setCandidateEmailMessage] = useState("")
  const [candidateIsGenerating, setCandidateIsGenerating] = useState(false)
  
  // Client Email State (keeping for later)
  const [clientSelectedCandidate, setClientSelectedCandidate] = useState("")
  const [clientSelectedTemplate, setClientSelectedTemplate] = useState("")
  const [clientEmailMessage, setClientEmailMessage] = useState("")
  const [clientIsGenerating, setClientIsGenerating] = useState(false)

  // Mock data - in real implementation, this would come from API
  const candidates: Candidate[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com" },
    { id: "4", name: "Sarah Wilson", email: "sarah@example.com" },
    { id: "5", name: "David Brown", email: "david@example.com" }
  ]

  const candidateEmailTemplates: EmailTemplate[] = [
    { id: "first-outreach", name: "First-time Outreach", description: "Initial contact with a potential candidate" },
    { id: "follow-up", name: "Follow-up Message", description: "Follow up after initial contact" },
    { id: "interview-scheduling", name: "Interview Scheduling", description: "Schedule interview with interested candidate" },
    { id: "positive-feedback", name: "Positive Interview Feedback", description: "Next steps after successful interview" },
    { id: "rejection", name: "Rejection", description: "Polite rejection after interview process" },
    { id: "custom-prompt", name: "✨ Custom Prompt", description: "Create your own AI generation instructions" }
  ]

  const clientEmailTemplates: EmailTemplate[] = [
    { id: "candidate-presentation", name: "Candidate Presentation", description: "Present qualified candidate to client" },
    { id: "interview-scheduling", name: "Interview Scheduling", description: "Schedule client interview with candidate" },
    { id: "offer-negotiation", name: "Offer Negotiation", description: "Discuss compensation and terms" },
    { id: "final-submission", name: "Final Submission", description: "Submit candidate for final hiring decision" },
    { id: "follow-up", name: "Follow-up", description: "Follow up on candidate status" }
  ]

  // Storage keys
  const expandedStateKey = jobData?.id ? `email-expanded-${jobData.id}` : null
  const unsavedEmailsKey = jobData?.id ? `email-unsaved-${jobData.id}` : null

  // Initialize only once on mount
  useEffect(() => {
    setMounted(true)
    // Try to restore expanded states from sessionStorage
    let savedExpandedStates: { [key: string]: boolean } = {}
    let savedUnsavedEmails: Email[] = []
    let savedEditingValues: { [key: string]: { title: string; candidateId: string; templateId: string; customPrompt: string; subject: string; content: string } } = {}
    
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
      
      // Restore unsaved emails
      if (unsavedEmailsKey) {
        try {
          const savedUnsaved = sessionStorage.getItem(unsavedEmailsKey)
          if (savedUnsaved) {
            const parsed = JSON.parse(savedUnsaved)
            savedUnsavedEmails = parsed.emails || []
            savedEditingValues = parsed.editingValues || {}
            console.log('Restored unsaved emails:', savedUnsavedEmails.length, 'emails')
          }
        } catch (e) {
          console.error('Error loading unsaved emails:', e)
        }
      }
    }
    
    // Mock some existing emails for demonstration
    const mockExistingEmails: Email[] = [
      {
        id: "existing-1",
        job_id: jobData?.id || '',
        title: `${jobData?.title || 'Job'} - First Outreach to John`,
        type: 'candidate',
        candidate_id: "1",
        candidate_name: "John Doe",
        template_id: "first-outreach",
        template_name: "First-time Outreach",
        subject: `Exciting ${jobData?.title || 'Software Engineer'} Opportunity at ${jobData?.companyName || 'Our Company'}`,
        content: "Hi John...",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isExpanded: savedExpandedStates["existing-1"] ?? false,
        isEditing: false
      }
    ]
    
    // Initialize with existing emails with state
    const emailsWithState = mockExistingEmails.map(email => ({
      ...email,
      isExpanded: savedExpandedStates[email.id] ?? false,
      isEditing: false
    }))
    
    // Add saved unsaved emails
    const allEmails = [...savedUnsavedEmails, ...emailsWithState]
    setCandidateEmails(allEmails)
    
    // Restore editing values
    if (Object.keys(savedEditingValues).length > 0) {
      setEditingValues(savedEditingValues)
      setUnsavedChanges(new Set(Object.keys(savedEditingValues)))
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount
  
  // Update candidate emails when external props change, but preserve expanded state and new emails
  useEffect(() => {
    if (!mounted) return
    
    setCandidateEmails(prev => {
      // Create a map of current expanded states
      const expandedStates = new Map(prev.map(email => [email.id, email.isExpanded]))
      const editingStates = new Map(prev.map(email => [email.id, email.isEditing]))
      
      // Keep all new emails that haven't been saved yet
      const unsavedNewEmails = prev.filter(email => email.id.startsWith('new-'))
      
      // Mock existing emails (in real implementation, this would come from props)
      const mockExistingEmails: Email[] = [
        {
          id: "existing-1",
          job_id: jobData?.id || '',
          title: `${jobData?.title || 'Job'} - First Outreach to John`,
          type: 'candidate',
          candidate_id: "1",
          candidate_name: "John Doe",
          template_id: "first-outreach",
          template_name: "First-time Outreach",
          subject: `Exciting ${jobData?.title || 'Software Engineer'} Opportunity at ${jobData?.companyName || 'Our Company'}`,
          content: "Hi John...",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isExpanded: false,
          isEditing: false
        }
      ]
      
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

  // Save expanded states to sessionStorage whenever they change
  useEffect(() => {
    if (!expandedStateKey || !mounted || typeof window === 'undefined') return
    
    const expandedStates: { [key: string]: boolean } = {}
    candidateEmails.forEach(email => {
      if (email.isExpanded) {
        expandedStates[email.id] = true
      }
    })
    
    try {
      sessionStorage.setItem(expandedStateKey, JSON.stringify(expandedStates))
    } catch (e) {
      console.error('Error saving expanded states:', e)
    }
  }, [candidateEmails, expandedStateKey, mounted])

  // Save unsaved emails to sessionStorage
  useEffect(() => {
    if (!unsavedEmailsKey || !mounted || typeof window === 'undefined') return
    
    // Filter only new unsaved emails - save all new emails
    const unsavedEmails = candidateEmails.filter(email => 
      email.id.startsWith('new-')
    )
    
    // If there are unsaved emails, save them
    if (unsavedEmails.length > 0 || Object.keys(editingValues).length > 0) {
      try {
        sessionStorage.setItem(unsavedEmailsKey, JSON.stringify({
          emails: unsavedEmails,
          editingValues: editingValues
        }))
        console.log('Saved unsaved emails:', unsavedEmails.length, 'emails')
      } catch (e) {
        console.error('Error saving unsaved emails:', e)
      }
    } else {
      // Clear storage if no unsaved emails
      try {
        sessionStorage.removeItem(unsavedEmailsKey)
      } catch (e) {
        console.error('Error removing unsaved emails:', e)
      }
    }
  }, [candidateEmails, editingValues, unsavedChanges, unsavedEmailsKey, mounted])

  // Handle visibility changes to ensure data persistence
  useEffect(() => {
    if (typeof window === 'undefined' || !unsavedEmailsKey) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (tab switch, minimize, etc.)
        // Force save current state - save all new emails
        const unsavedEmails = candidateEmails.filter(email => 
          email.id.startsWith('new-')
        )
        
        if (unsavedEmails.length > 0 || Object.keys(editingValues).length > 0) {
          try {
            sessionStorage.setItem(unsavedEmailsKey, JSON.stringify({
              emails: unsavedEmails,
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
      const unsavedEmails = candidateEmails.filter(email => 
        email.id.startsWith('new-')
      )
      
      if (unsavedEmails.length > 0 || Object.keys(editingValues).length > 0) {
        sessionStorage.setItem(unsavedEmailsKey, JSON.stringify({
          emails: unsavedEmails,
          editingValues: editingValues
        }))
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [candidateEmails, editingValues, unsavedChanges, unsavedEmailsKey])

  // Get next counter for email title
  const getNextEmailCounter = () => {
    const existingCounts = candidateEmails
      .map(email => {
        const match = email.title.match(/email (\d+)$/i)
        return match ? parseInt(match[1]) : 0
      })
      .filter(count => count > 0)
    
    return existingCounts.length > 0 ? Math.max(...existingCounts) + 1 : 1
  }

  const handleNewEmail = () => {
    const counter = getNextEmailCounter()
    const newEmail: Email = {
      id: `new-${Date.now()}`,
      job_id: jobData?.id || '',
      title: `${jobData?.title || 'Job'} - Email ${counter}`,
      type: 'candidate',
      candidate_id: null,
      candidate_name: null,
      template_id: null,
      template_name: null,
      subject: "",
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isExpanded: true,
      isEditing: true,
    }
    
    // Initialize editing values for the new email
    setEditingValues({
      ...editingValues,
      [newEmail.id]: {
        title: newEmail.title,
        candidateId: '',
        templateId: '',
        customPrompt: '',
        subject: newEmail.subject,
        content: newEmail.content
      }
    })
    
    setCandidateEmails([newEmail, ...candidateEmails])
    setUnsavedChanges(prev => new Set(prev).add(newEmail.id))
  }

  const handleToggleExpand = (id: string) => {
    const email = candidateEmails.find(e => e.id === id)
    if (!email) return
    
    // Check for unsaved changes before collapsing
    if (unsavedChanges.has(id) && email.isExpanded && email.isEditing) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to collapse without saving?"
      )
      if (!confirmed) return
    }

    setCandidateEmails(prevEmails => 
      prevEmails.map((e) => 
        e.id === id ? { ...e, isExpanded: !e.isExpanded, isEditing: false } : e
      )
    )
    
    // Clear editing values and unsaved changes when collapsing
    if (email.isExpanded) {
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
      // TODO: Call API to delete from database if not a new email
      console.log("Deleting email:", deleteConfirmId)
      
      setCandidateEmails(candidateEmails.filter((e) => e.id !== deleteConfirmId))
      
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

  const handleEdit = (id: string) => {
    const email = candidateEmails.find((e) => e.id === id)
    if (email) {
      // Store current values for editing
      setEditingValues({
        ...editingValues,
        [id]: {
          title: email.title,
          candidateId: email.candidate_id || '',
          templateId: email.template_id || '',
          customPrompt: '',
          subject: email.subject,
          content: email.content,
        },
      })
      // Set editing mode
      setCandidateEmails(
        candidateEmails.map((e) => (e.id === id ? { ...e, isEditing: true, isExpanded: true } : e))
      )
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
      setCandidateEmails(
        candidateEmails.map((e) =>
          e.id === id
            ? {
                ...e,
                title: editingValue.title,
                candidate_id: editingValue.candidateId,
                candidate_name: candidates.find(c => c.id === editingValue.candidateId)?.name || null,
                template_id: editingValue.templateId,
                template_name: candidateEmailTemplates.find(t => t.id === editingValue.templateId)?.name || null,
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
      
      // Hide generate alert
      setShowGenerateAlert(prev => {
        const newAlerts = { ...prev }
        delete newAlerts[id]
        return newAlerts
      })
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
    const email = candidateEmails.find(e => e.id === id)
    
    // Check if this is a new unsaved email with no content
    if (id.startsWith('new-') && email && !email.content && (!editingValues[id]?.content || editingValues[id]?.content.trim() === '')) {
      // Remove the new empty email
      setCandidateEmails(candidateEmails.filter(e => e.id !== id))
    } else {
      // Cancel editing without saving
      setCandidateEmails(
        candidateEmails.map((e) => (e.id === id ? { ...e, isEditing: false, isExpanded: e.isExpanded } : e))
      )
    }
    
    // Clear editing values
    setEditingValues(prev => {
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
    
    // Hide generate alert
    setShowGenerateAlert(prev => {
      const newAlerts = { ...prev }
      delete newAlerts[id]
      return newAlerts
    })
  }

  const handleGenerate = async (id: string) => {
    const email = candidateEmails.find(e => e.id === id)
    if (!email) return
    
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
    
    await proceedWithGeneration(id)
  }

  const proceedWithGeneration = async (id: string) => {
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
      
      const candidate = candidates.find(c => c.id === editingValue.candidateId)
      const template = candidateEmailTemplates.find(t => t.id === editingValue.templateId)
      
      let mockSubject = ""
      let mockContent = ""
      
      if (editingValue.templateId === 'custom-prompt') {
        // Handle custom prompt generation
        mockSubject = `Custom Email${candidate ? ` - ${candidate.name}` : ''}`
        mockContent = `[AI-generated email based on custom prompt: "${editingValue.customPrompt}"]

${candidate ? `Hi ${candidate.name},` : 'Hi there,'}

This email was generated using your custom prompt: "${editingValue.customPrompt}"

${candidate ? `Selected candidate: ${candidate.name} (${candidate.email})` : ''}
Job: ${jobData?.title || 'Position'} at ${jobData?.companyName || 'Company'}

[Custom AI-generated content would appear here based on your specific prompt and the candidate/job context]

Best regards,
[Your Name]`
      } else {
        // Handle predefined template generation
        switch (editingValue.templateId) {
        case "first-outreach":
          mockSubject = `Exciting ${jobData?.title || 'Software Engineer'} Opportunity at ${jobData?.companyName || 'Our Company'}`
          mockContent = `Hi ${candidate?.name},

I hope this message finds you well. I came across your profile and was impressed by your background in software development.

We have an exciting ${jobData?.title || 'Software Engineer'} position available at ${jobData?.companyName || 'our company'} that I believe would be a great fit for your skills and experience.

The role offers:
• Competitive compensation package
• Flexible working arrangements
• Growth opportunities in a dynamic team
• Cutting-edge technology stack

Would you be interested in learning more about this opportunity? I'd love to schedule a brief call to discuss the details and answer any questions you might have.

Looking forward to hearing from you!

Best regards,
[Your Name]`
          break
          
        case "follow-up":
          mockSubject = `Following up on ${jobData?.title || 'Software Engineer'} Opportunity`
          mockContent = `Hi ${candidate?.name},

I wanted to follow up on my previous message regarding the ${jobData?.title || 'Software Engineer'} position at ${jobData?.companyName || 'our company'}.

I understand you might be busy, but I wanted to make sure you had a chance to consider this opportunity. The role is still available and I believe your background would be an excellent match.

If you're interested or have any questions, please don't hesitate to reach out. I'm happy to provide more details about the position, the team, or the company.

Best regards,
[Your Name]`
          break
          
          default:
            mockSubject = `${template?.name} - ${candidate?.name}`
            mockContent = `Generated email for ${template?.name} template...`
        }
      }
      
      // Update the email with generated content
      setEditingValues({
        ...editingValues,
        [id]: {
          ...editingValue,
          subject: mockSubject,
          content: mockContent
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

  const handleEditingFieldChange = (id: string, field: keyof typeof editingValues[string], value: string) => {
    setEditingValues({
      ...editingValues,
      [id]: {
        ...editingValues[id],
        [field]: value,
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


  const handleGenerateClientEmail = async () => {
    if (!clientSelectedCandidate || !clientSelectedTemplate) {
      return
    }

    setClientIsGenerating(true)
    try {
      // TODO: Implement API call to generate client email
      console.log("Generating client email:", { clientSelectedCandidate, clientSelectedTemplate, jobData })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const candidate = candidates.find(c => c.id === clientSelectedCandidate)
      const template = clientEmailTemplates.find(t => t.id === clientSelectedTemplate)
      
      let mockMessage = ""
      
      switch (clientSelectedTemplate) {
        case "candidate-presentation":
          mockMessage = `Subject: Excellent ${jobData?.title || 'Software Engineer'} Candidate - ${candidate?.name}

Dear [Client Name],

I'm excited to present ${candidate?.name}, an exceptional candidate for the ${jobData?.title || 'Software Engineer'} position at ${jobData?.companyName}.

CANDIDATE OVERVIEW:
${candidate?.name} brings strong technical expertise and proven experience that aligns perfectly with your requirements. Based on our comprehensive evaluation, they demonstrate:

• 5+ years of experience in frontend development with React and TypeScript
• Strong problem-solving skills and attention to detail
• Excellent communication and collaboration abilities
• Proven track record of delivering high-quality software solutions
• Cultural fit with your team's values and working style

KEY HIGHLIGHTS:
• Successfully led frontend development for 3 major product launches
• Experience with modern development practices including CI/CD and testing
• Strong background in performance optimization and scalability
• Available to start within 2-3 weeks notice period

EVALUATION SUMMARY:
• Technical Assessment: Excellent (4.5/5)
• Communication Skills: Strong (4/5)
• Cultural Fit: Excellent (4.5/5)
• Overall Rating: Highly Recommended

COMPENSATION EXPECTATIONS:
[Salary range based on candidate discussion]

NEXT STEPS:
I recommend scheduling an interview at your earliest convenience. ${candidate?.name} is actively interviewing with other companies, so I suggest moving quickly to secure this exceptional talent.

Please let me know your availability for an interview, and I'll coordinate the scheduling.

Best regards,
[Your Name]`
          break
          
        case "interview-scheduling":
          mockMessage = `Subject: Interview Scheduling - ${candidate?.name} for ${jobData?.title || 'Software Engineer'} Position

Dear [Client Name],

Following your positive feedback on ${candidate?.name}'s profile, I'd like to coordinate the interview process.

CANDIDATE: ${candidate?.name}
POSITION: ${jobData?.title || 'Software Engineer'}
COMPANY: ${jobData?.companyName}

INTERVIEW LOGISTICS:
I've confirmed ${candidate?.name}'s availability for the following times:

Option 1: [Date] from [Time] to [Time]
Option 2: [Date] from [Time] to [Time]
Option 3: [Date] from [Time] to [Time]

INTERVIEW FORMAT:
I recommend a 60-minute video interview covering:
• Technical background and experience (20 mins)
• Problem-solving and case studies (20 mins)
• Cultural fit and team dynamics (15 mins)
• Q&A and next steps (5 mins)

Please confirm your preferred time slot, and I'll send calendar invitations to all participants.

Best regards,
[Your Name]`
          break
          
        default:
          mockMessage = `Generated client email for ${template?.name} template...`
      }
      
      setClientEmailMessage(mockMessage)
    } catch (error) {
      console.error("Error generating client email:", error)
    } finally {
      setClientIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Success",
      description: "Copied to clipboard",
    })
  }

  const handleSaveOldEmail = (emailType: 'candidate' | 'client') => {
    const emailData = emailType === 'candidate' 
      ? { type: 'candidate', candidate: candidateSelectedCandidate, template: candidateSelectedTemplate, message: candidateEmailMessage }
      : { type: 'client', candidate: clientSelectedCandidate, template: clientSelectedTemplate, message: clientEmailMessage }
    
    console.log("Saving email:", emailData)
    // TODO: Implement save logic
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="border-none">
        <CardHeader>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Email Builder</h2>
            <p className="text-muted-foreground">Create professional outreach, follow-up, and client communication emails with AI assistance to save time and improve response rates.</p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="candidate-emails" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="candidate-emails">Candidate Emails</TabsTrigger>
              <TabsTrigger value="client-emails">Client Emails</TabsTrigger>
            </TabsList>

            {/* Candidate Emails Tab */}
            <TabsContent value="candidate-emails">
              <div className="space-y-6">
                {/* Header with New button */}
                <div className="pb-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base font-medium">Candidate Outreach</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate professional emails for candidate outreach and communication
                      </p>
                    </div>
                    <Button onClick={handleNewEmail} className="gap-2">
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                  </div>
                </div>

                {/* Email Cards List */}
                <div className="space-y-4">
                  {candidateEmails.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted p-3 mb-4">
                          <Sparkles className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No emails created yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first email to get started.
                        </p>
                        <Button onClick={handleNewEmail} className="gap-2">
                          <Plus className="h-4 w-4" />
                          New Email
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    candidateEmails.map((email) => (
                      <Card key={email.id} className="w-full">
                        <CardHeader className={email.isExpanded ? "pb-3" : "py-0"}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {/* Collapse/Expand Toggle */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleExpand(email.id)}
                                className="h-8 w-8 p-0"
                                aria-label={email.isExpanded ? "Collapse" : "Expand"}
                              >
                                {email.isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>

                              {/* Email Title */}
                              {email.isEditing && email.isExpanded ? (
                                <div className="flex-1 mr-6">
                                  <Input
                                    value={editingValues[email.id]?.title || email.title}
                                    onChange={(e) => handleEditingTitleChange(email.id, e.target.value)}
                                    className="text-lg font-normal p-2 h-auto focus-visible:ring-0"
                                    placeholder="Enter email title..."
                                  />
                                </div>
                              ) : (
                                <h3 className="text-lg font-semibold">{email.title}</h3>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              {!email.isExpanded ? (
                                // Collapsed view - only delete button
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(email.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  aria-label="Delete email"
                                  disabled={isDeleting[email.id]}
                                >
                                  {isDeleting[email.id] ? (
                                    <Trash2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              ) : email.isEditing ? (
                                // Edit Mode Buttons
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerate(email.id)}
                                    className="gap-2"
                                    disabled={
                                      isGenerating[email.id] || 
                                      isSaving[email.id] ||
                                      !editingValues[email.id]?.templateId ||
                                      (editingValues[email.id]?.templateId === 'custom-prompt' && !editingValues[email.id]?.customPrompt?.trim())
                                    }
                                  >
                                    {isGenerating[email.id] ? (
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
                                    onClick={() => handleSave(email.id)}
                                    size="sm"
                                    className="gap-2"
                                    disabled={
                                      isSaving[email.id] || 
                                      isGenerating[email.id] ||
                                      !editingValues[email.id]?.title?.trim()
                                    }
                                  >
                                    {isSaving[email.id] ? (
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
                                    onClick={() => handleCancel(email.id)}
                                    className="gap-2"
                                    disabled={isSaving[email.id] || isGenerating[email.id]}
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
                                    onClick={() => handleEdit(email.id)}
                                    className="gap-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(email.id)}
                                    className="gap-2"
                                    disabled={isDeleting[email.id]}
                                  >
                                    {isDeleting[email.id] ? (
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
                        {email.isExpanded && (
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              {/* Generate Alert Banner */}
                              {showGenerateAlert[email.id] && (
                                <div className="info-indicator">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>
                                    Please review the AI-generated email and make any necessary adjustments before saving.
                                  </span>
                                </div>
                              )}

                              {/* Edit Mode Fields */}
                              {email.isEditing && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Select Candidate</Label>
                                      <Select 
                                        value={editingValues[email.id]?.candidateId || ''} 
                                        onValueChange={(value) => handleEditingFieldChange(email.id, 'candidateId', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose candidate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {candidates.map((candidate) => (
                                            <SelectItem key={candidate.id} value={candidate.id}>
                                              {candidate.name}
                                              {candidate.email && (
                                                <span className="text-muted-foreground"> ({candidate.email})</span>
                                              )}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Email Template</Label>
                                      <Select 
                                        value={editingValues[email.id]?.templateId || ''} 
                                        onValueChange={(value) => handleEditingFieldChange(email.id, 'templateId', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {candidateEmailTemplates.map((template) => (
                                            <SelectItem key={template.id} value={template.id}>
                                              <div>
                                                <div className="font-medium">{template.name}</div>
                                                <div className="text-sm text-muted-foreground">{template.description}</div>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* Custom Prompt Field - Only show when Custom Prompt template is selected */}
                                  {editingValues[email.id]?.templateId === 'custom-prompt' && (
                                    <div className="space-y-2">
                                      <Label>Custom Prompt</Label>
                                      <Input
                                        value={editingValues[email.id]?.customPrompt || ''}
                                        onChange={(e) => handleEditingFieldChange(email.id, 'customPrompt', e.target.value)}
                                        placeholder="Describe how you want the AI to write this email (e.g., 'Write a follow-up emphasizing company culture and remote work benefits')"
                                      />
                                    </div>
                                  )}

                                  {/* Subject Field */}
                                  <div className="space-y-2">
                                    <Label>Email Subject</Label>
                                    <Input
                                      value={editingValues[email.id]?.subject || ''}
                                      onChange={(e) => handleEditingFieldChange(email.id, 'subject', e.target.value)}
                                      placeholder="Enter email subject..."
                                    />
                                  </div>
                                </div>
                              )}

                              {/* View Mode Info */}
                              {!email.isEditing && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-muted-foreground">Candidate</Label>
                                      <p className="text-sm font-medium">{email.candidate_name || 'Not selected'}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-muted-foreground">Template</Label>
                                      <p className="text-sm font-medium">{email.template_name || 'Not selected'}</p>
                                    </div>
                                  </div>
                                  {email.subject && (
                                    <div className="space-y-2">
                                      <Label className="text-muted-foreground">Subject</Label>
                                      <p className="text-sm font-medium">{email.subject}</p>
                                    </div>
                                  )}
                                  {/* Copy Button - Only visible in view mode */}
                                  {email.content && (
                                    <div className="flex justify-end -mt-2 mb-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyToClipboard(`Subject: ${email.subject}\n\n${email.content}`)}
                                        className="h-8 w-8 p-0"
                                        aria-label="Copy email"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Email Content Text Area */}
                              <div className="space-y-2">
                                <Label>{email.isEditing ? 'Email Content' : 'Content'}</Label>
                                <Textarea
                                  value={
                                    email.isEditing
                                      ? editingValues[email.id]?.content || email.content
                                      : email.content
                                  }
                                  onChange={(e) => {
                                    if (email.isEditing) {
                                      handleEditingFieldChange(email.id, 'content', e.target.value)
                                    }
                                  }}
                                  className="min-h-[400px] resize-none font-mono text-sm"
                                  placeholder="Enter email content or click Generate to create one with AI..."
                                  readOnly={!email.isEditing}
                                />
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Client Emails Tab */}
            <TabsContent value="client-emails">
              <Card>
                <CardHeader>
                  <h3 className="text-base font-medium">Client Communication</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate professional emails for client communication and candidate submissions
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Email Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select Candidate</Label>
                      <Select value={clientSelectedCandidate} onValueChange={setClientSelectedCandidate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose candidate" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.name}
                              {candidate.email && (
                                <span className="text-muted-foreground"> ({candidate.email})</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Email Template</Label>
                      <Select value={clientSelectedTemplate} onValueChange={setClientSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose template" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientEmailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-sm text-muted-foreground">{template.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button 
                    onClick={handleGenerateClientEmail}
                    disabled={!clientSelectedCandidate || !clientSelectedTemplate || clientIsGenerating}
                    className="w-full"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {clientIsGenerating ? "Generating Email..." : "Generate Client Email"}
                  </Button>

                  {/* Generated Email */}
                  {(clientEmailMessage || clientIsGenerating) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Generated Email</Label>
                        <div className="flex gap-2">
                          {clientEmailMessage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(clientEmailMessage)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveOldEmail('client')}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <Textarea
                        value={clientIsGenerating ? "Generating personalized email..." : clientEmailMessage}
                        onChange={(e) => setClientEmailMessage(e.target.value)}
                        rows={16}
                        className="min-h-[300px] font-mono text-sm"
                        disabled={clientIsGenerating}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email? This action cannot be undone.
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
              This will overwrite your existing email content. Are you sure you want to continue?
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
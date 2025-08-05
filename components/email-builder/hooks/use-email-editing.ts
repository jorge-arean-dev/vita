import { useState } from 'react'
import { Email, EditingValues } from '../types/email-builder.types'

interface UseEmailEditingReturn {
  editingValues: EditingValues
  originalValues: EditingValues
  unsavedChanges: Set<string>
  setEditingValues: (values: EditingValues) => void
  setUnsavedChanges: (changes: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  handleEdit: (email: Email) => void
  handleEditingTitleChange: (id: string, title: string) => void
  handleEditingFieldChange: (id: string, field: keyof EditingValues[string], value: string) => void
  clearEditingState: (id: string) => void
  initializeEditingValues: (email: Email) => void
  hasChanges: (id: string) => boolean
}

export const useEmailEditing = (): UseEmailEditingReturn => {
  const [editingValues, setEditingValues] = useState<EditingValues>({})
  const [originalValues, setOriginalValues] = useState<EditingValues>({})
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())

  const handleEdit = (email: Email) => {
    const emailValues = {
      title: email.title,
      candidateId: email.candidate_id || '',
      templateId: email.template_id || '',
      customPrompt: '',
      subject: email.subject,
      content: email.content,
    }
    
    // Store current values for editing
    setEditingValues(prev => ({
      ...prev,
      [email.id]: emailValues,
    }))
    
    // Store original values for comparison
    setOriginalValues(prev => ({
      ...prev,
      [email.id]: emailValues,
    }))
  }

  const handleEditingTitleChange = (id: string, title: string) => {
    setEditingValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        title,
      },
    }))
    setUnsavedChanges(prev => new Set(prev).add(id))
  }

  const handleEditingFieldChange = (id: string, field: keyof EditingValues[string], value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
    setUnsavedChanges(prev => new Set(prev).add(id))
  }

  const clearEditingState = (id: string) => {
    setEditingValues(prev => {
      const newValues = { ...prev }
      delete newValues[id]
      return newValues
    })
    
    setOriginalValues(prev => {
      const newValues = { ...prev }
      delete newValues[id]
      return newValues
    })
    
    setUnsavedChanges(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const initializeEditingValues = (email: Email) => {
    setEditingValues(prev => ({
      ...prev,
      [email.id]: {
        title: email.title,
        candidateId: '',
        templateId: '',
        customPrompt: '',
        subject: email.subject,
        content: email.content
      }
    }))
    setUnsavedChanges(prev => new Set(prev).add(email.id))
  }
  
  const hasChanges = (id: string): boolean => {
    const current = editingValues[id]
    const original = originalValues[id]
    
    if (!current || !original) return false
    
    // Compare all fields
    return (
      current.title !== original.title ||
      current.candidateId !== original.candidateId ||
      current.templateId !== original.templateId ||
      current.customPrompt !== original.customPrompt ||
      current.subject !== original.subject ||
      current.content !== original.content
    )
  }

  return {
    editingValues,
    originalValues,
    unsavedChanges,
    setEditingValues,
    setUnsavedChanges,
    handleEdit,
    handleEditingTitleChange,
    handleEditingFieldChange,
    clearEditingState,
    initializeEditingValues,
    hasChanges
  }
}
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
  updateOriginalValues: (id: string) => void
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
    
    // Only store original values for existing items (not new items)
    // New items should never have originalValues to ensure hasChanges() works correctly
    if (!email.id.startsWith('new-')) {
      setOriginalValues(prev => ({
        ...prev,
        [email.id]: emailValues,
      }))
    }
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
    setEditingValues(prev => {
      const updatedValues = {
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      }
      
      // If the template is being changed, clear the custom prompt
      // This prevents the old custom prompt from being used with a different template
      if (field === 'templateId' && prev[id]) {
        updatedValues[id] = {
          ...updatedValues[id],
          customPrompt: '',
        }
      }
      
      return updatedValues
    })
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
    const emailValues = {
      title: email.title,
      candidateId: email.candidate_id || '',
      templateId: email.template_id || '',
      customPrompt: '',
      subject: email.subject,
      content: email.content
    }
    
    setEditingValues(prev => ({
      ...prev,
      [email.id]: emailValues
    }))
    
    // DON'T set originalValues for new items
    // This ensures hasChanges() works correctly for new items
    // For new items, hasChanges() will return true if any content exists
    if (!email.id.startsWith('new-')) {
      // This shouldn't happen in normal flow as initializeEditingValues 
      // is typically called for new items, but adding for safety
      setOriginalValues(prev => ({
        ...prev,
        [email.id]: emailValues
      }))
    }
    
    // Mark as having unsaved changes for new items
    if (email.id.startsWith('new-')) {
      setUnsavedChanges(prev => new Set(prev).add(email.id))
    }
  }
  
  const hasChanges = (id: string): boolean => {
    const current = editingValues[id]
    const original = originalValues[id]
    
    // If no current editing values, no changes
    if (!current) return false
    
    // If no original values (new item), check if there's any content
    if (!original) {
      return (
        current.title.trim() !== '' ||
        current.candidateId.trim() !== '' ||
        current.templateId.trim() !== '' ||
        current.customPrompt.trim() !== '' ||
        current.subject.trim() !== '' ||
        current.content.trim() !== ''
      )
    }
    
    // Compare current values with original values for existing items
    return (
      current.title !== original.title ||
      current.candidateId !== original.candidateId ||
      current.templateId !== original.templateId ||
      current.customPrompt !== original.customPrompt ||
      current.subject !== original.subject ||
      current.content !== original.content
    )
  }

  const updateOriginalValues = (id: string) => {
    const current = editingValues[id]
    if (!current) return
    
    // Set original values to current editing values (represents new saved state)
    setOriginalValues(prev => ({
      ...prev,
      [id]: { ...current }
    }))
    
    // Remove from unsaved changes
    setUnsavedChanges(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
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
    hasChanges,
    updateOriginalValues
  }
}
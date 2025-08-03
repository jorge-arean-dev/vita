import { useState } from 'react'
import { Email, EditingValues } from '../types/email-builder.types'

interface UseEmailEditingReturn {
  editingValues: EditingValues
  unsavedChanges: Set<string>
  setEditingValues: (values: EditingValues) => void
  setUnsavedChanges: (changes: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  handleEdit: (email: Email) => void
  handleEditingTitleChange: (id: string, title: string) => void
  handleEditingFieldChange: (id: string, field: keyof EditingValues[string], value: string) => void
  clearEditingState: (id: string) => void
  initializeEditingValues: (email: Email) => void
}

export const useEmailEditing = (): UseEmailEditingReturn => {
  const [editingValues, setEditingValues] = useState<EditingValues>({})
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())

  const handleEdit = (email: Email) => {
    // Store current values for editing
    setEditingValues(prev => ({
      ...prev,
      [email.id]: {
        title: email.title,
        candidateId: email.candidate_id || '',
        templateId: email.template_id || '',
        customPrompt: '',
        subject: email.subject,
        content: email.content,
      },
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

  return {
    editingValues,
    unsavedChanges,
    setEditingValues,
    setUnsavedChanges,
    handleEdit,
    handleEditingTitleChange,
    handleEditingFieldChange,
    clearEditingState,
    initializeEditingValues
  }
}
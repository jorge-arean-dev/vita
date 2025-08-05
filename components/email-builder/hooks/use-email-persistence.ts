import { useEffect } from 'react'
import { Email, EditingValues, JobData } from '../types/email-builder.types'
import { getStorageKeys } from '../utils/email-builder.utils'

interface UseEmailPersistenceProps {
  jobData: JobData | null | undefined
  emails: Email[]
  editingValues: EditingValues
  unsavedChanges: Set<string>
  mounted: boolean
}

interface UseEmailPersistenceReturn {
  expandedStateKey: string | null
  unsavedEmailsKey: string | null
  restoreFromStorage: () => {
    savedExpandedStates: { [key: string]: boolean }
    savedUnsavedEmails: Email[]
    savedEditingValues: EditingValues
  }
}

export const useEmailPersistence = ({
  jobData,
  emails,
  editingValues,
  unsavedChanges,
  mounted
}: UseEmailPersistenceProps): UseEmailPersistenceReturn => {
  const { expandedStateKey, unsavedEmailsKey } = getStorageKeys(jobData)

  // Restore data from sessionStorage
  const restoreFromStorage = () => {
    let savedExpandedStates: { [key: string]: boolean } = {}
    let savedUnsavedEmails: Email[] = []
    let savedEditingValues: EditingValues = {}
    
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
      
      // Restore unsaved emails with validation
      if (unsavedEmailsKey) {
        try {
          const savedUnsaved = sessionStorage.getItem(unsavedEmailsKey)
          if (savedUnsaved) {
            const parsed = JSON.parse(savedUnsaved)
            const emails = parsed.emails || []
            const editingValues = parsed.editingValues || {}
            
            // Only restore emails that have actual content or are being actively edited
            const validEmails = emails.filter((email: Email) => {
              const hasContent = email.content?.trim() || email.subject?.trim()
              const hasEditingValues = editingValues[email.id] && (
                editingValues[email.id].content?.trim() ||
                editingValues[email.id].subject?.trim() ||
                editingValues[email.id].templateId ||
                editingValues[email.id].candidateId ||
                editingValues[email.id].customPrompt?.trim()
              )
              
              return hasContent || hasEditingValues
            })
            
            // Only restore editing values for emails that are being restored
            const validEmailIds = new Set(validEmails.map((e: Email) => e.id))
            const validEditingValues: EditingValues = {}
            Object.keys(editingValues).forEach(id => {
              if (validEmailIds.has(id)) {
                validEditingValues[id] = editingValues[id]
              }
            })
            
            savedUnsavedEmails = validEmails
            savedEditingValues = validEditingValues
            
            console.log('Restored unsaved emails:', savedUnsavedEmails.length, 'emails (filtered from', emails.length, 'stored)')
            
            // If we filtered out emails, update the storage to reflect the clean state
            if (validEmails.length !== emails.length || Object.keys(validEditingValues).length !== Object.keys(editingValues).length) {
              if (validEmails.length === 0 && Object.keys(validEditingValues).length === 0) {
                sessionStorage.removeItem(unsavedEmailsKey)
                console.log('Cleared empty storage')
              } else {
                sessionStorage.setItem(unsavedEmailsKey, JSON.stringify({
                  emails: validEmails,
                  editingValues: validEditingValues
                }))
                console.log('Updated storage with filtered emails')
              }
            }
          }
        } catch (e) {
          console.error('Error loading unsaved emails:', e)
          // Clear corrupted storage
          if (unsavedEmailsKey) {
            sessionStorage.removeItem(unsavedEmailsKey)
          }
        }
      }
    }
    
    return { savedExpandedStates, savedUnsavedEmails, savedEditingValues }
  }

  // Save expanded states to sessionStorage whenever they change
  useEffect(() => {
    if (!expandedStateKey || !mounted || typeof window === 'undefined') return
    
    const expandedStates: { [key: string]: boolean } = {}
    emails.forEach(email => {
      if (email.isExpanded) {
        expandedStates[email.id] = true
      }
    })
    
    try {
      sessionStorage.setItem(expandedStateKey, JSON.stringify(expandedStates))
    } catch (e) {
      console.error('Error saving expanded states:', e)
    }
  }, [emails, expandedStateKey, mounted])

  // Save unsaved emails to sessionStorage
  useEffect(() => {
    if (!unsavedEmailsKey || !mounted || typeof window === 'undefined') return
    
    // Filter only new unsaved emails - save all new emails
    const unsavedEmails = emails.filter(email => 
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
  }, [emails, editingValues, unsavedChanges, unsavedEmailsKey, mounted])

  // Handle visibility changes to ensure data persistence
  useEffect(() => {
    if (typeof window === 'undefined' || !unsavedEmailsKey) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (tab switch, minimize, etc.)
        // Force save current state - save all new emails
        const unsavedEmails = emails.filter(email => 
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

    const handleBeforeUnload = () => {
      const unsavedEmails = emails.filter(email => 
        email.id.startsWith('new-')
      )
      
      if (unsavedEmails.length > 0 || Object.keys(editingValues).length > 0) {
        sessionStorage.setItem(unsavedEmailsKey, JSON.stringify({
          emails: unsavedEmails,
          editingValues: editingValues
        }))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [emails, editingValues, unsavedChanges, unsavedEmailsKey])

  return {
    expandedStateKey,
    unsavedEmailsKey,
    restoreFromStorage
  }
}
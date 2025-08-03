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
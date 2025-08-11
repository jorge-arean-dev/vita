"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Sparkles } from "lucide-react"
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
import { ClientEmailsTabProps } from '../types/email-builder.types'
import { EmailCard } from '../components/email-card'
import { useEmailManager } from '../hooks/use-email-manager'
import { useEmailEditing } from '../hooks/use-email-editing'
import { useEmailGeneration } from '../hooks/use-email-generation'
import { useEmailPersistence } from '../hooks/use-email-persistence'

export function ClientEmailsTab({ jobData, candidates, emailTemplates }: ClientEmailsTabProps) {
  const [mounted, setMounted] = useState(false)

  // Initialize editing hooks
  const {
    editingValues,
    unsavedChanges,
    setEditingValues,
    setUnsavedChanges,
    handleEdit,
    handleEditingTitleChange,
    handleEditingFieldChange,
    clearEditingState,
    initializeEditingValues,
    hasChanges
  } = useEmailEditing()

  // Initialize email management hooks
  const {
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
  } = useEmailManager({
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
    emailType: 'client'  // This is the key difference from CandidateEmailsTab
  })

  // Initialize generation hooks
  const {
    isGenerating,
    showGenerateAlert,
    overwriteConfirmId,
    setOverwriteConfirmId,
    handleGenerate,
    proceedWithGeneration
  } = useEmailGeneration({
    candidateEmailTemplates: [], // Not needed for client emails
    clientEmailTemplates: emailTemplates,
    jobData
  })

  // Initialize persistence hooks
  const { restoreFromStorage } = useEmailPersistence({
    jobData,
    emails,
    editingValues,
    unsavedChanges,
    mounted
  })

  // Initialize only once on mount
  useEffect(() => {
    setMounted(true)
    const { savedExpandedStates, savedUnsavedEmails, savedEditingValues } = restoreFromStorage()
    initializeEmails(savedUnsavedEmails, savedExpandedStates, savedEditingValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  const handleEmailEdit = (id: string) => {
    const email = filteredEmails.find((e) => e.id === id)
    if (email) {
      handleEdit(email)
      // Set editing mode
      setEmails(
        emails.map((e) => (e.id === id ? { ...e, isEditing: true, isExpanded: true } : e))
      )
    }
  }

  const handleEmailGenerate = async (id: string) => {
    const email = filteredEmails.find(e => e.id === id)
    if (email) {
      await handleGenerate(id, email, editingValues, setEditingValues, setUnsavedChanges)
    }
  }

  const handleProceedWithGeneration = async (id: string) => {
    await proceedWithGeneration(id, editingValues, setEditingValues, setUnsavedChanges)
    setOverwriteConfirmId(null)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header with New button */}
      <div className="pb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Client Communication</h3>
            <p className="text-sm text-muted-foreground">
              Generate professional emails for client communication and candidate submissions
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
        {filteredEmails.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No client emails created yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first client email to get started.
              </p>
              <Button onClick={handleNewEmail} className="gap-2">
                <Plus className="h-4 w-4" />
                New Email
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredEmails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              editingValues={editingValues}
              isGenerating={isGenerating[email.id] || false}
              isSaving={isSaving[email.id] || false}
              isDeleting={isDeleting[email.id] || false}
              showGenerateAlert={showGenerateAlert[email.id] || false}
              candidates={candidates}
              emailTemplates={emailTemplates}  // Using client templates
              hasChanges={hasChanges}
              onToggleExpand={handleToggleExpand}
              onEdit={handleEmailEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onGenerate={handleEmailGenerate}
              onEditingTitleChange={handleEditingTitleChange}
              onEditingFieldChange={handleEditingFieldChange}
              onCopyToClipboard={handleCopyToClipboard}
            />
          ))
        )}
      </div>

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

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelConfirmId} onOpenChange={() => setCancelConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Email</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard this email? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard
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
                handleProceedWithGeneration(overwriteConfirmId)
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
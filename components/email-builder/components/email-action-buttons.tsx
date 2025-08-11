import { Button } from "@/components/ui/button"
import { 
  Edit, 
  Save, 
  X, 
  Trash2, 
  Sparkles 
} from "lucide-react"
import { EmailActionButtonsProps } from '../types/email-builder.types'

export function EmailActionButtons({
  email,
  editingValues,
  isGenerating,
  isSaving,
  isDeleting,
  emailTemplates,
  hasChanges,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onGenerate
}: EmailActionButtonsProps) {
  // Helper function to check if a template is custom
  const isCustomTemplate = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId)
    return template?.templateName === 'custom_candidate' || template?.templateName === 'custom_client'
  }
  if (!email.isExpanded) {
    // Collapsed view - only delete button
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(email.id)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        aria-label="Delete email"
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Trash2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    )
  }

  if (email.isEditing) {
    // Edit Mode Buttons
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGenerate(email.id)}
          className="gap-2"
          disabled={
            isGenerating || 
            isSaving ||
            !editingValues[email.id]?.templateId ||
            (isCustomTemplate(editingValues[email.id]?.templateId || '') && !editingValues[email.id]?.customPrompt?.trim())
          }
        >
          {isGenerating ? (
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
          onClick={() => onSave(email.id)}
          size="sm"
          className="gap-2"
          disabled={
            isSaving || 
            isGenerating ||
            !editingValues[email.id]?.title?.trim() ||
            !editingValues[email.id]?.templateId ||
            !hasChanges(email.id)
          }
        >
          {isSaving ? (
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
          onClick={() => onCancel(email.id)}
          className="gap-2"
          disabled={isSaving || isGenerating}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </>
    )
  }

  // Expanded View Mode Buttons
  return (
    <>
      <Button
        size="sm"
        onClick={() => onEdit(email.id)}
        className="gap-2"
      >
        <Edit className="h-4 w-4" />
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(email.id)}
        className="gap-2"
        disabled={isDeleting}
      >
        {isDeleting ? (
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
  )
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react"
import { EmailCardProps } from '../types/email-builder.types'
import { EmailActionButtons } from './email-action-buttons'
import { EmailEditForm } from './email-edit-form'
import { EmailContentDisplay } from './email-content-display'

export function EmailCard({
  email,
  editingValues,
  isGenerating,
  isSaving,
  isDeleting,
  showGenerateAlert,
  candidates,
  emailTemplates,
  hasChanges,
  onToggleExpand,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onGenerate,
  onEditingTitleChange,
  onEditingFieldChange,
  onCopyToClipboard
}: EmailCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className={email.isExpanded ? "pb-3" : "py-0"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {/* Collapse/Expand Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(email.id)}
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
                  onChange={(e) => onEditingTitleChange(email.id, e.target.value)}
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
            <EmailActionButtons
              email={email}
              editingValues={editingValues}
              isGenerating={isGenerating}
              isSaving={isSaving}
              isDeleting={isDeleting}
              emailTemplates={emailTemplates}
              hasChanges={hasChanges}
              onEdit={onEdit}
              onSave={onSave}
              onCancel={onCancel}
              onDelete={onDelete}
              onGenerate={onGenerate}
            />
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {email.isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Generate Alert Banner */}
            {showGenerateAlert && (
              <div className="info-indicator">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Please review the AI-generated email and make any necessary adjustments before saving.
                </span>
              </div>
            )}

            {/* Edit Mode Fields */}
            {email.isEditing && (
              <EmailEditForm
                emailId={email.id}
                editingValues={editingValues}
                candidates={candidates}
                emailTemplates={emailTemplates}
                onEditingFieldChange={onEditingFieldChange}
              />
            )}

            {/* Email Content Display */}
            <EmailContentDisplay
              email={email}
              editingValues={editingValues}
              isGenerating={isGenerating}
              onEditingFieldChange={onEditingFieldChange}
              onCopyToClipboard={onCopyToClipboard}
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
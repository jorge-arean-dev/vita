import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
      <CardContent className="p-6 space-y-6">
        {/* Header with Title and Actions (Collapsible) */}
        <Collapsible open={email.isExpanded} onOpenChange={() => onToggleExpand(email.id)} className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Toggle email details">
                  {email.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              {email.isEditing && email.isExpanded ? (
                <Input
                  value={editingValues[email.id]?.title || email.title}
                  onChange={(e) => onEditingTitleChange(email.id, e.target.value)}
                  className="text-xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                  placeholder="Enter email title..."
                />
              ) : (
                <CardTitle className="text-xl font-bold">{email.title}</CardTitle>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
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

          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Edit Mode: Show editable fields */}
              {email.isEditing ? (
                <EmailEditForm
                  emailId={email.id}
                  editingValues={editingValues}
                  candidates={candidates}
                  emailTemplates={emailTemplates}
                  onEditingFieldChange={onEditingFieldChange}
                  showAsCollapsibleContent={true}
                />
              ) : (
                /* View Mode: Show read-only info */
                <>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Candidate</span>
                    <p className="font-medium">{email.candidate_name || 'Not selected'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Template</span>
                    <p className="font-medium">{email.template_name || 'Not selected'}</p>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Expanded Content */}
        {email.isExpanded && (
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

            {/* Email Content Display */}
            <EmailContentDisplay
              email={email}
              editingValues={editingValues}
              isGenerating={isGenerating}
              onEditingFieldChange={onEditingFieldChange}
              onCopyToClipboard={onCopyToClipboard}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
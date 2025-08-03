import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Loader2 } from "lucide-react"
import { EmailContentDisplayProps } from '../types/email-builder.types'

export function EmailContentDisplay({
  email,
  editingValues,
  isGenerating = false,
  onEditingFieldChange,
  onCopyToClipboard
}: EmailContentDisplayProps) {
  return (
    <>
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
                onClick={() => onCopyToClipboard(`Subject: ${email.subject}\n\n${email.content}`)}
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
        <div className="relative">
          <Textarea
            value={
              email.isEditing
                ? editingValues[email.id]?.content || email.content
                : email.content
            }
            onChange={(e) => {
              if (email.isEditing && !isGenerating) {
                onEditingFieldChange(email.id, 'content', e.target.value)
              }
            }}
            className="min-h-[400px] resize-none font-mono text-sm"
            placeholder="Enter email content or click Generate to create one with AI..."
            readOnly={!email.isEditing || isGenerating}
          />
          
          {/* Loading Overlay */}
          {isGenerating && email.isEditing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-md">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating email content...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
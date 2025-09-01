import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Sparkles } from "lucide-react"
import { EmailContentDisplayProps } from '../types/email-builder.types'
import { cn } from "@/lib/utils"

export function EmailContentDisplay({
  email,
  editingValues,
  isGenerating = false,
  onEditingFieldChange,
  onCopyToClipboard
}: EmailContentDisplayProps) {
  return (
    /* Child Card for Subject and Content */
    <Card>
      <CardContent className="p-6">
        {/* Container for both subject and content with overlay */}
        <div className="relative">
          <div className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject" className="text-sm text-muted-foreground">
                  Subject
                </Label>
                {!email.isEditing && email.subject && (
                  <Button variant="ghost" size="icon" onClick={() => onCopyToClipboard(email.subject)} aria-label="Copy subject">
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            {email.isEditing ? (
              <Input
                id="subject"
                value={editingValues[email.id]?.subject || email.subject}
                onChange={(e) => onEditingFieldChange(email.id, 'subject', e.target.value)}
                placeholder="Enter email subject..."
                readOnly={isGenerating}
              />
            ) : (
              <p className="font-medium">{email.subject || 'No subject'}</p>
            )}
          </div>

          {/* Email Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-sm text-muted-foreground">
                Content
              </Label>
              {!email.isEditing && email.content && (
                <Button variant="ghost" size="icon" onClick={() => onCopyToClipboard(email.content)} aria-label="Copy content">
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Textarea
              id="content"
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
              className={cn("min-h-[300px] resize-y", !email.isEditing && "border-none focus-visible:ring-0")}
              placeholder="Enter your email content here..."
              readOnly={!email.isEditing || isGenerating}
            />
          </div>
          </div>

          {/* Generation Loading Overlay - Now covers subject label, subject field, and content */}
          {isGenerating && email.isEditing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <Sparkles className="h-8 w-8 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="text-lg font-medium">Generating content...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while AI creates your email
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
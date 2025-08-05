import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmailEditFormProps } from '../types/email-builder.types'

export function EmailEditForm({
  emailId,
  editingValues,
  candidates,
  emailTemplates,
  onEditingFieldChange,
  showAsCollapsibleContent = false
}: EmailEditFormProps) {
  // Helper function to check if the selected template is a custom template
  const isCustomTemplate = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId)
    return template?.templateName === 'custom_candidate' || template?.templateName === 'custom_client'
  }
  
  // If showing as collapsible content, only show candidate and template selection
  if (showAsCollapsibleContent) {
    return (
      <>
        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">Candidate</Label>
          <Select 
            value={editingValues[emailId]?.candidateId || ''} 
            onValueChange={(value) => onEditingFieldChange(emailId, 'candidateId', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Choose candidate" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.name}
                  {candidate.email && (
                    <span className="text-muted-foreground"> ({candidate.email})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">Template</Label>
          <Select 
            value={editingValues[emailId]?.templateId || ''} 
            onValueChange={(value) => onEditingFieldChange(emailId, 'templateId', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Choose template" />
            </SelectTrigger>
            <SelectContent>
              {emailTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Show custom prompt field if custom template is selected */}
        {isCustomTemplate(editingValues[emailId]?.templateId || '') && (
          <div className="space-y-1 md:col-span-2">
            <Label className="text-sm text-muted-foreground">Custom Prompt</Label>
            <Input
              value={editingValues[emailId]?.customPrompt || ''}
              onChange={(e) => onEditingFieldChange(emailId, 'customPrompt', e.target.value)}
              placeholder="Describe how you want the AI to write this email..."
              className="h-8"
            />
          </div>
        )}
      </>
    )
  }

  // Full form for non-collapsible display
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Select Candidate</Label>
          <Select 
            value={editingValues[emailId]?.candidateId || ''} 
            onValueChange={(value) => onEditingFieldChange(emailId, 'candidateId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose candidate" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.name}
                  {candidate.email && (
                    <span className="text-muted-foreground"> ({candidate.email})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Email Template</Label>
          <Select 
            value={editingValues[emailId]?.templateId || ''} 
            onValueChange={(value) => onEditingFieldChange(emailId, 'templateId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose template" />
            </SelectTrigger>
            <SelectContent>
              {emailTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Prompt Field - Only show when Custom Prompt template is selected */}
      {isCustomTemplate(editingValues[emailId]?.templateId || '') && (
        <div className="space-y-2">
          <Label>Custom Prompt</Label>
          <Input
            value={editingValues[emailId]?.customPrompt || ''}
            onChange={(e) => onEditingFieldChange(emailId, 'customPrompt', e.target.value)}
            placeholder="Describe how you want the AI to write this email (e.g., 'Write a follow-up emphasizing company culture and remote work benefits')"
          />
        </div>
      )}

      {/* Subject Field */}
      <div className="space-y-2">
        <Label>Email Subject</Label>
        <Input
          value={editingValues[emailId]?.subject || ''}
          onChange={(e) => onEditingFieldChange(emailId, 'subject', e.target.value)}
          placeholder="Enter email subject..."
        />
      </div>
    </div>
  )
}
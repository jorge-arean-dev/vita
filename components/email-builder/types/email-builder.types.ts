export interface Candidate {
  id: string
  name: string
  email?: string
}

export interface EmailTemplate {
  id: string
  name: string
  description: string
}

export interface Email {
  id: string
  job_id: string
  title: string
  type: 'candidate' | 'client'
  candidate_id: string | null
  candidate_name: string | null
  template_id: string | null
  template_name: string | null
  subject: string
  content: string
  created_at: string
  updated_at: string
  isExpanded?: boolean
  isEditing?: boolean
}

export interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

export interface EmailBuilderProps {
  jobData?: JobData | null
}

export interface EditingValues {
  [key: string]: {
    title: string
    candidateId: string
    templateId: string
    customPrompt: string
    subject: string
    content: string
  }
}

export interface EmailCardProps {
  email: Email
  editingValues: EditingValues
  isGenerating: boolean
  isSaving: boolean
  isDeleting: boolean
  showGenerateAlert: boolean
  candidates: Candidate[]
  emailTemplates: EmailTemplate[]
  onToggleExpand: (id: string) => void
  onEdit: (id: string) => void
  onSave: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  onGenerate: (id: string) => void
  onEditingTitleChange: (id: string, title: string) => void
  onEditingFieldChange: (id: string, field: keyof EditingValues[string], value: string) => void
  onCopyToClipboard: (content: string) => void
}

export interface EmailEditFormProps {
  emailId: string
  editingValues: EditingValues
  candidates: Candidate[]
  emailTemplates: EmailTemplate[]
  onEditingFieldChange: (id: string, field: keyof EditingValues[string], value: string) => void
}

export interface EmailGenerationControlsProps {
  emailId: string
  editingValues: EditingValues
  isGenerating: boolean
  onGenerate: (id: string) => void
}

export interface EmailContentDisplayProps {
  email: Email
  editingValues: EditingValues
  isGenerating?: boolean
  onEditingFieldChange: (id: string, field: keyof EditingValues[string], value: string) => void
  onCopyToClipboard: (content: string) => void
}

export interface EmailActionButtonsProps {
  email: Email
  editingValues: EditingValues
  isGenerating: boolean
  isSaving: boolean
  isDeleting: boolean
  onEdit: (id: string) => void
  onSave: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  onGenerate: (id: string) => void
}

export interface CandidateEmailsTabProps {
  jobData?: JobData | null
  candidates: Candidate[]
  emailTemplates: EmailTemplate[]
}

export interface ClientEmailsTabProps {
  jobData?: JobData | null
  candidates: Candidate[]
  emailTemplates: EmailTemplate[]
}
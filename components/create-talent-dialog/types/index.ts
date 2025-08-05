export interface Country {
  iso_code: string
  display_name: string
}

export interface CandidateFormData {
  firstName: string
  lastName: string
  email: string
  country: string
  linkedin: string
  github: string
  yearsExperience: string
}

export interface ParsedSkill {
  name: string
  type: string
  yoe?: number | null
  proficiency_level?: string | null
  source?: string
}

import type { CandidateData } from "@/app/actions/candidates"

export interface CreateTalentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCandidateCreated?: (candidate: CandidateData) => void
}

export type InputMethod = "auto" | "manual"
export type DataSource = "linkedin" | "pdf"
export type Step = "data-source" | "personal-info" | "skills"

export interface APIProcessingState {
  isProcessing: boolean
  uploadProgress: string
  parsingProgress: string
  linkedinProgress: string
}

export interface FileUploadState {
  uploadedFile: File | null
  fileUploadError: string
  tempFilePath: string
}
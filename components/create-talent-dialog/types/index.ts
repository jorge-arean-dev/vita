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

// Skill types mapping (simplified to 3 core types)
export const SKILL_TYPES = [
  { name: "technical_skill", display_name: "Technical Skills" },
  { name: "soft_skill", display_name: "Soft Skills" },
  { name: "certification", display_name: "Certification" }
] as const

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
/**
 * Shared type definitions for job-related components and operations.
 * 
 * This file centralizes all job-related type definitions to ensure
 * consistency across the application and reduce duplication.
 */

/**
 * Core job data interface representing a recruiting position
 */
export interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Props interface for phase components that handle job data
 */
export interface PhaseComponentProps {
  jobId: string
  jobData?: JobData | null
  onDataChange: (data: Partial<JobData>) => void
}

/**
 * Extended props for phases that support sub-tabs
 */
export interface TabPhaseComponentProps extends PhaseComponentProps {
  currentTab?: string
}

/**
 * Company data structure for selection dropdowns
 */
export interface Company {
  id: string
  name: string
}

/**
 * Candidate data structure for analysis and communication
 */
export interface Candidate {
  id: string
  name: string
  email?: string
}

/**
 * Email template configuration
 */
export interface EmailTemplate {
  id: string
  name: string
  description: string
}

/**
 * Job phase identifier type
 */
export type JobPhase = "define" | "source" | "review" | "reach" | "assess" | "submit"

/**
 * Role analysis data structure
 */
export interface RoleAnalysis {
  attributes: string
  requirements: string
}

/**
 * Job description generation options
 */
export interface JobDescriptionOptions {
  company: boolean
  rateSalary: boolean
  commitment: boolean
  locationRequirements: boolean
}

/**
 * Analysis type options for candidate review
 */
export interface AnalysisTypes {
  pdf: boolean
  linkedin: boolean
}

/**
 * Server action response interface
 */
export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
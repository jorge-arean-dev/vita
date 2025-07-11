import { JobPhase } from "@/types/job"

/**
 * Helper functions for job-related operations and utilities.
 * 
 * This file contains reusable utility functions for job management,
 * data transformation, and common operations used across components.
 */

/**
 * Generate default tab for phases that support sub-navigation
 * 
 * @param phase - The job phase identifier
 * @returns Default tab name or undefined if phase doesn't have tabs
 */
export function getDefaultTabForPhase(phase: JobPhase): string | undefined {
  switch (phase) {
    case "define":
      return "initial-data"
    case "assess":
      return "interview-questions"
    default:
      return undefined
  }
}

/**
 * Check if a phase supports sub-tabs
 * 
 * @param phase - The job phase identifier
 * @returns True if the phase has sub-tabs
 */
export function phaseHasTabs(phase: JobPhase): boolean {
  return phase === "define" || phase === "assess"
}

/**
 * Format date for display in job listings
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatJobDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Generate a temporary job ID for new jobs
 * 
 * @returns Temporary job ID string
 */
export function generateTempJobId(): string {
  return `new-${Date.now()}`
}

/**
 * Check if a job ID represents a new job
 * 
 * @param jobId - Job ID to check
 * @returns True if this is a new job
 */
export function isNewJob(jobId: string): boolean {
  return jobId.startsWith("new-")
}

/**
 * Truncate text to a specified length with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

/**
 * Validate that at least one analysis type is selected
 * 
 * @param analysisTypes - Object with analysis type selections
 * @returns True if at least one type is selected
 */
export function hasSelectedAnalysisType(analysisTypes: Record<string, boolean>): boolean {
  return Object.values(analysisTypes).some(Boolean)
}

/**
 * Generate URL for job phase navigation
 * 
 * @param jobId - Job identifier
 * @param phase - Target phase
 * @param tab - Optional sub-tab
 * @returns Complete URL for navigation
 */
export function buildJobPhaseUrl(jobId: string, phase: JobPhase, tab?: string): string {
  const baseUrl = `/protected/jobs/${jobId}?phase=${phase}`
  const defaultTab = getDefaultTabForPhase(phase)
  const targetTab = tab || defaultTab
  
  return targetTab ? `${baseUrl}&tab=${targetTab}` : baseUrl
}

/**
 * Clean and prepare text for API submission
 * 
 * @param text - Raw text input
 * @returns Cleaned text ready for submission
 */
export function cleanTextForSubmission(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Check if job data has unsaved changes compared to original
 * 
 * @param current - Current job data
 * @param original - Original job data
 * @returns True if there are unsaved changes
 */
export function hasUnsavedChanges(
  current: Record<string, unknown>, 
  original: Record<string, unknown>
): boolean {
  const currentKeys = Object.keys(current)
  const originalKeys = Object.keys(original)
  
  if (currentKeys.length !== originalKeys.length) return true
  
  return currentKeys.some(key => current[key] !== original[key])
}

/**
 * Generate placeholder content for AI-generated fields
 * 
 * @param contentType - Type of content to generate placeholder for
 * @returns Placeholder text
 */
export function getPlaceholderContent(contentType: string): string {
  const placeholders: Record<string, string> = {
    'role-attributes': 'Job attributes will be generated from your initial notes...',
    'role-requirements': 'Requirements will be generated from your initial notes...',
    'job-description': 'Job description will be generated based on your selections...',
    'linkedin-query': 'LinkedIn boolean query will be generated based on your job requirements...',
    'interview-questions': 'Interview questions will be generated based on your job requirements...',
    'email-message': 'Generated email message will appear here...',
    'client-message': 'Generated client message will appear here...',
    'evaluation-results': 'Evaluation results will appear here after analysis...'
  }
  
  return placeholders[contentType] || 'Generated content will appear here...'
}

/**
 * Validate email template selection based on context
 * 
 * @param templateId - Selected template ID
 * @param availableTemplates - List of available templates
 * @returns True if template selection is valid
 */
export function isValidTemplateSelection(
  templateId: string, 
  availableTemplates: Array<{ id: string }>
): boolean {
  return availableTemplates.some(template => template.id === templateId)
}
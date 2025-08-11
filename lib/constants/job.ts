import { EmailTemplate } from "@/types/job"

/**
 * Static constants and configuration data for job-related features.
 * 
 * This file contains all static data used across job components,
 * including email templates, analysis options, and default values.
 */

/**
 * Available email templates for candidate outreach
 */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  { 
    id: "first-outreach", 
    name: "First-time Outreach", 
    description: "Initial contact with a potential candidate" 
  },
  { 
    id: "follow-up", 
    name: "Follow-up Message", 
    description: "Follow up after initial contact" 
  },
  { 
    id: "interview-scheduling", 
    name: "Interview Scheduling", 
    description: "Schedule interview with interested candidate" 
  },
  { 
    id: "positive-feedback", 
    name: "Positive Interview Feedback", 
    description: "Next steps after successful interview" 
  },
  { 
    id: "rejection", 
    name: "Rejection", 
    description: "Polite rejection after interview process" 
  }
]

/**
 * Available submission templates for client communication
 */
export const SUBMISSION_TEMPLATES: EmailTemplate[] = [
  { 
    id: "candidate-presentation", 
    name: "Candidate Presentation", 
    description: "Present qualified candidate to client" 
  },
  { 
    id: "interview-scheduling", 
    name: "Interview Scheduling", 
    description: "Schedule client interview with candidate" 
  },
  { 
    id: "offer-negotiation", 
    name: "Offer Negotiation", 
    description: "Discuss compensation and terms" 
  },
  { 
    id: "final-submission", 
    name: "Final Submission", 
    description: "Submit candidate for final hiring decision" 
  },
  { 
    id: "follow-up", 
    name: "Follow-up", 
    description: "Follow up on candidate status" 
  }
]

/**
 * Job description generation options
 */
export const JOB_DESCRIPTION_OPTIONS = [
  { id: "company", label: "Company" },
  { id: "rateSalary", label: "Rate/salary" },
  { id: "commitment", label: "Commitment" },
  { id: "locationRequirements", label: "Location requirements" }
] as const

/**
 * Default form values for job creation
 */
export const DEFAULT_JOB_FORM = {
  title: "",
  companyId: "",
  initialNotes: ""
} as const

/**
 * Default role analysis values
 */
export const DEFAULT_ROLE_ANALYSIS = {
  attributes: "",
  requirements: ""
} as const

/**
 * Default job description options
 */
export const DEFAULT_JOB_DESCRIPTION_OPTIONS = {
  company: false,
  rateSalary: false,
  commitment: false,
  locationRequirements: false
} as const

/**
 * Default analysis type options
 */
export const DEFAULT_ANALYSIS_TYPES = {
  pdf: false,
  linkedin: false
} as const

/**
 * Maximum character limits for various fields
 */
export const FIELD_LIMITS = {
  JOB_TITLE: 100,
  COMPANY_NAME: 100,
  INITIAL_NOTES: 5000,
  ROLE_ATTRIBUTES: 3000,
  ROLE_REQUIREMENTS: 3000,
  JOB_DESCRIPTION: 10000,
  LINKEDIN_QUERY: 2000,
  EMAIL_MESSAGE: 10000,
  INTERVIEW_QUESTIONS: 5000,
  INTERVIEW_TRANSCRIPT: 20000,
  INTERVIEW_EVALUATION: 10000,
  CLIENT_MESSAGE: 15000
} as const

/**
 * Validation messages for common errors
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: "This field is required",
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must not exceed ${max} characters`,
  INVALID_EMAIL: "Please enter a valid email address",
  SELECT_REQUIRED: "Please make a selection",
  ANALYSIS_TYPE_REQUIRED: "At least one analysis type must be selected"
} as const
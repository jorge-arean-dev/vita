import { z } from "zod"

/**
 * Validation schemas for job-related forms and data structures.
 * 
 * These schemas provide runtime validation and type safety for all job-related
 * data operations. They ensure data integrity across the application and
 * provide clear error messages for users.
 */

/**
 * Schema for job creation form validation
 * Validates the initial job creation dialog inputs
 */
export const jobCreationSchema = z.object({
  title: z
    .string()
    .min(1, "Job title is required")
    .min(3, "Job title must be at least 3 characters")
    .max(100, "Job title must not exceed 100 characters")
    .trim(),
  
  companyId: z
    .string()
    .min(1, "Company selection is required"),
  
  initialNotes: z
    .string()
    .max(5000, "Initial notes must not exceed 5000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Schema for job basic information (Define phase - Initial Data tab)
 */
export const jobBasicInfoSchema = z.object({
  title: z
    .string()
    .min(1, "Job title is required")
    .min(3, "Job title must be at least 3 characters")
    .max(100, "Job title must not exceed 100 characters")
    .trim(),
  
  companyName: z
    .string()
    .min(1, "Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .trim(),
  
  initialNotes: z
    .string()
    .max(5000, "Initial notes must not exceed 5000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Schema for role analysis data (Define phase - Role Analysis tab)
 */
export const roleAnalysisSchema = z.object({
  attributes: z
    .string()
    .max(3000, "Attributes must not exceed 3000 characters")
    .optional()
    .transform(val => val?.trim() || ""),
  
  requirements: z
    .string()
    .max(3000, "Requirements must not exceed 3000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Schema for job description options (Define phase - Job Description tab)
 */
export const jobDescriptionOptionsSchema = z.object({
  company: z.boolean().default(false),
  rateSalary: z.boolean().default(false),
  commitment: z.boolean().default(false),
  locationRequirements: z.boolean().default(false)
})

/**
 * Schema for complete job description data
 */
export const jobDescriptionSchema = z.object({
  options: jobDescriptionOptionsSchema,
  description: z
    .string()
    .max(10000, "Job description must not exceed 10000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Schema for LinkedIn boolean query (Source phase)
 */
export const linkedinQuerySchema = z.object({
  query: z
    .string()
    .max(2000, "LinkedIn query must not exceed 2000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Schema for candidate analysis options (Review phase)
 */
export const candidateAnalysisSchema = z.object({
  candidateId: z
    .string()
    .min(1, "Candidate selection is required"),
  
  analysisTypes: z.object({
    pdf: z.boolean().default(false),
    linkedin: z.boolean().default(false)
  }).refine(
    (data) => data.pdf || data.linkedin,
    {
      message: "At least one analysis type must be selected",
      path: ["analysisTypes"]
    }
  )
})

/**
 * Schema for email template selection and generation (Reach phase)
 */
export const emailTemplateSchema = z.object({
  candidateId: z
    .string()
    .min(1, "Candidate selection is required"),
  
  templateId: z
    .string()
    .min(1, "Email template selection is required"),
  
  message: z
    .string()
    .max(10000, "Email message must not exceed 10000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Schema for interview questions (Assess phase - Interview Questions tab)
 */
export const interviewQuestionsSchema = z.object({
  questions: z
    .string()
    .max(5000, "Interview questions must not exceed 5000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Schema for interview evaluation (Assess phase - Full Review tab)
 */
export const interviewEvaluationSchema = z.object({
  candidateId: z
    .string()
    .min(1, "Candidate selection is required"),
  
  transcript: z
    .string()
    .min(10, "Interview transcript must be at least 10 characters")
    .max(20000, "Interview transcript must not exceed 20000 characters")
    .trim(),
  
  evaluation: z
    .string()
    .max(10000, "Evaluation must not exceed 10000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Schema for client submission (Submit phase)
 */
export const clientSubmissionSchema = z.object({
  candidateId: z
    .string()
    .min(1, "Candidate selection is required"),
  
  companyId: z
    .string()
    .min(1, "Company selection is required"),
  
  templateId: z
    .string()
    .min(1, "Template selection is required"),
  
  message: z
    .string()
    .max(15000, "Client message must not exceed 15000 characters")
    .optional()
    .transform(val => val?.trim() || "")
})

/**
 * Complete job data schema for database operations
 */
export const completeJobSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  companyId: z.string().uuid(),
  companyName: z.string().min(1).max(100),
  initialNotes: z.string().max(5000).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Type exports for use in components
export type JobCreationFormData = z.infer<typeof jobCreationSchema>
export type JobBasicInfoFormData = z.infer<typeof jobBasicInfoSchema>
export type RoleAnalysisFormData = z.infer<typeof roleAnalysisSchema>
export type JobDescriptionFormData = z.infer<typeof jobDescriptionSchema>
export type LinkedinQueryFormData = z.infer<typeof linkedinQuerySchema>
export type CandidateAnalysisFormData = z.infer<typeof candidateAnalysisSchema>
export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>
export type InterviewQuestionsFormData = z.infer<typeof interviewQuestionsSchema>
export type InterviewEvaluationFormData = z.infer<typeof interviewEvaluationSchema>
export type ClientSubmissionFormData = z.infer<typeof clientSubmissionSchema>
export type CompleteJobData = z.infer<typeof completeJobSchema>
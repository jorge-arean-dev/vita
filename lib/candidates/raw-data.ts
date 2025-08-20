import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"
import type { LinkedInProfile } from "@/types/linkedin.types"
import crypto from "crypto"

type CandidatesLinkedInRawInsert = Database["public"]["Tables"]["candidates_linkedin_raw"]["Insert"]
type CandidatesResumeRawInsert = Database["public"]["Tables"]["candidates_resume_raw"]["Insert"]
type CandidatesLinkedInRawRow = Database["public"]["Tables"]["candidates_linkedin_raw"]["Row"]
type CandidatesResumeRawRow = Database["public"]["Tables"]["candidates_resume_raw"]["Row"]

/**
 * Utility functions for managing raw candidate data storage
 * Handles LinkedIn profiles and resume text with deduplication and retrieval
 */

/**
 * Generate a SHA-256 hash for content deduplication
 */
export function generateContentHash(content: string | LinkedInProfile | unknown): string {
  const contentString = typeof content === 'string' ? content : JSON.stringify(content)
  return crypto.createHash('sha256').update(contentString).digest('hex')
}

/**
 * Store raw LinkedIn profile data
 */
export async function storeLinkedInRawData(
  candidateId: string,
  linkedinProfile: LinkedInProfile,
  linkedinUrl?: string
): Promise<string> {
  const supabase = await createClient()
  
  const contentHash = generateContentHash(linkedinProfile)
  
  // Check if we already have this exact content
  const { data: existing } = await supabase
    .from('candidates_linkedin_raw')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('data_hash', contentHash)
    .single()
    
  if (existing) {
    return existing.id
  }
  
  const rawData: CandidatesLinkedInRawInsert = {
    candidate_id: candidateId,
    content: linkedinProfile,
    linkedin_url: linkedinUrl || null,
    data_hash: contentHash,
    extraction_date: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('candidates_linkedin_raw')
    .insert(rawData)
    .select('id')
    .single()
    
  if (error) {
    throw new Error(`Failed to store LinkedIn raw data: ${error.message}`)
  }
  
  return data.id
}

/**
 * Store raw resume text data
 */
export async function storeResumeRawData(
  candidateId: string,
  resumeText: string,
  options?: {
    url?: string
    fileName?: string
    fileSize?: number
  }
): Promise<string> {
  const supabase = await createClient()
  
  const contentHash = generateContentHash(resumeText)
  
  // Check if we already have this exact content
  const { data: existing } = await supabase
    .from('candidates_resume_raw')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('data_hash', contentHash)
    .single()
    
  if (existing) {
    return existing.id
  }
  
  const rawData: CandidatesResumeRawInsert = {
    candidate_id: candidateId,
    content: resumeText,
    url: options?.url || null,
    file_name: options?.fileName || null,
    file_size: options?.fileSize || null,
    data_hash: contentHash,
    extraction_date: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('candidates_resume_raw')
    .insert(rawData)
    .select('id')
    .single()
    
  if (error) {
    throw new Error(`Failed to store resume raw data: ${error.message}`)
  }
  
  return data.id
}

/**
 * Retrieve LinkedIn raw data for a candidate
 */
export async function getLinkedInRawData(candidateId: string): Promise<CandidatesLinkedInRawRow | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('candidates_linkedin_raw')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw new Error(`Failed to retrieve LinkedIn raw data: ${error.message}`)
  }
  
  return data
}

/**
 * Retrieve resume raw data for a candidate
 */
export async function getResumeRawData(candidateId: string): Promise<CandidatesResumeRawRow | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('candidates_resume_raw')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw new Error(`Failed to retrieve resume raw data: ${error.message}`)
  }
  
  return data
}

/**
 * Get available raw data types for a candidate
 */
export async function getCandidateRawDataSources(candidateId: string): Promise<{
  hasLinkedIn: boolean
  hasResume: boolean
  linkedInData?: CandidatesLinkedInRawRow
  resumeData?: CandidatesResumeRawRow
}> {
  const supabase = await createClient()
  
  const [linkedinResult, resumeResult] = await Promise.all([
    supabase
      .from('candidates_linkedin_raw')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('candidates_resume_raw')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(1)
  ])
  
  const linkedInData = linkedinResult.data?.[0] || null
  const resumeData = resumeResult.data?.[0] || null
  
  return {
    hasLinkedIn: !!linkedInData,
    hasResume: !!resumeData,
    linkedInData: linkedInData || undefined,
    resumeData: resumeData || undefined
  }
}

/**
 * Delete all raw data for a candidate (useful for GDPR compliance)
 */
export async function deleteAllRawDataForCandidate(candidateId: string): Promise<void> {
  const supabase = await createClient()
  
  const [linkedinResult, resumeResult] = await Promise.all([
    supabase
      .from('candidates_linkedin_raw')
      .delete()
      .eq('candidate_id', candidateId),
    supabase
      .from('candidates_resume_raw')
      .delete()
      .eq('candidate_id', candidateId)
  ])
  
  if (linkedinResult.error) {
    throw new Error(`Failed to delete LinkedIn raw data: ${linkedinResult.error.message}`)
  }
  
  if (resumeResult.error) {
    throw new Error(`Failed to delete resume raw data: ${resumeResult.error.message}`)
  }
}
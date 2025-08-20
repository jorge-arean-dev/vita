"use server"

import { 
  storeLinkedInRawData, 
  storeResumeRawData, 
  getLinkedInRawData,
  getResumeRawData,
  getCandidateRawDataSources,
  deleteAllRawDataForCandidate
} from "@/lib/candidates/raw-data"
import type { LinkedInProfile } from "@/types/linkedin.types"

/**
 * Server actions for managing raw candidate data
 * These wrap the utility functions to make them available to client components
 */

/**
 * Store raw LinkedIn profile data
 */
export async function storeLinkedInRawDataAction(
  candidateId: string,
  linkedinProfile: LinkedInProfile,
  linkedinUrl?: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const id = await storeLinkedInRawData(candidateId, linkedinProfile, linkedinUrl)
    return { success: true, id }
  } catch (error) {
    console.error("Error storing LinkedIn raw data:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to store LinkedIn raw data" 
    }
  }
}

/**
 * Store raw resume text data
 */
export async function storeResumeRawDataAction(
  candidateId: string,
  resumeText: string,
  options?: {
    url?: string
    fileName?: string
    fileSize?: number
  }
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const id = await storeResumeRawData(candidateId, resumeText, options)
    return { success: true, id }
  } catch (error) {
    console.error("Error storing resume raw data:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to store resume raw data" 
    }
  }
}

/**
 * Get LinkedIn raw data for a candidate
 */
export async function getLinkedInRawDataAction(candidateId: string) {
  try {
    const data = await getLinkedInRawData(candidateId)
    return { success: true, data }
  } catch (error) {
    console.error("Error retrieving LinkedIn raw data:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to retrieve LinkedIn raw data" 
    }
  }
}

/**
 * Get resume raw data for a candidate
 */
export async function getResumeRawDataAction(candidateId: string) {
  try {
    const data = await getResumeRawData(candidateId)
    return { success: true, data }
  } catch (error) {
    console.error("Error retrieving resume raw data:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to retrieve resume raw data" 
    }
  }
}

/**
 * Get available raw data types for a candidate
 */
export async function getCandidateRawDataSourcesAction(candidateId: string) {
  try {
    const data = await getCandidateRawDataSources(candidateId)
    return { success: true, data }
  } catch (error) {
    console.error("Error retrieving candidate raw data sources:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to retrieve raw data sources" 
    }
  }
}

/**
 * Delete all raw data for a candidate (GDPR compliance)
 */
export async function deleteAllRawDataForCandidateAction(candidateId: string) {
  try {
    await deleteAllRawDataForCandidate(candidateId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting candidate raw data:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete raw data" 
    }
  }
}
"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

/**
 * Server action to clean up temporary resume files
 * Used when user cancels/discards match analysis or creates candidate dialog
 */
export async function cleanupTempResumeFile(tempPath: string): Promise<{
  success: boolean
  error?: string
}> {
  noStore()
  
  try {
    const supabase = await createClient()
    
    console.log('Cleaning up temp resume file:', tempPath)
    
    // Remove the temporary file from temp_resumes bucket
    const { error: removeFileError } = await supabase.storage
      .from('temp_resumes')
      .remove([tempPath])

    if (removeFileError) {
      console.error("Error removing temporary file:", removeFileError)
      return { 
        success: false, 
        error: `Failed to remove temporary file: ${removeFileError.message}` 
      }
    }

    // Remove the timestamp directory from temp_resumes bucket (will succeed if empty)
    const tempDir = tempPath.substring(0, tempPath.lastIndexOf('/'))
    const { error: removeDirError } = await supabase.storage
      .from('temp_resumes')
      .remove([tempDir])

    if (removeDirError) {
      console.error("Error removing temp directory (this is normal if directory not empty):", removeDirError)
      // Don't fail the operation if directory removal fails - this is expected if other files exist
    }

    console.log('Successfully cleaned up temp resume file:', tempPath)
    return { success: true }

  } catch (error) {
    console.error('Unexpected error during temp file cleanup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
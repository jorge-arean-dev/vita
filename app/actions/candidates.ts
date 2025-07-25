"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CandidateData {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  linkedin: string | null
  github: string | null
  resume_url: string | null
  country: string | null
  years_experience: number | null
  created_at: string
  updated_at: string
  country_name?: string
}

// Use the actual database structure - no additional fields exist
export type CandidateDetailData = CandidateData

export interface CandidateSkill {
  id: string
  candidate_id: string
  skill: string
  type: string
  proficiency_level: string | null
  source: string
  created_at: string
  updated_at: string
  skill_type_display_name?: string
}

export async function getCandidates(): Promise<CandidateData[]> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Fetch candidates for the user
  const { data: candidates, error } = await supabase
    .from("candidates")
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      email,
      linkedin,
      github,
      resume_url,
      country,
      years_experience,
      created_at,
      updated_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    
  if (error) {
    throw new Error(`Failed to fetch candidates: ${error.message}`)
  }

  // Get country names if we have country codes
  const countryCodes = [...new Set(candidates.map(c => c.country).filter(Boolean))]
  let countryMap: Record<string, string> = {}
  
  if (countryCodes.length > 0) {
    const { data: countries, error: countryError } = await supabase
      .from("countries")
      .select("iso_code, display_name")
      .in("iso_code", countryCodes)
    
    if (!countryError && countries) {
      countryMap = countries.reduce((acc, country) => {
        acc[country.iso_code] = country.display_name
        return acc
      }, {} as Record<string, string>)
    }
  }

  // Transform the data to include country names
  const transformedCandidates: CandidateData[] = candidates.map((candidate) => ({
    ...candidate,
    country_name: candidate.country ? countryMap[candidate.country] || candidate.country : null
  }))

  return transformedCandidates
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Delete the candidate (ensure user can only delete their own candidates)
  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", candidateId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error("Failed to delete candidate")
  }

  // Revalidate the candidates page to reflect the changes
  revalidatePath("/protected/candidates")
}

export async function createSampleCandidates(): Promise<void> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  const sampleCandidates = [
    {
      user_id: user.id,
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sarah.johnson@email.com",
      linkedin: "https://linkedin.com/in/sarah-johnson",
      resume_url: "https://example.com/sarah-resume.pdf",
      country: "US"
    },
    {
      user_id: user.id,
      first_name: "Miguel",
      last_name: "Rodriguez",
      email: "miguel.rodriguez@email.com",
      linkedin: "https://linkedin.com/in/miguel-rodriguez",
      country: "ES"
    }
  ]

  const { error } = await supabase
    .from("candidates")
    .insert(sampleCandidates)

  if (error) {
    throw new Error(`Failed to create sample candidates: ${error.message}`)
  }

  // Revalidate the candidates page to reflect the changes
  revalidatePath("/protected/candidates")
}

export async function searchCountries(searchTerm: string): Promise<{ iso_code: string; display_name: string }[]> {
  const supabase = await createClient()
  
  if (!searchTerm.trim()) {
    return []
  }

  try {
    const { data: countries, error } = await supabase
      .from("countries")
      .select("iso_code, display_name")
      .ilike("display_name", `%${searchTerm}%`)
      .order("display_name")
      .limit(10) // Limit results for performance

    if (error) {
      console.error("Error searching countries:", error)
      return []
    }

    return countries || []
  } catch (error) {
    console.error("Error searching countries:", error)
    return []
  }
}

export async function getCandidateById(candidateId: string): Promise<CandidateDetailData | null> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  try {
    const { data: candidate, error } = await supabase
      .from("candidates")
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        linkedin,
        github,
        resume_url,
        country,
        years_experience,
        created_at,
        updated_at
      `)
      .eq("id", candidateId)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching candidate:", error)
      return null
    }

    if (!candidate) {
      return null
    }

    // Get country name if we have a country code
    let countryName = candidate.country
    if (candidate.country) {
      const { data: countryData, error: countryError } = await supabase
        .from("countries")
        .select("display_name")
        .eq("iso_code", candidate.country)
        .single()
      
      if (!countryError && countryData) {
        countryName = countryData.display_name
      }
    }

    return {
      ...candidate,
      country_name: countryName
    }
  } catch (error) {
    console.error("Error fetching candidate:", error)
    return null
  }
}

export async function getCandidateSkills(candidateId: string): Promise<CandidateSkill[]> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  try {
    // First verify the candidate belongs to the user
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("user_id")
      .eq("id", candidateId)
      .eq("user_id", user.id)
      .single()

    if (candidateError || !candidate) {
      throw new Error("Candidate not found or access denied")
    }

    // Fetch candidate skills with skill type display names
    const { data: skills, error } = await supabase
      .from("candidates_skills")
      .select(`
        id,
        candidate_id,
        skill,
        type,
        proficiency_level,
        source,
        created_at,
        updated_at
      `)
      .eq("candidate_id", candidateId)
      .order("type")
      .order("skill")

    if (error) {
      console.error("Error fetching candidate skills:", error)
      return []
    }

    if (!skills || skills.length === 0) {
      return []
    }

    // Get skill type display names
    const skillTypes = [...new Set(skills.map(s => s.type))]
    const { data: skillTypesData, error: skillTypesError } = await supabase
      .from("skill_types")
      .select("name, display_name")
      .in("name", skillTypes)

    let skillTypeMap: Record<string, string> = {}
    if (!skillTypesError && skillTypesData) {
      skillTypeMap = skillTypesData.reduce((acc, skillType) => {
        acc[skillType.name] = skillType.display_name
        return acc
      }, {} as Record<string, string>)
    }

    // Transform the data to include skill type display names
    return skills.map(skill => ({
      ...skill,
      skill_type_display_name: skillTypeMap[skill.type] || skill.type
    }))
  } catch (error) {
    console.error("Error fetching candidate skills:", error)
    return []
  }
}

export async function updateCandidatePersonalInfo(
  candidateId: string, 
  updates: Partial<Pick<CandidateDetailData, 'first_name' | 'last_name' | 'email' | 'country' | 'linkedin' | 'github' | 'years_experience'>>
): Promise<void> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  try {
    const dbUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from("candidates")
      .update(dbUpdates)
      .eq("id", candidateId)
      .eq("user_id", user.id)

    if (error) {
      throw new Error(`Failed to update candidate: ${error.message}`)
    }

    // Revalidate the candidate pages
    revalidatePath("/protected/candidates")
    revalidatePath(`/protected/candidates/${candidateId}`)
  } catch (error) {
    console.error("Error updating candidate:", error)
    throw error
  }
}

// Create a new candidate
// Upload resume file temporarily (before candidate creation)
export async function uploadTemporaryResume(
  file: File
): Promise<{ success: boolean; error?: string; tempUrl?: string; tempPath?: string }> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Only PDF and Word documents are allowed" }
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File size must be less than 5MB" }
  }

  try {
    // Create temporary file path: {userId}/{timestamp}/{original-filename}
    const timestamp = Date.now()
    // Sanitize filename to prevent path traversal attacks
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const tempPath = `${user.id}/${timestamp}/${sanitizedFileName}`

    console.log("Attempting to upload file:", {
      tempPath,
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name,
      sanitizedFileName,
      userId: user.id,
      bucket: 'temp_resumes'
    })

    // Upload to temporary bucket
    const { error: uploadError } = await supabase.storage
      .from('temp_resumes')
      .upload(tempPath, file, {
        contentType: file.type
      })

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError)
      console.error("Upload error details:", {
        message: uploadError.message
      })
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // Get the public URL for the temporary file (for API parsing)
    const { data: publicUrlData } = supabase.storage
      .from('temp_resumes')
      .getPublicUrl(tempPath)

    if (!publicUrlData.publicUrl) {
      return { success: false, error: "Failed to generate file URL" }
    }

    return { 
      success: true, 
      tempUrl: publicUrlData.publicUrl,
      tempPath: tempPath
    }
  } catch (error) {
    console.error("Error uploading temporary file:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

// Upload resume file and update candidate record
export async function uploadCandidateResume(
  candidateId: string,
  file: File
): Promise<{ success: boolean; error?: string; resumeUrl?: string }> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Only PDF and Word documents are allowed" }
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File size must be less than 5MB" }
  }

  try {
    // First verify the candidate belongs to the user
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("user_id, resume_url")
      .eq("id", candidateId)
      .eq("user_id", user.id)
      .single()

    if (candidateError || !candidate) {
      return { success: false, error: "Candidate not found or access denied" }
    }

    // Define the file path: {userId}/{candidateId}/{original-filename}
    // Sanitize filename to prevent path traversal attacks
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${user.id}/${candidateId}/${sanitizedFileName}`

    // If there's an existing resume in our bucket, delete it first
    if (candidate.resume_url && candidate.resume_url.includes('supabase')) {
      // Extract the file path from the existing URL to delete it
      const urlParts = candidate.resume_url.split('/storage/v1/object/public/resumes/')
      if (urlParts.length > 1) {
        const existingPath = urlParts[1]
        await supabase.storage
          .from('resumes')
          .remove([existingPath])
      }
    }

    // Upload the new file
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        upsert: true, // Overwrite if exists
        contentType: file.type
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { success: false, error: "Failed to upload resume. Please try again." }
    }

    // Get the signed URL for the uploaded file (valid for 1 year)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filePath, 31536000) // 1 year in seconds

    if (urlError || !signedUrlData) {
      console.error("Error creating signed URL:", urlError)
      return { success: false, error: "Failed to generate resume URL" }
    }

    // Update the candidate record with the new resume URL
    const { error: updateError } = await supabase
      .from("candidates")
      .update({ 
        resume_url: signedUrlData.signedUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", candidateId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating candidate:", updateError)
      return { success: false, error: "Failed to update candidate record" }
    }

    // Revalidate the candidates pages
    revalidatePath("/protected/candidates")
    revalidatePath(`/protected/candidates/${candidateId}`)

    return { 
      success: true, 
      resumeUrl: signedUrlData.signedUrl 
    }
  } catch (error) {
    console.error("Error uploading resume:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

// Move temporary file to final candidate location
export async function moveTempResumeToCandidate(
  tempPath: string,
  candidateId: string
): Promise<{ success: boolean; error?: string; finalUrl?: string }> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  try {
    // Extract filename from temp path
    const pathParts = tempPath.split('/')
    const filename = pathParts[pathParts.length - 1]
    const finalPath = `${user.id}/${candidateId}/${filename}`

    console.log("Moving file from temp to final location:", {
      tempPath,
      finalPath,
      filename
    })

    // Download the temporary file from temp_resumes bucket
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('temp_resumes')
      .download(tempPath)

    if (downloadError || !fileData) {
      console.error("Error downloading temporary file:", downloadError)
      return { success: false, error: "Failed to access temporary file" }
    }

    // Upload to final location in resumes bucket (private)
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(finalPath, fileData, {
        upsert: true,
        contentType: fileData.type
      })

    if (uploadError) {
      console.error("Error uploading to final location:", uploadError)
      return { success: false, error: "Failed to move file to final location" }
    }

    // Immediately remove the temporary file from temp_resumes bucket
    const { error: removeFileError } = await supabase.storage
      .from('temp_resumes')
      .remove([tempPath])

    if (removeFileError) {
      console.error("Error removing temporary file:", removeFileError)
    }

    // Remove the timestamp directory from temp_resumes bucket (will succeed if empty)
    const tempDir = tempPath.substring(0, tempPath.lastIndexOf('/'))
    const { error: removeDirError } = await supabase.storage
      .from('temp_resumes')
      .remove([tempDir])

    if (removeDirError) {
      console.error("Error removing temp directory:", removeDirError)
    }

    // Get signed URL for the final location (valid for 1 year)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(finalPath, 31536000) // 1 year in seconds

    if (urlError || !signedUrlData) {
      console.error("Error creating final signed URL:", urlError)
      return { success: false, error: "Failed to generate final file URL" }
    }

    return { 
      success: true, 
      finalUrl: signedUrlData.signedUrl 
    }
  } catch (error) {
    console.error("Error moving temporary file:", error)
    return { success: false, error: "An unexpected error occurred while moving the file" }
  }
}

// Insert candidate skills from parsed resume data
export async function insertCandidateSkills(
  candidateId: string,
  skills: Array<{
    name: string
    type: string
    yoe?: number | null
    proficiency_level?: string | null
    source?: string
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  try {
    // Verify the candidate belongs to the user
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("user_id")
      .eq("id", candidateId)
      .eq("user_id", user.id)
      .single()

    if (candidateError || !candidate) {
      return { success: false, error: "Candidate not found or access denied" }
    }

    // Prepare skills data for insertion
    const skillsToInsert = skills.map(skill => ({
      candidate_id: candidateId,
      skill: skill.name,
      type: skill.type, // Direct mapping - no conversion needed
      source: skill.source || "resume", // Use provided source or default to resume
      proficiency_level: skill.proficiency_level || null
    }))

    // Insert skills
    const { error: insertError } = await supabase
      .from("candidates_skills")
      .insert(skillsToInsert)

    if (insertError) {
      console.error("Error inserting candidate skills:", insertError)
      return { success: false, error: "Failed to save candidate skills" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error inserting candidate skills:", error)
    return { success: false, error: "An unexpected error occurred while saving skills" }
  }
}

// Update candidate resume URL after file move
export async function updateCandidateResumeUrl(
  candidateId: string,
  resumeUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  try {
    const { error } = await supabase
      .from("candidates")
      .update({ 
        resume_url: resumeUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", candidateId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating candidate resume URL:", error)
      return { success: false, error: "Failed to update resume URL" }
    }

    // Revalidate the candidates pages
    revalidatePath("/protected/candidates")
    revalidatePath(`/protected/candidates/${candidateId}`)

    return { success: true }
  } catch (error) {
    console.error("Error updating candidate resume URL:", error)
    return { success: false, error: "An unexpected error occurred while updating resume URL" }
  }
}

export async function createCandidate(data: {
  firstName: string
  lastName: string
  email: string
  country?: string
  linkedin?: string
  github?: string
  yearsExperience?: number
}): Promise<{ success: boolean; error?: string; candidateId?: string }> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    return { success: false, error: "Invalid email format" }
  }

  // Validate and normalize LinkedIn URL
  let linkedinUrl = data.linkedin
  if (linkedinUrl) {
    // Remove trailing slashes
    linkedinUrl = linkedinUrl.trim().replace(/\/+$/, '')
    
    // Check if it's a valid LinkedIn profile URL
    const linkedinPatterns = [
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+$/,
      /^(www\.)?linkedin\.com\/in\/[\w-]+$/,
      /^linkedin\.com\/in\/[\w-]+$/
    ]
    
    const isValidLinkedIn = linkedinPatterns.some(pattern => pattern.test(linkedinUrl!))
    if (!isValidLinkedIn) {
      return { success: false, error: "Invalid LinkedIn URL format. Expected format: linkedin.com/in/username" }
    }
    
    // Normalize to full URL if not already
    if (!linkedinUrl.startsWith("http")) {
      linkedinUrl = `https://${linkedinUrl.startsWith("www.") ? linkedinUrl : `www.${linkedinUrl}`}`
    }
  }

  // Validate and normalize GitHub URL
  let githubUrl = data.github
  if (githubUrl) {
    // Remove trailing slashes
    githubUrl = githubUrl.trim().replace(/\/+$/, '')
    
    // Check if it's a valid GitHub profile URL
    const githubPatterns = [
      /^https?:\/\/(www\.)?github\.com\/[\w-]+$/,
      /^(www\.)?github\.com\/[\w-]+$/,
      /^github\.com\/[\w-]+$/
    ]
    
    const isValidGitHub = githubPatterns.some(pattern => pattern.test(githubUrl!))
    if (!isValidGitHub) {
      return { success: false, error: "Invalid GitHub URL format. Expected format: github.com/username" }
    }
    
    // Normalize to full URL if not already
    if (!githubUrl.startsWith("http")) {
      githubUrl = `https://${githubUrl}`
    }
  }

  try {
    // Insert the new candidate and return the ID
    const { data: candidateData, error } = await supabase
      .from("candidates")
      .insert({
        user_id: user.id,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        country: data.country || null,
        linkedin: linkedinUrl || null,
        github: githubUrl || null,
        years_experience: data.yearsExperience || null
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating candidate:", error)
      return { success: false, error: "Failed to create candidate. Please try again." }
    }

    // Revalidate the candidates page
    revalidatePath("/protected/candidates")
    
    return { success: true, candidateId: candidateData.id }
  } catch (error) {
    console.error("Error creating candidate:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
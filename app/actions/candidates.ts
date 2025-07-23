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
  resume_url: string | null
  country: string | null
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
      resume_url,
      country,
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
        resume_url,
        country,
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
  updates: Partial<Pick<CandidateDetailData, 'first_name' | 'last_name' | 'email' | 'country' | 'linkedin'>>
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
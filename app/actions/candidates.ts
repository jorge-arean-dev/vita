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
  years_experience: number | null
  created_at: string
  updated_at: string
  country_name?: string
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
      country: "US",
      years_experience: 5.5
    },
    {
      user_id: user.id,
      first_name: "Miguel",
      last_name: "Rodriguez",
      email: "miguel.rodriguez@email.com",
      linkedin: "https://linkedin.com/in/miguel-rodriguez",
      country: "ES",
      years_experience: 8.0
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
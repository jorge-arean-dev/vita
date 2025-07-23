"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CompanyData {
  id: string
  user_id: string
  name: string
  industry_id: string | null
  website: string | null
  linkedin: string | null
  country: string | null
  culture: string | null
  created_at: string
  updated_at: string
  country_name?: string
  industry_name?: string
}

export async function getCompanies(): Promise<CompanyData[]> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Fetch companies for the user
  const { data: companies, error } = await supabase
    .from("companies")
    .select(`
      id,
      user_id,
      name,
      industry_id,
      website,
      linkedin,
      country,
      culture,
      created_at,
      updated_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    
  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`)
  }

  // Get country names if we have country codes
  const countryCodes = [...new Set(companies.map(c => c.country).filter(Boolean))]
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

  // Get industry names if we have industry ids
  const industryIds = [...new Set(companies.map(c => c.industry_id).filter(Boolean))]
  let industryMap: Record<string, string> = {}
  
  if (industryIds.length > 0) {
    const { data: industries, error: industryError } = await supabase
      .from("industries")
      .select("id, display_name")
      .in("id", industryIds)
    
    if (!industryError && industries) {
      industryMap = industries.reduce((acc, industry) => {
        acc[industry.id] = industry.display_name
        return acc
      }, {} as Record<string, string>)
    }
  }

  // Transform the data to include country and industry names
  const transformedCompanies: CompanyData[] = companies.map((company) => ({
    ...company,
    country_name: company.country ? countryMap[company.country] || company.country : null,
    industry_name: company.industry_id ? industryMap[company.industry_id] || null : null
  }))

  return transformedCompanies
}

export async function deleteCompany(companyId: string): Promise<void> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Delete the company (ensure user can only delete their own companies)
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error("Failed to delete company")
  }

  // Revalidate the companies page to reflect the changes
  revalidatePath("/protected/companies")
}
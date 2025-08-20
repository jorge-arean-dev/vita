"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const waitlistFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  country: z.string().optional(),
  linkedin: z.string().optional(),
  role: z.string().optional(),
  industry: z.string().optional(),
  tools: z.array(z.string()).optional(),
  aiTools: z.array(z.string()).optional(),
  triggerSource: z.enum(["join_waitlist", "vita_core", "vita_custom"]).default("join_waitlist"),
  // Additional fields for "Other" options
  roleOther: z.string().optional(),
  industryOther: z.string().optional(),
  toolsOther: z.string().optional(),
  aiToolsOther: z.string().optional(),
})

export type WaitlistFormData = z.infer<typeof waitlistFormSchema>

export async function submitWaitlistForm(data: WaitlistFormData) {
  try {
    // Validate the data
    const validatedData = waitlistFormSchema.parse(data)
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Validate that the country exists in our countries table (only if country is provided)
    if (validatedData.country) {
      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('display_name')
        .eq('display_name', validatedData.country)
        .single()
      
      if (countryError || !countryData) {
        console.error('Country validation error:', countryError)
        return {
          success: false,
          error: "Invalid country selected. Please try again."
        }
      }
    }
    
    // Handle "Other" selections by replacing them with custom text (only if provided)
    const finalRole = validatedData.role === "Other" 
      ? validatedData.roleOther || "Other" 
      : validatedData.role || null

    const finalIndustry = validatedData.industry === "Other" 
      ? validatedData.industryOther || "Other" 
      : validatedData.industry || null

    // Process tools arrays to include "Other" custom text
    const finalTools = validatedData.tools || []
    if (finalTools.includes("Other") && validatedData.toolsOther) {
      const toolsWithoutOther = finalTools.filter(tool => tool !== "Other")
      finalTools.splice(0, finalTools.length, ...toolsWithoutOther, validatedData.toolsOther)
    }

    const finalAiTools = validatedData.aiTools || []
    if (finalAiTools.includes("Other") && validatedData.aiToolsOther) {
      const aiToolsWithoutOther = finalAiTools.filter(tool => tool !== "Other")
      finalAiTools.splice(0, finalAiTools.length, ...aiToolsWithoutOther, validatedData.aiToolsOther)
    }

    // Insert data into waitlist_forms table
    const { error } = await supabase
      .from('waitlist_forms')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        country: validatedData.country || null,
        linkedin: validatedData.linkedin || null,
        role: finalRole,
        industry: finalIndustry,
        tools: finalTools.length > 0 ? finalTools : null,
        ai_tools: finalAiTools.length > 0 ? finalAiTools : null,
        trigger_source: validatedData.triggerSource,
      })

    if (error) {
      console.error('Supabase error:', error)
      return {
        success: false,
        error: "Failed to save form data. Please try again."
      }
    }

    return {
      success: true,
      message: "Thank you for joining our waitlist! We'll be in touch soon."
    }

  } catch (error) {
    console.error('Form submission error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Please check your form data and try again.",
        details: error.errors
      }
    }
    
    return {
      success: false,
      error: "An unexpected error occurred. Please try again."
    }
  }
}
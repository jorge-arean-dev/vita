'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema for profile update
const profileUpdateSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
})

// Schema for avatar upload
const avatarUploadSchema = z.object({
  file: z.instanceof(File),
})

/**
 * Update user profile information
 */
export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }
    
    // Parse and validate form data
    const firstName = formData.get('first_name') as string | null
    const lastName = formData.get('last_name') as string | null
    const company = formData.get('company') as string | null
    const role = formData.get('role') as string | null
    
    const validatedData = profileUpdateSchema.parse({
      first_name: firstName,
      last_name: lastName,
      company: company,
      role: role,
    })
    
    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('user_id', user.id)
    
    if (error) {
      return { error: error.message }
    }
    
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Failed to update profile' }
  }
}

/**
 * Upload avatar and update profile
 * The avatar_url will be automatically updated by the database trigger
 */
export async function uploadAvatar(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }
    
    // Get file from form data
    const file = formData.get('avatar') as File
    
    // Validate file
    try {
      avatarUploadSchema.parse({ file })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: error.errors[0].message }
      }
      return { error: 'Invalid file' }
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      return { error: 'File type not supported. Please upload a JPEG, PNG, GIF, or WebP image.' }
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'File too large. Maximum size is 5MB.' }
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })
    
    if (uploadError) {
      return { error: uploadError.message }
    }
    
    // The avatar_url will be updated automatically by the database trigger
    
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Avatar upload error:', error)
    return { error: 'Failed to upload avatar' }
  }
}

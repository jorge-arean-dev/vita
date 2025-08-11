export interface Profile {
  id: string
  user_id: string
  first_name: string | null
  avatar_url: string | null
  email: string
  created_at: string
  updated_at: string
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

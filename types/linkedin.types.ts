// LinkedIn profile types based on Apify scraper output
export interface LinkedInProfile {
  // Basic profile information
  firstName?: string
  lastName?: string
  fullName?: string
  headline?: string
  summary?: string
  location?: string
  profilePicture?: string
  
  // Contact information
  email?: string
  phone?: string
  
  // Professional information
  experiences?: LinkedInExperience[]
  education?: LinkedInEducation[]
  skills?: LinkedInSkill[]
  certifications?: LinkedInCertification[]
  
  // URLs and social links
  linkedinUrl?: string
  websites?: string[]
  
  // Additional metadata from scraper
  connectionCount?: number
  followersCount?: number
  isOpenToWork?: boolean
  
  // Raw fields that might vary based on scraper version
  [key: string]: unknown
}

export interface LinkedInExperience {
  title?: string
  company?: string
  location?: string
  description?: string
  startDate?: string
  endDate?: string
  duration?: string
  current?: boolean
}

export interface LinkedInEducation {
  school?: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface LinkedInSkill {
  name?: string
  endorsements?: number
}

export interface LinkedInCertification {
  name?: string
  issuer?: string
  issueDate?: string
  expirationDate?: string
  credentialId?: string
  url?: string
}
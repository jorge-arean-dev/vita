/**
 * Seniority Detection Module
 * 
 * This module provides functions to detect seniority levels from job titles
 * and candidate profiles. It maps various title patterns to standardized
 * seniority levels used throughout the application.
 */

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'executive'

export interface CandidateSeniority {
  level: SeniorityLevel | null
  yearsOfExperience: number
  confidence: 'high' | 'medium' | 'low'
  source: 'title' | 'experience' | 'combined' | 'unknown'
}

/**
 * Title patterns mapped to seniority levels
 * Order matters - more specific patterns should come first
 */
const TITLE_PATTERNS: Array<{ pattern: RegExp; level: SeniorityLevel; confidence: 'high' | 'medium' }> = [
  // Executive patterns (most specific)
  { pattern: /\b(ceo|cto|cfo|coo|cpo|ciso|cmo|chief|c-level|president|vp|vice president|evp|svp)\b/i, level: 'executive', confidence: 'high' },
  { pattern: /\b(executive|director|head of|managing director)\b/i, level: 'executive', confidence: 'medium' },
  
  // Lead patterns
  { pattern: /\b(lead|team lead|tech lead|technical lead|engineering lead|principal|staff|architect|manager|supervisor)\b/i, level: 'lead', confidence: 'high' },
  { pattern: /\b(senior manager|senior architect)\b/i, level: 'lead', confidence: 'high' },
  
  // Senior patterns
  { pattern: /\b(senior|sr\.?)\s+((?!manager|director|vp|president|lead|architect).)*$/i, level: 'senior', confidence: 'high' },
  { pattern: /\b(expert|specialist|consultant|advisor)\b/i, level: 'senior', confidence: 'medium' },
  
  // Mid-level patterns
  { pattern: /\b(mid-level|mid level|mid-senior|mid senior|intermediate)\b/i, level: 'mid', confidence: 'high' },
  { pattern: /^(?!.*\b(junior|jr|senior|sr|lead|principal|staff|director|manager|executive|chief|head|vp|president)\b)[a-z\s]+\s+(developer|engineer|analyst|designer|scientist|specialist)$/i, level: 'mid', confidence: 'medium' },
  
  // Junior patterns
  { pattern: /\b(junior|jr\.?|entry level|entry-level|associate|intern|trainee|apprentice|graduate)\b/i, level: 'junior', confidence: 'high' },
  { pattern: /\b(assistant|coordinator)\b(?!.*\b(senior|lead|manager|director)\b)/i, level: 'junior', confidence: 'medium' },
]

/**
 * Experience to seniority mapping
 */
const EXPERIENCE_LEVELS = {
  junior: { min: 0, max: 2 },
  mid: { min: 2, max: 5 },
  senior: { min: 5, max: 10 },
  lead: { min: 7, max: 15 },
  executive: { min: 10, max: null }
}

/**
 * Detect seniority level from a job title
 * 
 * @param title - The job title to analyze
 * @returns The detected seniority level or null if unable to determine
 */
export function detectSeniorityFromTitle(title: string): { level: SeniorityLevel | null; confidence: 'high' | 'medium' | 'low' } {
  if (!title || typeof title !== 'string') {
    return { level: null, confidence: 'low' }
  }

  const cleanTitle = title.trim().toLowerCase()
  
  // Check against patterns
  for (const { pattern, level, confidence } of TITLE_PATTERNS) {
    if (pattern.test(cleanTitle)) {
      return { level, confidence }
    }
  }
  
  // If no pattern matches, return null with low confidence
  return { level: null, confidence: 'low' }
}

/**
 * Detect seniority from years of experience
 * 
 * @param yearsOfExperience - Number of years of experience
 * @returns The estimated seniority level based on experience
 */
export function detectSeniorityFromExperience(yearsOfExperience: number): SeniorityLevel | null {
  if (yearsOfExperience < 0 || isNaN(yearsOfExperience)) {
    return null
  }
  
  // Check each level's range
  if (yearsOfExperience <= EXPERIENCE_LEVELS.junior.max) {
    return 'junior'
  } else if (yearsOfExperience <= EXPERIENCE_LEVELS.mid.max) {
    return 'mid'
  } else if (yearsOfExperience <= EXPERIENCE_LEVELS.senior.max) {
    return 'senior'
  } else if (yearsOfExperience <= EXPERIENCE_LEVELS.lead.max) {
    return 'lead'
  } else {
    // Over 15 years typically indicates executive potential
    return 'executive'
  }
}

/**
 * Detect candidate seniority from multiple data points
 * Combines title analysis, years of experience, and role progression
 * 
 * @param candidate - Object containing candidate information
 * @returns Detected seniority with confidence level
 */
export function detectCandidateSeniority(candidate: {
  currentTitle?: string
  titles?: string[]
  yearsOfExperience?: number
  roles?: Array<{ title: string; duration?: number }>
}): CandidateSeniority {
  const results: Array<{ level: SeniorityLevel; source: string; confidence: number }> = []
  
  // Analyze current title
  if (candidate.currentTitle) {
    const titleResult = detectSeniorityFromTitle(candidate.currentTitle)
    if (titleResult.level) {
      results.push({
        level: titleResult.level,
        source: 'current_title',
        confidence: titleResult.confidence === 'high' ? 1.0 : 0.7
      })
    }
  }
  
  // Analyze all titles if available
  if (candidate.titles && candidate.titles.length > 0) {
    const titleLevels = candidate.titles
      .map(title => detectSeniorityFromTitle(title))
      .filter(result => result.level !== null)
    
    if (titleLevels.length > 0) {
      // Take the highest seniority from recent titles
      const levelOrder: SeniorityLevel[] = ['junior', 'mid', 'senior', 'lead', 'executive']
      const highestLevel = titleLevels.reduce((highest, current) => {
        if (!highest.level) return current
        if (!current.level) return highest
        const highestIndex = levelOrder.indexOf(highest.level)
        const currentIndex = levelOrder.indexOf(current.level)
        return currentIndex > highestIndex ? current : highest
      })
      
      if (highestLevel.level) {
        results.push({
          level: highestLevel.level,
          source: 'titles',
          confidence: highestLevel.confidence === 'high' ? 0.9 : 0.6
        })
      }
    }
  }
  
  // Analyze years of experience
  const yoe = candidate.yearsOfExperience || 0
  const experienceLevel = detectSeniorityFromExperience(yoe)
  if (experienceLevel) {
    results.push({
      level: experienceLevel,
      source: 'experience',
      confidence: 0.8
    })
  }
  
  // Analyze role progression if available
  if (candidate.roles && candidate.roles.length > 0) {
    const roleSeniorities = candidate.roles
      .map(role => detectSeniorityFromTitle(role.title))
      .filter(result => result.level !== null)
    
    if (roleSeniorities.length > 0) {
      // Check for career progression
      const levelOrder: SeniorityLevel[] = ['junior', 'mid', 'senior', 'lead', 'executive']
      const latestLevel = roleSeniorities[roleSeniorities.length - 1].level
      
      if (latestLevel) {
        const hasProgression = roleSeniorities.length > 1 && 
          levelOrder.indexOf(latestLevel) > levelOrder.indexOf(roleSeniorities[0].level!)
        
        results.push({
          level: latestLevel,
          source: 'role_progression',
          confidence: hasProgression ? 0.9 : 0.7
        })
      }
    }
  }
  
  // Determine final seniority
  if (results.length === 0) {
    return {
      level: null,
      yearsOfExperience: yoe,
      confidence: 'low',
      source: 'unknown'
    }
  }
  
  // Weight and combine results
  const levelCounts = new Map<SeniorityLevel, number>()
  const levelConfidence = new Map<SeniorityLevel, number>()
  
  for (const result of results) {
    const currentCount = levelCounts.get(result.level) || 0
    const currentConfidence = levelConfidence.get(result.level) || 0
    levelCounts.set(result.level, currentCount + 1)
    levelConfidence.set(result.level, Math.max(currentConfidence, result.confidence))
  }
  
  // Find the level with highest weighted score
  let bestLevel: SeniorityLevel | null = null
  let bestScore = 0
  let bestSource = 'unknown'
  
  for (const [level, count] of levelCounts.entries()) {
    const confidence = levelConfidence.get(level) || 0
    const score = count * confidence
    if (score > bestScore) {
      bestScore = score
      bestLevel = level
      
      // Determine primary source
      const primaryResult = results.find(r => r.level === level)
      bestSource = primaryResult?.source || 'combined'
    }
  }
  
  // Determine overall confidence
  let overallConfidence: 'high' | 'medium' | 'low' = 'low'
  if (bestScore >= 1.5) overallConfidence = 'high'
  else if (bestScore >= 0.8) overallConfidence = 'medium'
  
  // Map source to final format
  const sourceMap: Record<string, CandidateSeniority['source']> = {
    'current_title': 'title',
    'titles': 'title',
    'experience': 'experience',
    'role_progression': 'combined',
    'unknown': 'unknown'
  }
  
  return {
    level: bestLevel,
    yearsOfExperience: yoe,
    confidence: overallConfidence,
    source: sourceMap[bestSource] || 'combined'
  }
}

/**
 * Get years of experience from candidate data
 * Attempts to extract from various sources
 * 
 * @param candidate - Candidate data object
 * @returns Number of years of experience or 0 if unable to determine
 */
export function getCandidateYearsOfExperience(candidate: {
  yearsOfExperience?: number
  years_experience?: number
  experience?: number
  roles?: Array<{ duration?: number; startDate?: string; endDate?: string }>
}): number {
  // Direct experience fields
  if (candidate.yearsOfExperience && candidate.yearsOfExperience > 0) {
    return candidate.yearsOfExperience
  }
  if (candidate.years_experience && candidate.years_experience > 0) {
    return candidate.years_experience
  }
  if (candidate.experience && candidate.experience > 0) {
    return candidate.experience
  }
  
  // Calculate from roles if available
  if (candidate.roles && candidate.roles.length > 0) {
    let totalMonths = 0
    
    for (const role of candidate.roles) {
      if (role.duration) {
        totalMonths += role.duration
      } else if (role.startDate) {
        const start = new Date(role.startDate)
        const end = role.endDate ? new Date(role.endDate) : new Date()
        const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
        totalMonths += Math.max(0, months)
      }
    }
    
    return Math.round(totalMonths / 12)
  }
  
  return 0
}
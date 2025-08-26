/**
 * Proficiency Calculator Module
 * Handles YOE to proficiency level mapping using 3-tier system
 */

export type ProficiencyLevel = 'beginner' | 'advanced' | 'expert'

/**
 * Maps years of experience to proficiency level
 * - beginner: 0 < YOE ≤ 2.0 (hands-on experience)
 * - advanced: 2.0 < YOE ≤ 5.0 (consistent, practical experience)
 * - expert: YOE > 5.0 (in-depth, specialized experience)
 */
export function mapYOEToProficiency(years: number | undefined | null): ProficiencyLevel {
  if (!years || years <= 0) return 'beginner'
  if (years <= 2.0) return 'beginner'
  if (years <= 5.0) return 'advanced'
  return 'expert'
}

/**
 * Proficiency hierarchy for comparison
 * Note: "intermediate" has been removed per requirements
 */
export const PROFICIENCY_HIERARCHY: ProficiencyLevel[] = ['beginner', 'advanced', 'expert']

/**
 * Get numeric index for proficiency level (for comparison)
 */
export function getProficiencyIndex(level: ProficiencyLevel): number {
  const index = PROFICIENCY_HIERARCHY.indexOf(level)
  return index === -1 ? 0 : index
}

/**
 * Calculate match between required and candidate proficiency
 * Returns match status and any bonus/penalty
 */
export interface ProficiencyMatchResult {
  meets: boolean
  score: number  // 0-100
  explanation: string
}

export function calculateProficiencyMatch(
  requiredLevel: ProficiencyLevel,
  candidateLevel: ProficiencyLevel
): ProficiencyMatchResult {
  const reqIndex = getProficiencyIndex(requiredLevel)
  const candIndex = getProficiencyIndex(candidateLevel)
  
  if (candIndex >= reqIndex) {
    // Candidate meets or exceeds requirement
    const bonus = Math.min(15, (candIndex - reqIndex) * 5)
    return {
      meets: true,
      score: 100 + bonus, // Base 100 + bonus for overqualification
      explanation: candIndex > reqIndex 
        ? `Exceeds requirement (${candidateLevel} > ${requiredLevel})`
        : `Meets requirement (${candidateLevel})`
    }
  } else {
    // Candidate below requirement
    const penalty = Math.min(30, (reqIndex - candIndex) * 15)
    return {
      meets: false,
      score: Math.max(0, 70 - penalty), // Start from 70 and reduce
      explanation: `Below requirement (${candidateLevel} < ${requiredLevel})`
    }
  }
}

/**
 * Parse proficiency from various string formats
 */
export function parseProficiencyString(proficiency: string | undefined | null): ProficiencyLevel {
  if (!proficiency) return 'beginner'
  
  const normalized = proficiency.toLowerCase().trim()
  
  // Direct matches
  if (normalized.includes('expert') || normalized.includes('senior')) return 'expert'
  if (normalized.includes('advanced') || normalized.includes('experienced')) return 'advanced'
  if (normalized.includes('beginner') || normalized.includes('junior') || normalized.includes('entry')) return 'beginner'
  
  // Year-based parsing
  const yearMatch = normalized.match(/(\d+(\.\d+)?)\s*(year|yr|yoe)/i)
  if (yearMatch) {
    const years = parseFloat(yearMatch[1])
    return mapYOEToProficiency(years)
  }
  
  // Default to beginner if uncertain
  return 'beginner'
}
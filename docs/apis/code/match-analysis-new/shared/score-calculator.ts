/**
 * Score Calculator Module
 * Implements additive scoring system where optional requirements only boost scores
 */

export type ScoreCategory = 'strong' | 'adequate' | 'weak' | 'missing'

export interface RequirementScore {
  requirementId: string
  requirementName: string
  score: number
  category: ScoreCategory
  matched: boolean
  evidence: string[]
  confidence: number
}

export interface ScoreBreakdown {
  score: number
  maxPossible: number
  breakdown: RequirementScore[]
}

export interface OverallScore {
  totalScore: number
  category: ScoreCategory
  mandatory: ScoreBreakdown
  optional: {
    bonus: number
    maxPossible: number
    breakdown: RequirementScore[]
  }
  confidence: number
  explanation: string
}

/**
 * Categorize a numeric score into 4-tier system
 * - strong: score >= 80
 * - adequate: 60 <= score < 80
 * - weak: 30 <= score < 60
 * - missing: score < 30
 */
export function categorizeScore(score: number): ScoreCategory {
  if (score >= 80) return 'strong'
  if (score >= 60) return 'adequate'
  if (score >= 30) return 'weak'
  return 'missing'
}

/**
 * Calculate score for mandatory requirements
 * These form the base score (0-100)
 */
export function calculateMandatoryScore(
  requirementScores: RequirementScore[]
): ScoreBreakdown {
  if (requirementScores.length === 0) {
    return { score: 100, maxPossible: 100, breakdown: [] }
  }
  
  const totalScore = requirementScores.reduce((sum, req) => sum + req.score, 0)
  const averageScore = totalScore / requirementScores.length
  
  return {
    score: Math.round(averageScore),
    maxPossible: 100,
    breakdown: requirementScores
  }
}

/**
 * Calculate bonus from optional requirements
 * Can only add to score, never subtract
 * Maximum bonus: 20 points
 */
export function calculateOptionalBonus(
  requirementScores: RequirementScore[]
): number {
  if (requirementScores.length === 0) return 0
  
  // Calculate how many optional requirements were met well
  const wellMetCount = requirementScores.filter(req => req.score >= 70).length
  const totalOptional = requirementScores.length
  
  // Bonus based on percentage of optional requirements met well
  const percentage = wellMetCount / totalOptional
  const bonus = Math.round(percentage * 20) // Max 20 points
  
  return Math.min(20, bonus)
}

/**
 * Calculate final score using additive system
 * Mandatory forms base, optional adds bonus (never penalty)
 */
export function calculateFinalScore(
  mandatoryScores: RequirementScore[],
  optionalScores: RequirementScore[]
): OverallScore {
  // Calculate mandatory base score
  const mandatory = calculateMandatoryScore(mandatoryScores)
  
  // Calculate optional bonus (additive only)
  const optionalBonus = calculateOptionalBonus(optionalScores)
  
  // Final score: mandatory + optional bonus (capped at 100)
  const totalScore = Math.min(100, mandatory.score + optionalBonus)
  
  // Overall confidence based on requirement confidence scores
  const allScores = [...mandatoryScores, ...optionalScores]
  const avgConfidence = allScores.length > 0
    ? allScores.reduce((sum, s) => sum + s.confidence, 0) / allScores.length
    : 0
  
  // Generate explanation
  const explanation = generateScoreExplanation(
    mandatory.score,
    optionalBonus,
    mandatoryScores.length,
    optionalScores.length
  )
  
  return {
    totalScore,
    category: categorizeScore(totalScore),
    mandatory,
    optional: {
      bonus: optionalBonus,
      maxPossible: 20,
      breakdown: optionalScores
    },
    confidence: Math.round(avgConfidence * 100) / 100,
    explanation
  }
}

/**
 * Generate human-readable explanation of score
 */
function generateScoreExplanation(
  mandatoryScore: number,
  optionalBonus: number,
  mandatoryCount: number,
  optionalCount: number
): string {
  const parts: string[] = []
  
  // Mandatory explanation
  if (mandatoryScore >= 80) {
    parts.push(`Strongly meets ${mandatoryCount} mandatory requirement${mandatoryCount !== 1 ? 's' : ''}`)
  } else if (mandatoryScore >= 60) {
    parts.push(`Adequately meets mandatory requirements`)
  } else if (mandatoryScore >= 30) {
    parts.push(`Weakly meets mandatory requirements`)
  } else {
    parts.push(`Missing most mandatory requirements`)
  }
  
  // Optional explanation
  if (optionalBonus > 15) {
    parts.push(`excels at optional requirements (+${optionalBonus} bonus)`)
  } else if (optionalBonus > 10) {
    parts.push(`meets many optional requirements (+${optionalBonus} bonus)`)
  } else if (optionalBonus > 5) {
    parts.push(`meets some optional requirements (+${optionalBonus} bonus)`)
  } else if (optionalBonus > 0) {
    parts.push(`meets few optional requirements (+${optionalBonus} bonus)`)
  }
  
  return parts.join(', ')
}

/**
 * Create a requirement score object
 */
export function createRequirementScore(
  requirement: {
    id: string
    name: string
  },
  score: number,
  evidence: string[],
  confidence: number = 0.85
): RequirementScore {
  return {
    requirementId: requirement.id,
    requirementName: requirement.name,
    score: Math.round(score),
    category: categorizeScore(score),
    matched: score >= 60,
    evidence,
    confidence
  }
}
/**
 * Skill Matcher Module
 * Handles hierarchical and semantic skill matching
 * 
 * Version: 2025-08-27 - Proficiency-Focused Algorithm
 * Major Change: Updated scoring weight from 70% skill + 30% proficiency 
 *               to 10% skill + 90% proficiency for accurate experience-level evaluation
 */

import { skillRegistry } from './skill-registry.ts'
import { mapYOEToProficiency, calculateProficiencyMatch, ProficiencyLevel } from './proficiency-calculator.ts'

export interface CandidateSkill {
  name: string
  yearsOfExperience?: number | null
  proficiencyLevel?: string | null
  type?: string
  source?: string
}

export interface JobRequirement {
  id: string
  skill: string
  yearsRequired?: number | null
  proficiencyRequired?: string | null
  importance: 'mandatory' | 'optional'
  category?: string
}

export interface SkillMatch {
  type: 'exact' | 'alias' | 'child_qualifies' | 'parent_general' | 'semantic' | 'no_match'
  confidence: number
  evidence: string
  candidateSkill: string
  requirement: string
  proficiencyMatch?: {
    meets: boolean
    score: number
    explanation: string
  }
}

export interface MatchResult {
  requirement: JobRequirement
  matches: SkillMatch[]
  bestMatch: SkillMatch | null
  score: number
  explanation: string
}

/**
 * Find matches between a job requirement and candidate skills
 * Routes to appropriate matcher based on skill type
 */
export async function findSkillMatches(
  requirement: JobRequirement,
  candidateSkills: CandidateSkill[],
  useSemanticFallback: boolean = true,
  rawTextContext?: string
): Promise<MatchResult> {
  // Route to appropriate matcher based on skill category
  const skillCategory = requirement.category?.toLowerCase() || 'technical_skill'
  
  if (skillCategory === 'certification') {
    return findCertificationMatch(requirement, candidateSkills)
  } else if (skillCategory === 'soft_skill') {
    return findSoftSkillMatch(requirement, candidateSkills, rawTextContext)
  } else {
    // Default to technical skill matching
    return findTechnicalSkillMatch(requirement, candidateSkills, useSemanticFallback)
  }
}

/**
 * Find matches for technical skills (existing logic)
 * Uses proficiency levels and hierarchical matching
 */
async function findTechnicalSkillMatch(
  requirement: JobRequirement,
  candidateSkills: CandidateSkill[],
  useSemanticFallback: boolean = true
): Promise<MatchResult> {
  const matches: SkillMatch[] = []
  
  for (const skill of candidateSkills) {
    // Skip empty skills or wrong type
    if (!skill.name || skill.name.trim() === '') continue
    if (skill.type && skill.type !== 'technical_skill') continue
    
    // 1. Check for exact match
    if (skillRegistry.areAliases(requirement.skill, skill.name)) {
      const proficiencyResult = evaluateProficiencyMatch(requirement, skill)
      matches.push({
        type: 'exact',
        confidence: 1.0,
        evidence: `Exact match: ${skill.name} matches ${requirement.skill}`,
        candidateSkill: skill.name,
        requirement: requirement.skill,
        proficiencyMatch: proficiencyResult
      })
      continue
    }
    
    // 2. Check for alias match (already covered by areAliases above)
    
    // 3. Check if candidate skill is more specific (child qualifies for parent)
    // E.g., Django qualifies for Python requirement
    if (skillRegistry.isChildOf(skill.name, requirement.skill)) {
      const proficiencyResult = evaluateProficiencyMatch(requirement, skill)
      matches.push({
        type: 'child_qualifies',
        confidence: 0.9,
        evidence: `${skill.name} is specialized knowledge of ${requirement.skill}`,
        candidateSkill: skill.name,
        requirement: requirement.skill,
        proficiencyMatch: proficiencyResult
      })
      continue
    }
    
    // 4. Check if candidate skill is more general (parent of required)
    // E.g., Python for Django requirement (lower confidence)
    if (skillRegistry.isParentOf(skill.name, requirement.skill)) {
      const proficiencyResult = evaluateProficiencyMatch(requirement, skill)
      matches.push({
        type: 'parent_general',
        confidence: 0.7,
        evidence: `${skill.name} provides foundational knowledge for ${requirement.skill}`,
        candidateSkill: skill.name,
        requirement: requirement.skill,
        proficiencyMatch: proficiencyResult
      })
      continue
    }
    
    // 5. Check if skill qualifies for requirement
    if (skillRegistry.qualifiesFor(skill.name, requirement.skill)) {
      const proficiencyResult = evaluateProficiencyMatch(requirement, skill)
      matches.push({
        type: 'child_qualifies',
        confidence: 0.85,
        evidence: `${skill.name} qualifies for ${requirement.skill}`,
        candidateSkill: skill.name,
        requirement: requirement.skill,
        proficiencyMatch: proficiencyResult
      })
    }
  }
  
  // 6. Semantic matching as fallback (if enabled and no good matches found)
  if (useSemanticFallback && matches.filter(m => m.confidence >= 0.7).length === 0) {
    // This would integrate with OpenAI embeddings in the actual implementation
    // For now, we'll add a placeholder
    const semanticMatches = await findSemanticMatches(requirement, candidateSkills)
    matches.push(...semanticMatches)
  }
  
  // Sort matches by confidence
  matches.sort((a, b) => b.confidence - a.confidence)
  
  // Select best match
  const bestMatch = matches.length > 0 ? matches[0] : null
  
  // Calculate overall score for this requirement
  const score = calculateRequirementScore(bestMatch, requirement)
  
  // Generate explanation
  const explanation = generateMatchExplanation(bestMatch, requirement)
  
  return {
    requirement,
    matches: matches.slice(0, 3), // Return top 3 matches
    bestMatch,
    score,
    explanation
  }
}

/**
 * Evaluate proficiency match between requirement and candidate skill
 */
function evaluateProficiencyMatch(
  requirement: JobRequirement,
  candidateSkill: CandidateSkill
): { meets: boolean; score: number; explanation: string } {
  // Determine required proficiency level - prioritize explicit proficiency over years
  let requiredLevel: ProficiencyLevel
  if (requirement.proficiencyRequired) {
    // Parse explicit proficiency requirement (e.g., "expert", "advanced")
    const normalized = requirement.proficiencyRequired.toLowerCase()
    if (normalized.includes('expert')) requiredLevel = 'expert'
    else if (normalized.includes('advanced')) requiredLevel = 'advanced' 
    else requiredLevel = 'beginner'
  } else if (requirement.yearsRequired) {
    // Fall back to mapping years to proficiency
    requiredLevel = mapYOEToProficiency(requirement.yearsRequired)
  } else {
    requiredLevel = 'beginner'
  }
  
  // Determine candidate proficiency level - prioritize explicit proficiency over years
  let candidateLevel: ProficiencyLevel
  if (candidateSkill.proficiencyLevel) {
    // Parse explicit candidate proficiency
    const normalized = candidateSkill.proficiencyLevel.toLowerCase()
    if (normalized.includes('expert')) candidateLevel = 'expert'
    else if (normalized.includes('advanced')) candidateLevel = 'advanced'
    else candidateLevel = 'beginner'
  } else if (candidateSkill.yearsOfExperience) {
    // Fall back to mapping years to proficiency
    candidateLevel = mapYOEToProficiency(candidateSkill.yearsOfExperience)
  } else {
    candidateLevel = 'beginner'
  }
  
  return calculateProficiencyMatch(requiredLevel, candidateLevel)
}

/**
 * Calculate score for a requirement based on best match
 * Updated: 2025-08-27 - Changed to proficiency-focused weighting (10% skill + 90% proficiency)
 */
function calculateRequirementScore(
  bestMatch: SkillMatch | null,
  requirement: JobRequirement
): number {
  if (!bestMatch) return 0
  
  // Base score from match confidence
  let score = bestMatch.confidence * 100
  
  // Adjust for proficiency match - PROFICIENCY-FOCUSED ALGORITHM
  if (bestMatch.proficiencyMatch) {
    // Weight: 10% skill match, 90% proficiency match
    // This prioritizes "do they meet our experience level" over "do they have the skill"
    score = (score * 0.1) + (bestMatch.proficiencyMatch.score * 0.9)
  }
  
  // Cap at 100
  return Math.min(100, Math.round(score))
}

/**
 * Generate human-readable explanation for match
 */
function generateMatchExplanation(
  bestMatch: SkillMatch | null,
  requirement: JobRequirement
): string {
  if (!bestMatch) {
    return `No matching skills found for ${requirement.skill}`
  }
  
  const parts: string[] = []
  
  // Add match type explanation
  switch (bestMatch.type) {
    case 'exact':
      parts.push(`Exact match with ${bestMatch.candidateSkill}`)
      break
    case 'alias':
      parts.push(`Matched via alias: ${bestMatch.candidateSkill}`)
      break
    case 'child_qualifies':
      parts.push(`Has specialized skill: ${bestMatch.candidateSkill}`)
      break
    case 'parent_general':
      parts.push(`Has foundational skill: ${bestMatch.candidateSkill}`)
      break
    case 'semantic':
      parts.push(`Related skill: ${bestMatch.candidateSkill}`)
      break
  }
  
  // Add proficiency explanation
  if (bestMatch.proficiencyMatch) {
    parts.push(`(${bestMatch.proficiencyMatch.explanation})`)
  }
  
  return parts.join(' ')
}

/**
 * Find semantic matches using embeddings (placeholder for OpenAI integration)
 * In actual implementation, this would call OpenAI embeddings API
 */
async function findSemanticMatches(
  requirement: JobRequirement,
  candidateSkills: CandidateSkill[]
): Promise<SkillMatch[]> {
  // This is a placeholder for semantic matching
  // In production, this would:
  // 1. Get embeddings for requirement.skill from OpenAI
  // 2. Get embeddings for each candidate skill from cache or OpenAI
  // 3. Calculate cosine similarity
  // 4. Return matches above threshold
  
  const semanticMatches: SkillMatch[] = []
  
  // For now, return empty array
  // The actual implementation would integrate with OpenAI embeddings
  
  return semanticMatches
}

/**
 * Find matches for certifications (binary scoring)
 * Either you have the certification or you don't
 */
function findCertificationMatch(
  requirement: JobRequirement,
  candidateSkills: CandidateSkill[]
): Promise<MatchResult> {
  const matches: SkillMatch[] = []
  
  for (const skill of candidateSkills) {
    // Skip empty skills or wrong type
    if (!skill.name || skill.name.trim() === '') continue
    if (skill.type && skill.type !== 'certification') continue
    
    // Check for exact match or aliases
    if (skillRegistry.areAliases(requirement.skill, skill.name) ||
        normalizeString(requirement.skill) === normalizeString(skill.name)) {
      matches.push({
        type: 'exact',
        confidence: 1.0,
        evidence: `Has certification: ${skill.name}`,
        candidateSkill: skill.name,
        requirement: requirement.skill
      })
    }
    
    // Check for partial matches (e.g., "AWS Certified" matching "AWS Solutions Architect")
    else if (certificationPartialMatch(requirement.skill, skill.name)) {
      matches.push({
        type: 'alias',
        confidence: 0.9,
        evidence: `Has related certification: ${skill.name}`,
        candidateSkill: skill.name,
        requirement: requirement.skill
      })
    }
  }
  
  // For certifications: binary score (100 if found, 0 if not)
  const bestMatch = matches.length > 0 ? matches[0] : null
  const score = bestMatch ? 100 : 0
  const explanation = bestMatch 
    ? `Certification verified: ${bestMatch.candidateSkill}`
    : `Missing certification: ${requirement.skill}`
  
  return Promise.resolve({
    requirement,
    matches: matches.slice(0, 1), // Only return best match for certifications
    bestMatch,
    score,
    explanation
  })
}

/**
 * Find matches for soft skills (evidence-based scoring)
 * Scores based on multiple mentions and contexts
 */
function findSoftSkillMatch(
  requirement: JobRequirement,
  candidateSkills: CandidateSkill[],
  rawTextContext?: string
): Promise<MatchResult> {
  let evidenceCount = 0
  const evidenceSources: string[] = []
  let bestSkillMatch: CandidateSkill | null = null
  
  // 1. Check structured skills first (primary evidence)
  for (const skill of candidateSkills) {
    if (!skill.name || skill.name.trim() === '') continue
    if (skill.type && skill.type !== 'soft_skill') continue
    
    if (skillRegistry.areAliases(requirement.skill, skill.name) ||
        softSkillsRelated(requirement.skill, skill.name)) {
      evidenceCount += 2 // Strong evidence from structured skills
      evidenceSources.push(`Listed skill: ${skill.name}`)
      bestSkillMatch = skill
    }
  }
  
  // 2. Check raw text for additional evidence (secondary evidence)
  if (rawTextContext) {
    const textEvidence = findSoftSkillInText(requirement.skill, rawTextContext)
    evidenceCount += textEvidence.count
    evidenceSources.push(...textEvidence.sources)
  }
  
  // Calculate score based on evidence strength
  let score = 0
  let explanation = ''
  
  if (evidenceCount >= 4) {
    score = 100 // Strong evidence
    explanation = `Strong evidence of ${requirement.skill} (${evidenceCount} indicators)`
  } else if (evidenceCount >= 2) {
    score = 80 // Adequate evidence
    explanation = `Adequate evidence of ${requirement.skill} (${evidenceCount} indicators)`
  } else if (evidenceCount === 1) {
    score = 60 // Weak evidence
    explanation = `Limited evidence of ${requirement.skill} (${evidenceCount} indicator)`
  } else {
    score = 0 // No evidence
    explanation = `No evidence found for ${requirement.skill}`
  }
  
  const matches: SkillMatch[] = []
  if (bestSkillMatch) {
    matches.push({
      type: 'exact',
      confidence: Math.min(1.0, evidenceCount / 4), // Max confidence with 4+ pieces of evidence
      evidence: evidenceSources.join('; '),
      candidateSkill: bestSkillMatch.name,
      requirement: requirement.skill
    })
  }
  
  const bestMatch = matches.length > 0 ? matches[0] : null
  
  return Promise.resolve({
    requirement,
    matches,
    bestMatch,
    score,
    explanation
  })
}

/**
 * Helper function to normalize strings for comparison
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/[\s\-_\.]/g, '')
}

/**
 * Check if two certifications are partial matches
 */
function certificationPartialMatch(required: string, candidate: string): boolean {
  const reqWords = required.toLowerCase().split(/\s+/)
  const candWords = candidate.toLowerCase().split(/\s+/)
  
  // Check if major keywords match (AWS, Microsoft, Google, etc.)
  const majorKeywords = ['aws', 'microsoft', 'google', 'cisco', 'oracle', 'azure', 'gcp']
  
  for (const keyword of majorKeywords) {
    if (required.toLowerCase().includes(keyword) && candidate.toLowerCase().includes(keyword)) {
      return true
    }
  }
  
  // Check if at least 60% of important words match
  const importantWords = reqWords.filter(word => word.length > 3)
  const matchCount = importantWords.filter(word => 
    candWords.some(cword => cword.includes(word) || word.includes(cword))
  ).length
  
  return matchCount / importantWords.length >= 0.6
}

/**
 * Check if soft skills are related
 */
function softSkillsRelated(required: string, candidate: string): boolean {
  const relatedSkills: Record<string, string[]> = {
    'leadership': ['management', 'team lead', 'supervision', 'mentoring'],
    'communication': ['presentation', 'public speaking', 'stakeholder management', 'client relations'],
    'problem solving': ['analytical thinking', 'troubleshooting', 'critical thinking'],
    'teamwork': ['collaboration', 'team player', 'cross-functional'],
    'project management': ['planning', 'coordination', 'organization', 'time management']
  }
  
  const reqLower = required.toLowerCase()
  const candLower = candidate.toLowerCase()
  
  // Direct match
  if (reqLower.includes(candLower) || candLower.includes(reqLower)) {
    return true
  }
  
  // Check related skills
  for (const [mainSkill, related] of Object.entries(relatedSkills)) {
    if (reqLower.includes(mainSkill)) {
      return related.some(rel => candLower.includes(rel))
    }
    if (candLower.includes(mainSkill)) {
      return related.some(rel => reqLower.includes(rel))
    }
  }
  
  return false
}

/**
 * Find soft skill evidence in raw text
 */
function findSoftSkillInText(skill: string, text: string): { count: number; sources: string[] } {
  if (!text) return { count: 0, sources: [] }
  
  const textLower = text.toLowerCase()
  const skillLower = skill.toLowerCase()
  const sources: string[] = []
  let count = 0
  
  // Direct mentions
  const directMatches = (textLower.match(new RegExp(skillLower, 'g')) || []).length
  if (directMatches > 0) {
    count += Math.min(directMatches, 2) // Cap at 2 points for direct mentions
    sources.push(`Mentioned "${skill}" ${directMatches} time(s)`)
  }
  
  // Related action words
  const actionWords: Record<string, string[]> = {
    'leadership': ['led', 'managed', 'supervised', 'mentored', 'coordinated'],
    'communication': ['presented', 'communicated', 'explained', 'negotiated'],
    'problem solving': ['solved', 'resolved', 'analyzed', 'troubleshot'],
    'teamwork': ['collaborated', 'worked with', 'partnered'],
    'project management': ['planned', 'organized', 'scheduled', 'delivered']
  }
  
  const actions = actionWords[skillLower] || []
  for (const action of actions) {
    if (textLower.includes(action)) {
      count += 0.5 // Half point for action words
      sources.push(`Action word: "${action}"`)
    }
  }
  
  // Title indicators
  const titleIndicators: Record<string, string[]> = {
    'leadership': ['lead', 'manager', 'supervisor', 'director'],
    'project management': ['project manager', 'program manager', 'coordinator']
  }
  
  const titles = titleIndicators[skillLower] || []
  for (const title of titles) {
    if (textLower.includes(title)) {
      count += 1 // Full point for title indicators
      sources.push(`Job title: "${title}"`)
    }
  }
  
  return { count: Math.floor(count), sources }
}

/**
 * Match all job requirements against candidate skills
 */
export async function matchAllRequirements(
  jobRequirements: JobRequirement[],
  candidateSkills: CandidateSkill[],
  options?: {
    useSemanticFallback?: boolean
    rawTextContext?: string
  }
): Promise<MatchResult[]> {
  const results: MatchResult[] = []
  
  for (const requirement of jobRequirements) {
    const matchResult = await findSkillMatches(
      requirement,
      candidateSkills,
      options?.useSemanticFallback ?? true,
      options?.rawTextContext
    )
    results.push(matchResult)
  }
  
  return results
}

/**
 * Extract skills from raw text that might fill gaps
 * This is used for supplementary matching from unstructured data
 */
export async function extractSupplementarySkills(
  rawText: string,
  missingRequirements: string[]
): Promise<CandidateSkill[]> {
  // This would integrate with LLM to extract specific skills
  // For now, return placeholder
  
  const supplementarySkills: CandidateSkill[] = []
  
  // In production, this would:
  // 1. Use LLM to search for missingRequirements in rawText
  // 2. Extract any mentions with context
  // 3. Parse years of experience if mentioned
  // 4. Return as CandidateSkill array
  
  return supplementarySkills
}
/**
 * Core Matching Engine
 * Orchestrates the unified matching logic across all APIs
 * Updated: 2025-01-04 16:15 - Fixed remaining requirement.skill references to requirement.name (lines 116, 146, 172, 181)
 * Updated: 2025-01-04 16:25 - Added defensive checks for undefined requirement objects in match arrays (lines 117, 175, 184)
 * Updated: 2025-01-04 16:30 - Added defensive checks for requirement.importance and req.name access (lines 181, 184, 163)
 */

import { 
  CandidateSkill, 
  JobRequirement, 
  matchAllRequirements,
  extractSupplementarySkills 
} from './skill-matcher.ts'
import { 
  calculateFinalScore,
  createRequirementScore,
  OverallScore,
  RequirementScore
} from './score-calculator.ts'
import { mapYOEToProficiency } from './proficiency-calculator.ts'

export interface Candidate {
  id?: string
  firstName: string
  lastName: string
  email?: string
  yearsOfExperience?: number
  skills: CandidateSkill[]
}

export interface Job {
  id: string
  title: string
  company: string
  requirements: JobRequirement[]
}

export interface RawDataSources {
  linkedInProfile?: any
  resumeText?: string
  linkedInUrl?: string
  resumeUrl?: string
}

export interface MatchAnalysisResult {
  overallScore: OverallScore
  candidateInfo: {
    name: string
    email?: string
    yearsOfExperience?: number
    skillsCount: number
  }
  jobInfo: {
    id: string
    title: string
    company: string
    requirementsCount: {
      mandatory: number
      optional: number
    }
  }
  detailedMatches: {
    mandatory: RequirementMatchDetail[]
    optional: RequirementMatchDetail[]
  }
  metadata: {
    analysisVersion: string
    processingStrategy: string
    skillsUsed: {
      structured: number
      supplementary: number
    }
    confidence: number
  }
}

export interface RequirementMatchDetail {
  requirement: JobRequirement
  score: number
  category: string
  matchedSkills: string[]
  evidence: string[]
  confidence: number
}

/**
 * Main analysis function - orchestrates the entire matching process
 */
export async function analyzeCandidate(
  candidate: Candidate,
  job: Job,
  rawData?: RawDataSources,
  options?: {
    useSemanticFallback?: boolean
    analysisVersion?: string
  }
): Promise<MatchAnalysisResult> {
  
  // Step 1: Primary matching with structured skills
  // Prepare raw text context for soft skills
  const rawTextContext = [
    rawData?.resumeText,
    rawData?.linkedInProfile ? JSON.stringify(rawData.linkedInProfile) : null
  ].filter(Boolean).join('\n\n')
  
  const structuredMatches = await matchAllRequirements(
    job.requirements,
    candidate.skills,
    { 
      useSemanticFallback: options?.useSemanticFallback ?? true,
      rawTextContext: rawTextContext || undefined
    }
  )
  
  // Debug: Check for undefined requirements in matches
  const invalidMatches = structuredMatches.filter(match => !match.requirement || !match.requirement.name)
  if (invalidMatches.length > 0) {
    console.error('[CORE-ENGINE] Found matches with undefined requirements:', invalidMatches.length, 'out of', structuredMatches.length)
    invalidMatches.forEach((match, index) => {
      console.error(`[CORE-ENGINE] Invalid match ${index}:`, {
        hasRequirement: !!match.requirement,
        requirementKeys: match.requirement ? Object.keys(match.requirement) : 'no requirement',
        score: match.score,
        explanation: match.explanation
      })
    })
  }
  
  // Step 2: Identify gaps where structured data had weak/no matches
  const gapRequirements = structuredMatches
    .filter(match => match.score < 70)
    .filter(match => match.requirement && match.requirement.name) // Defensive check
    .map(match => match.requirement.name)
  
  // Step 3: Extract supplementary skills from raw data (if available)
  let supplementarySkills: CandidateSkill[] = []
  if (rawData && gapRequirements.length > 0) {
    // Try to find missing skills in raw data
    if (rawData.resumeText) {
      const resumeSkills = await extractSupplementarySkills(
        rawData.resumeText,
        gapRequirements
      )
      supplementarySkills.push(...resumeSkills)
    }
    
    if (rawData.linkedInProfile) {
      // Extract from LinkedIn JSON if available
      const linkedInText = JSON.stringify(rawData.linkedInProfile)
      const linkedInSkills = await extractSupplementarySkills(
        linkedInText,
        gapRequirements
      )
      supplementarySkills.push(...linkedInSkills)
    }
  }
  
  // Step 4: Re-match gap requirements with supplementary skills
  let finalMatches = structuredMatches
  if (supplementarySkills.length > 0) {
    // Re-match only the gap requirements
    const gapReqs = job.requirements.filter(req => 
      req && req.name && gapRequirements.includes(req.name)
    )
    
    const supplementaryMatches = await matchAllRequirements(
      gapReqs,
      supplementarySkills,
      { 
        useSemanticFallback: false, // No semantic for supplementary
        rawTextContext: rawTextContext || undefined
      }
    )
    
    // Merge matches (replace weak matches with better supplementary matches)
    finalMatches = mergeMatches(structuredMatches, supplementaryMatches)
  }
  
  // Step 5: Calculate scores
  const mandatoryMatches = finalMatches.filter(m => 
    m.requirement && m.requirement.importance === 'mandatory'
  )
  const optionalMatches = finalMatches.filter(m => 
    m.requirement && m.requirement.importance === 'optional'
  )
  
  const mandatoryScores = mandatoryMatches
    .filter(match => match.requirement && match.requirement.name) // Defensive check
    .map(match => 
    createRequirementScore(
      { id: match.requirement.id, name: match.requirement.name },
      match.score,
      match.bestMatch ? [match.explanation] : [],
      match.bestMatch?.confidence ?? 0
    )
  )
  
  const optionalScores = optionalMatches
    .filter(match => match.requirement && match.requirement.name) // Defensive check
    .map(match =>
    createRequirementScore(
      { id: match.requirement.id, name: match.requirement.name },
      match.score,
      match.bestMatch ? [match.explanation] : [],
      match.bestMatch?.confidence ?? 0
    )
  )
  
  const overallScore = calculateFinalScore(mandatoryScores, optionalScores)
  
  // Step 6: Prepare detailed matches
  const detailedMatches = {
    mandatory: prepareDetailedMatches(mandatoryMatches),
    optional: prepareDetailedMatches(optionalMatches)
  }
  
  // Step 7: Compile final result
  return {
    overallScore,
    candidateInfo: {
      name: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email,
      yearsOfExperience: candidate.yearsOfExperience,
      skillsCount: candidate.skills.length
    },
    jobInfo: {
      id: job.id,
      title: job.title,
      company: job.company,
      requirementsCount: {
        mandatory: mandatoryMatches.length,
        optional: optionalMatches.length
      }
    },
    detailedMatches,
    metadata: {
      analysisVersion: options?.analysisVersion ?? '2.0.0-unified',
      processingStrategy: supplementarySkills.length > 0 
        ? 'structured-primary-raw-supplementary' 
        : 'structured-only',
      skillsUsed: {
        structured: candidate.skills.length,
        supplementary: supplementarySkills.length
      },
      confidence: overallScore.confidence
    }
  }
}

/**
 * Merge structured and supplementary matches
 * Supplementary matches replace structured matches only if they have better scores
 */
function mergeMatches(
  structuredMatches: any[],
  supplementaryMatches: any[]
): any[] {
  const mergedMap = new Map()
  
  // Add all structured matches
  for (const match of structuredMatches) {
    mergedMap.set(match.requirement.id, match)
  }
  
  // Override with better supplementary matches
  for (const match of supplementaryMatches) {
    const existing = mergedMap.get(match.requirement.id)
    if (!existing || match.score > existing.score) {
      mergedMap.set(match.requirement.id, match)
    }
  }
  
  return Array.from(mergedMap.values())
}

/**
 * Prepare detailed match information for output
 */
function prepareDetailedMatches(matches: any[]): RequirementMatchDetail[] {
  return matches.map(match => ({
    requirement: match.requirement,
    score: match.score,
    category: match.score >= 80 ? 'fit' : 
              match.score >= 60 ? 'developing' :
              match.score >= 30 ? 'weak' : 'missing',
    matchedSkills: match.matches.map((m: any) => m.candidateSkill),
    evidence: match.bestMatch ? [match.explanation] : [],
    confidence: match.bestMatch?.confidence ?? 0
  }))
}

/**
 * Process LinkedIn-specific data into standard format
 */
export function processLinkedInData(linkedInProfile: any): {
  candidate: Candidate
  rawData: RawDataSources
} {
  // Extract basic info
  const firstName = linkedInProfile.firstName || 'Unknown'
  const lastName = linkedInProfile.lastName || ''
  const email = linkedInProfile.email || linkedInProfile.contactInfo?.email
  
  // Extract years of experience
  let totalYears = 0
  if (linkedInProfile.experience?.length > 0) {
    // Calculate from work history
    const experiences = linkedInProfile.experience || []
    for (const exp of experiences) {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate)
        const end = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate)
        totalYears += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
      }
    }
  }
  
  // Extract skills
  const skills: CandidateSkill[] = []
  if (linkedInProfile.skills) {
    for (const skill of linkedInProfile.skills) {
      skills.push({
        name: skill.name || skill,
        yearsOfExperience: null, // LinkedIn doesn't provide this directly
        source: 'linkedin'
      })
    }
  }
  
  return {
    candidate: {
      firstName,
      lastName,
      email,
      yearsOfExperience: Math.round(totalYears),
      skills
    },
    rawData: {
      linkedInProfile,
      linkedInUrl: linkedInProfile.url
    }
  }
}

/**
 * Process PDF resume data into standard format
 */
export function processPDFData(
  resumeText: string,
  extractedSkills: CandidateSkill[],
  candidateInfo: {
    firstName: string
    lastName: string
    email?: string
    yearsOfExperience?: number
  }
): {
  candidate: Candidate
  rawData: RawDataSources
} {
  return {
    candidate: {
      firstName: candidateInfo.firstName,
      lastName: candidateInfo.lastName,
      email: candidateInfo.email,
      yearsOfExperience: candidateInfo.yearsOfExperience,
      skills: extractedSkills.map(skill => ({
        ...skill,
        source: 'resume'
      }))
    },
    rawData: {
      resumeText
    }
  }
}

/**
 * Process existing candidate from database
 */
export function processExistingCandidate(
  candidateData: any,
  candidateSkills: any[]
): {
  candidate: Candidate
  rawData: RawDataSources
} {
  const skills: CandidateSkill[] = candidateSkills.map(skill => ({
    name: skill.skill || skill.name,
    yearsOfExperience: skill.years_of_experience,
    proficiencyLevel: skill.proficiency_level,
    type: skill.type,
    source: skill.source
  }))
  
  return {
    candidate: {
      id: candidateData.id,
      firstName: candidateData.first_name,
      lastName: candidateData.last_name,
      email: candidateData.email,
      yearsOfExperience: candidateData.years_experience,
      skills
    },
    rawData: {
      // Check if candidate has raw data stored
      linkedInUrl: candidateData.linkedin,
      resumeUrl: candidateData.resume_url
    }
  }
}
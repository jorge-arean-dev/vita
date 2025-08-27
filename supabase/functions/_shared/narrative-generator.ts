/**
 * Narrative Generator Module
 * Generates recruiter insights, feedback, and recommendations based on match analysis results
 * Focuses on proficiency level comparisons and evidence-based feedback
 * 
 * Updated: 2025-08-27 - Changed terminology from 'adequate' to 'developing'
 * Updated: 2025-08-27 - Fixed mandatory requirement counting (only 'fit' = met)
 * Updated: 2025-08-27 - Updated gaps detection to include 'developing' as unmet
 * Updated: 2025-08-27 - Changed 'strong' to 'fit' for clearer requirement matching
 * Updated: 2025-08-27 - Added context messaging for optional requirements below 'fit' threshold
 * Updated: 2025-08-27 16:45 - Fixed contradictory messaging for optional requirements below 'fit' threshold
 */

import { 
  MatchAnalysisResult, 
  RequirementMatchDetail, 
  OverallScore 
} from './core-matching-engine.ts'

interface NarrativeOutputs {
  summary: {
    strengths: string[]
    gaps: string[]
  }
  recruiter_recommendations: {
    interview_strategy: string[]
    other_options: string[]
  }
  overall_feedback: string
  requirement_evaluations: Array<{
    requirement_name: string
    score: number
    status: string
    feedback: string
  }>
}

interface NarrativeOptions {
  focusOnProficiency?: boolean
  includeInterviewStrategy?: boolean
  maxStrengths?: number
  maxGaps?: number
  maxRecommendations?: number
}

/**
 * Generate comprehensive narrative outputs based on match analysis results
 */
export async function generateNarrativeOutputs(
  analysisResult: MatchAnalysisResult,
  jobTitle: string,
  options: NarrativeOptions = {}
): Promise<NarrativeOutputs> {
  
  const {
    focusOnProficiency = true,
    includeInterviewStrategy = true,
    maxStrengths = 5,
    maxGaps = 5,
    maxRecommendations = 4
  } = options

  // Generate requirement-level feedback first
  const requirementEvaluations = await generateRequirementFeedback(
    [...analysisResult.detailedMatches.mandatory, ...analysisResult.detailedMatches.optional],
    focusOnProficiency
  )

  // Generate summary strengths and gaps
  const { strengths, gaps } = await generateStrengthsAndGaps(
    analysisResult,
    jobTitle,
    maxStrengths,
    maxGaps
  )

  // Generate recruiter recommendations
  const recruiterRecommendations = await generateRecruiterRecommendations(
    analysisResult,
    jobTitle,
    includeInterviewStrategy,
    maxRecommendations
  )

  // Generate overall feedback
  const overallFeedback = await generateOverallFeedback(
    analysisResult,
    jobTitle,
    strengths,
    gaps
  )

  return {
    summary: {
      strengths,
      gaps
    },
    recruiter_recommendations: recruiterRecommendations,
    overall_feedback: overallFeedback,
    requirement_evaluations: requirementEvaluations
  }
}

/**
 * Generate detailed feedback for each requirement with proficiency focus
 */
async function generateRequirementFeedback(
  matches: RequirementMatchDetail[],
  focusOnProficiency: boolean
): Promise<Array<{
  requirement_name: string
  score: number
  status: string
  feedback: string
}>> {
  
  return matches.map(match => {
    const requirement = match.requirement
    const score = match.score
    const category = match.category
    const matchedSkills = match.matchedSkills
    const evidence = match.evidence

    let feedback = ''

    // Generate proficiency-focused feedback
    if (focusOnProficiency && requirement.proficiencyRequired) {
      if (category === 'fit') {
        const feedbackVariations = [
          `Excellent match with required proficiency in ${requirement.skill}. ${evidence.join(' ')}`,
          `Outstanding competency demonstrated in ${requirement.skill}. ${evidence.join(' ')}`,
          `Highly qualified with proven expertise in ${requirement.skill}. ${evidence.join(' ')}`
        ]
        feedback = feedbackVariations[Math.floor(Math.random() * feedbackVariations.length)]
      } else if (category === 'developing') {
        const feedbackVariations = [
          `Good foundation in ${requirement.skill} with developing experience. ${evidence.join(' ')}`,
          `Solid competency in ${requirement.skill}. ${evidence.join(' ')}`,
          `Meets requirements for ${requirement.skill} with demonstrable experience. ${evidence.join(' ')}`
        ]
        feedback = feedbackVariations[Math.floor(Math.random() * feedbackVariations.length)]
      } else if (category === 'weak') {
        if (requirement.yearsRequired) {
          if (requirement.importance === 'mandatory') {
            feedback = `Limited experience in ${requirement.skill}. Requires ${requirement.yearsRequired} years but shows only basic familiarity. Consider assessing growth potential during interview.`
          } else {
            feedback = `Limited experience in ${requirement.skill}. Shows ${requirement.yearsRequired} years desired but candidate has basic familiarity that could be developed.`
          }
        } else {
          if (requirement.importance === 'mandatory') {
            feedback = `Basic exposure to ${requirement.skill} detected but proficiency level may need development for this role.`
          } else {
            feedback = `Basic exposure to ${requirement.skill} detected with room for growth.`
          }
        }
      } else {
        if (requirement.importance === 'mandatory') {
          feedback = `No clear evidence of ${requirement.skill} experience found. Critical gap that needs addressing.`
        } else {
          feedback = `No clear evidence of ${requirement.skill} experience found.`
        }
      }
    } else {
      // Fallback to evidence-based feedback
      if (evidence.length > 0) {
        feedback = evidence.join('. ')
      } else {
        feedback = generateBasicFeedback(requirement.skill, category, requirement.importance === 'mandatory')
      }
    }

    // Add context for optional requirements that don't meet "fit" threshold
    if (requirement.importance === 'optional' && score < 80) {
      feedback += ' As this is a nice-to-have skill, this doesn\'t impact the candidate\'s core fitness for the role.'
    }

    return {
      requirement_name: requirement.skill,
      score: score,
      status: category,
      feedback: feedback
    }
  })
}

/**
 * Generate strengths and gaps summary with variation
 */
async function generateStrengthsAndGaps(
  analysisResult: MatchAnalysisResult,
  jobTitle: string,
  maxStrengths: number,
  maxGaps: number
): Promise<{ strengths: string[], gaps: string[] }> {
  
  const allMatches = [...analysisResult.detailedMatches.mandatory, ...analysisResult.detailedMatches.optional]
  
  // Identify strengths (fit matches only - developing/weak are gaps)
  const fitMatches = allMatches.filter(m => m.category === 'fit')
    .sort((a, b) => b.score - a.score)
    .slice(0, maxStrengths)

  const strengths = fitMatches.map(match => {
    const strengthTemplates = [
      `Required proficiency in ${match.requirement.skill}`,
      `Proven expertise with ${match.requirement.skill}`,
      `Solid experience in ${match.requirement.skill}`,
      `Well-developed skills in ${match.requirement.skill}`,
      `Demonstrable competency in ${match.requirement.skill}`
    ]
    return strengthTemplates[Math.floor(Math.random() * strengthTemplates.length)]
  })

  // Identify gaps (developing + weak + missing mandatory requirements)
  // Updated 2025-08-27: "developing" is now a gap since it doesn't meet expert requirements
  const gapMatches = allMatches.filter(m => 
    (m.category === 'developing' || m.category === 'weak' || m.category === 'missing') && 
    m.requirement.importance === 'mandatory'
  ).slice(0, maxGaps)

  const gaps = gapMatches.map(match => {
    if (match.category === 'missing') {
      return `Missing required expertise in ${match.requirement.skill}`
    } else if (match.category === 'developing') {
      const developingTemplates = [
        `Developing proficiency in ${match.requirement.skill}`,
        `${match.requirement.skill} experience below required expert level`,
        `${match.requirement.skill} skills need advancement to expert level`
      ]
      return developingTemplates[Math.floor(Math.random() * developingTemplates.length)]
    } else {
      const gapTemplates = [
        `Limited experience with ${match.requirement.skill}`,
        `Basic knowledge of ${match.requirement.skill} needs strengthening`,
        `${match.requirement.skill} skills require significant development`
      ]
      return gapTemplates[Math.floor(Math.random() * gapTemplates.length)]
    }
  })

  return { strengths, gaps }
}

/**
 * Generate recruiter recommendations with interview strategy
 */
async function generateRecruiterRecommendations(
  analysisResult: MatchAnalysisResult,
  jobTitle: string,
  includeInterviewStrategy: boolean,
  maxRecommendations: number
): Promise<{
  interview_strategy: string[]
  other_options: string[]
}> {
  
  const mandatoryGaps = analysisResult.detailedMatches.mandatory
    .filter(m => m.category === 'weak' || m.category === 'missing')
  
  const overallScore = analysisResult.overallScore.totalScore
  const category = analysisResult.overallScore.category

  let interviewStrategy: string[] = []
  let otherOptions: string[] = []

  if (includeInterviewStrategy) {
    // Generate interview strategies based on gaps and strengths
    if (mandatoryGaps.length > 0) {
      const gapSkills = mandatoryGaps.map(m => m.requirement.skill).slice(0, 3)
      interviewStrategy.push(
        `Focus interview on assessing practical experience with: ${gapSkills.join(', ')}`
      )
      
      if (mandatoryGaps.some(m => m.category === 'weak')) {
        interviewStrategy.push("Ask specific scenario-based questions about recent projects involving these technologies")
      }
    }

    if (category === 'developing' || category === 'fit') {
      interviewStrategy.push("Explore leadership potential and cultural fit given solid technical foundation")
      interviewStrategy.push("Discuss career growth trajectory and alignment with role responsibilities")
    }

    // Add behavioral assessment recommendations
    const fitSkills = analysisResult.detailedMatches.mandatory
      .filter(m => m.category === 'fit')
      .map(m => m.requirement.skill)
    
    if (fitSkills.length > 0) {
      interviewStrategy.push(`Leverage proven ${fitSkills[0]} background for technical deep-dive discussions`)
    }
  }

  // Generate other recommendations based on match quality
  if (category === 'fit') {
    otherOptions = [
      "Excellent candidate - recommend fast-track interview process",
      "Consider for senior-level responsibilities within the role",
      "Great potential for mentoring junior team members"
    ]
  } else if (category === 'developing') {
    otherOptions = [
      "Solid candidate worth pursuing with structured onboarding plan",
      "Consider pairing with experienced team member for knowledge transfer",
      "Evaluate for growth potential in upcoming projects"
    ]
  } else if (category === 'weak') {
    otherOptions = [
      "Consider for junior role or with extended training period",
      "May be suitable if willing to invest in skill development",
      "Assess cultural fit and learning agility during interview"
    ]
  } else {
    otherOptions = [
      "Significant skill gaps present - recommend against proceeding",
      "Consider for different role better aligned with current skill set",
      "May require extensive training period to reach required proficiency"
    ]
  }

  return {
    interview_strategy: interviewStrategy.slice(0, maxRecommendations),
    other_options: otherOptions.slice(0, maxRecommendations)
  }
}

/**
 * Generate overall feedback summary
 */
async function generateOverallFeedback(
  analysisResult: MatchAnalysisResult,
  jobTitle: string,
  strengths: string[],
  gaps: string[]
): Promise<string> {
  
  const score = analysisResult.overallScore.totalScore
  const category = analysisResult.overallScore.category
  
  const mandatoryCount = analysisResult.jobInfo.requirementsCount.mandatory
  const mandatoryMet = analysisResult.detailedMatches.mandatory
    .filter(m => m.category === 'fit').length

  let feedback = ''

  // Score-based opening
  if (category === 'fit') {
    feedback = `This candidate demonstrates excellent alignment with the ${jobTitle} position, achieving a ${score}% match score. `
  } else if (category === 'developing') {
    feedback = `This candidate shows good potential for the ${jobTitle} role with a ${score}% match score. `
  } else if (category === 'weak') {
    feedback = `This candidate shows limited alignment with the ${jobTitle} position, scoring ${score}%. `
  } else {
    feedback = `This candidate has significant gaps for the ${jobTitle} role, with only a ${score}% match score. `
  }

  // Add mandatory requirements context
  feedback += `They meet ${mandatoryMet} out of ${mandatoryCount} mandatory requirements. `

  // Add strengths context
  if (strengths.length > 0) {
    feedback += `Key strengths include ${strengths.slice(0, 2).join(' and ').toLowerCase()}. `
  }

  // Add gaps context
  if (gaps.length > 0) {
    feedback += `Areas needing attention include ${gaps.slice(0, 2).join(' and ').toLowerCase()}. `
  }

  // Add recommendation
  if (category === 'fit') {
    feedback += "Highly recommend proceeding with interview process."
  } else if (category === 'developing') {
    feedback += "Recommend interview with focus on identified gap areas."
  } else if (category === 'weak') {
    feedback += "Consider only if candidate demonstrates exceptional learning agility and growth potential."
  } else {
    feedback += "Recommend exploring alternative candidates better aligned with role requirements."
  }

  return feedback
}

/**
 * Generate basic feedback when evidence is limited
 */
function generateBasicFeedback(
  skill: string, 
  category: string, 
  isMandatory: boolean
): string {
  if (category === 'fit') {
    return `Required expertise demonstrated in ${skill}`
  } else if (category === 'developing') {
    return `Developing experience with ${skill} identified`
  } else if (category === 'weak') {
    return `Limited proficiency in ${skill}${isMandatory ? ' - requires development for this role' : ' - basic familiarity identified'}`
  } else {
    return `No evidence of ${skill} experience found${isMandatory ? ' - critical gap' : ' - additional skill that could be valuable'}`
  }
}

/**
 * Helper function to vary content and avoid repetitive patterns
 */
export function generateVariedContent(templates: string[], context?: any): string {
  const randomIndex = Math.floor(Math.random() * templates.length)
  return templates[randomIndex]
}
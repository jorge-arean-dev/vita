/**
 * Seniority Matching Module
 * 
 * This module provides functions to match candidate seniority levels
 * against job requirements and generate scoring/feedback for the match analysis.
 */ /**
 * Seniority level hierarchy for comparison
 */ const SENIORITY_HIERARCHY = {
  'junior': 1,
  'mid': 2,
  'senior': 3,
  'lead': 4,
  'executive': 5
};
/**
 * Human-readable seniority level names
 */ const SENIORITY_DISPLAY_NAMES = {
  'junior': 'Junior',
  'mid': 'Mid-level',
  'senior': 'Senior',
  'lead': 'Lead/Principal',
  'executive': 'Executive'
};
/**
 * Calculate the difference in seniority levels
 * 
 * @param candidateLevel - The candidate's seniority level
 * @param requiredLevel - The required seniority level
 * @returns Positive if overqualified, negative if underqualified, 0 if match
 */ function calculateSeniorityGap(candidateLevel, requiredLevel) {
  if (!candidateLevel || !requiredLevel) {
    return 0;
  }
  const candidateRank = SENIORITY_HIERARCHY[candidateLevel];
  const requiredRank = SENIORITY_HIERARCHY[requiredLevel];
  return candidateRank - requiredRank;
}
/**
 * Generate feedback message based on seniority match
 * 
 * @param gap - The seniority gap (positive = overqualified, negative = underqualified)
 * @param candidateLevel - The candidate's seniority level
 * @param requiredLevel - The required seniority level
 * @returns Human-readable feedback message
 */ function generateFeedback(gap, candidateLevel, requiredLevel) {
  // Handle null cases
  if (!requiredLevel) {
    return 'No specific seniority requirement for this position';
  }
  if (!candidateLevel) {
    return 'Unable to determine candidate seniority level from available information';
  }
  const candidateName = SENIORITY_DISPLAY_NAMES[candidateLevel];
  const requiredName = SENIORITY_DISPLAY_NAMES[requiredLevel];
  // Perfect match
  if (gap === 0) {
    return `Perfect match: Candidate's ${candidateName} level aligns with the ${requiredName} requirement`;
  }
  // Overqualified cases
  if (gap > 0) {
    switch(gap){
      case 1:
        return `Candidate is slightly overqualified (${candidateName} for ${requiredName} role). Consider discussing growth opportunities and compensation expectations`;
      case 2:
        return `Candidate is overqualified (${candidateName} for ${requiredName} role). May be seeking a career change or have specific interest in the company`;
      default:
        return `Candidate is significantly overqualified (${candidateName} for ${requiredName} role). Verify motivation and long-term commitment`;
    }
  }
  // Underqualified cases
  switch(Math.abs(gap)){
    case 1:
      return `Candidate is slightly below required seniority (${candidateName} vs ${requiredName} required). May be ready to step up with right support`;
    case 2:
      return `Candidate lacks required seniority (${candidateName} vs ${requiredName} required). Consider for more junior position or future pipeline`;
    default:
      return `Significant seniority gap (${candidateName} vs ${requiredName} required). Not recommended for this level`;
  }
}
/**
 * Calculate match score based on seniority alignment
 * 
 * @param gap - The seniority gap
 * @returns Score between 0 and 1
 */ function calculateScore(gap) {
  const absGap = Math.abs(gap);
  switch(absGap){
    case 0:
      return 1.0 // Perfect match
      ;
    case 1:
      return gap > 0 ? 0.8 : 0.6 // Slightly over is better than slightly under
      ;
    case 2:
      return gap > 0 ? 0.5 : 0.3 // Overqualified is still better than underqualified
      ;
    default:
      return gap > 0 ? 0.4 : 0.1 // Significant mismatch
      ;
  }
}
/**
 * Match candidate seniority against job requirements
 * 
 * @param candidateLevel - The detected candidate seniority level
 * @param requiredLevel - The required seniority level for the job
 * @param candidateYears - Years of experience for additional context
 * @returns Complete seniority match analysis
 */ export function matchSeniority(candidateLevel, requiredLevel, candidateYears = 0) {
  // If no requirement specified, it's always a match
  if (!requiredLevel) {
    return {
      required: null,
      candidate: candidateLevel,
      candidateYears,
      match: true,
      score: 1.0,
      feedback: 'No specific seniority requirement for this position',
      isOverqualified: false,
      isUnderqualified: false
    };
  }
  // If we can't determine candidate level, provide neutral score
  if (!candidateLevel) {
    return {
      required: requiredLevel,
      candidate: null,
      candidateYears,
      match: false,
      score: 0.5,
      feedback: 'Unable to determine candidate seniority level from available information',
      isOverqualified: false,
      isUnderqualified: false
    };
  }
  // Calculate the seniority gap
  const gap = calculateSeniorityGap(candidateLevel, requiredLevel);
  // Determine match status
  const isMatch = gap >= 0 // Exact match or overqualified
  ;
  const isOverqualified = gap > 0;
  const isUnderqualified = gap < 0;
  // Calculate score
  const score = calculateScore(gap);
  // Generate feedback
  const feedback = generateFeedback(gap, candidateLevel, requiredLevel);
  return {
    required: requiredLevel,
    candidate: candidateLevel,
    candidateYears,
    match: isMatch,
    score,
    feedback,
    isOverqualified,
    isUnderqualified
  };
}
/**
 * Apply seniority penalty to overall match score
 * This is used to adjust the final match analysis score based on seniority alignment
 * 
 * @param baseScore - The original match score (0-100)
 * @param seniorityScore - The seniority match score (0-1)
 * @param weight - The weight of seniority in overall scoring (default 0.3 = 30%)
 * @returns Adjusted score with seniority penalty applied
 */ export function applySeniorityPenalty(baseScore, seniorityScore, weight = 0.3) {
  // If seniority is a perfect match or overqualified, no penalty
  if (seniorityScore >= 0.8) {
    return baseScore;
  }
  // Calculate penalty based on seniority mismatch
  const penalty = (1 - seniorityScore) * weight;
  const adjustedScore = baseScore * (1 - penalty);
  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, Math.round(adjustedScore)));
}
/**
 * Determine if seniority mismatch should trigger category change
 * Used to potentially downgrade a candidate from "fit" to "developing" based on seniority
 * 
 * @param currentCategory - The current match category
 * @param seniorityScore - The seniority match score
 * @returns The potentially adjusted category
 */ export function adjustCategoryForSeniority(currentCategory, seniorityScore) {
  // Only adjust if there's a significant seniority mismatch
  if (seniorityScore >= 0.6) {
    return currentCategory // No adjustment needed
    ;
  }
  // Downgrade by one level for significant mismatch
  if (seniorityScore < 0.3) {
    switch(currentCategory){
      case 'fit':
        return 'developing';
      case 'developing':
        return 'weak';
      default:
        return currentCategory;
    }
  }
  // Moderate mismatch - only downgrade from 'fit'
  if (currentCategory === 'fit' && seniorityScore < 0.6) {
    return 'developing';
  }
  return currentCategory;
}
/**
 * Generate recruiter recommendations based on seniority analysis
 * 
 * @param result - The seniority match result
 * @returns Array of actionable recommendations
 */ export function generateSeniorityRecommendations(result) {
  const recommendations = [];
  if (result.isOverqualified) {
    recommendations.push('Discuss career motivations and long-term goals to understand interest in this level', 'Clarify growth opportunities and timeline for advancement', 'Verify compensation expectations align with the role level');
  } else if (result.isUnderqualified) {
    const gap = result.required && result.candidate ? SENIORITY_HIERARCHY[result.required] - SENIORITY_HIERARCHY[result.candidate] : 0;
    if (gap === 1) {
      recommendations.push('Assess readiness to step up to higher responsibilities', 'Discuss support structure and mentorship available', 'Evaluate specific experiences that demonstrate next-level capabilities');
    } else {
      recommendations.push('Consider for future talent pipeline', 'Explore other open positions at appropriate level', 'Provide feedback on experience needed for target role');
    }
  }
  return recommendations;
}

/**
 * Proficiency Calculator Module
 * Handles YOE to proficiency level mapping using 3-tier system
 */ /**
 * Maps years of experience to proficiency level
 * - beginner: 0 < YOE ≤ 2.0 (hands-on experience)
 * - advanced: 2.0 < YOE ≤ 5.0 (consistent, practical experience)
 * - expert: YOE > 5.0 (in-depth, specialized experience)
 */ export function mapYOEToProficiency(years) {
  if (!years || years <= 0) return 'beginner';
  if (years <= 2.0) return 'beginner';
  if (years <= 5.0) return 'advanced';
  return 'expert';
}
/**
 * Proficiency hierarchy for comparison
 * Note: "intermediate" has been removed per requirements
 */ export const PROFICIENCY_HIERARCHY = [
  'beginner',
  'advanced',
  'expert'
];
/**
 * Get numeric index for proficiency level (for comparison)
 */ export function getProficiencyIndex(level) {
  const index = PROFICIENCY_HIERARCHY.indexOf(level);
  return index === -1 ? 0 : index;
}
export function calculateProficiencyMatch(requiredLevel, candidateLevel) {
  const reqIndex = getProficiencyIndex(requiredLevel);
  const candIndex = getProficiencyIndex(candidateLevel);
  if (candIndex >= reqIndex) {
    // Candidate meets or exceeds requirement
    if (candIndex > reqIndex) {
      // Overqualified - give bonus points (capped at 100)
      const bonus = Math.min(10, (candIndex - reqIndex) * 5);
      return {
        meets: true,
        score: Math.min(100, 90 + bonus),
        explanation: `Exceeds requirement (${candidateLevel} > ${requiredLevel})`
      };
    } else {
      // Exact match - full score
      return {
        meets: true,
        score: 100,
        explanation: `Meets requirement (${candidateLevel})`
      };
    }
  } else {
    // Candidate below requirement - apply significant penalties
    const gapSize = reqIndex - candIndex;
    let score;
    if (gapSize === 1) {
      // One level below (e.g., advanced vs expert)
      score = 65;
    } else if (gapSize === 2) {
      // Two levels below (e.g., beginner vs expert)
      score = 35;
    } else {
      // Should not happen with current 3-tier system, but handle gracefully
      score = 20;
    }
    return {
      meets: false,
      score,
      explanation: `Below requirement (${candidateLevel} < ${requiredLevel})`
    };
  }
}
/**
 * Parse proficiency from various string formats
 */ export function parseProficiencyString(proficiency) {
  if (!proficiency) return 'beginner';
  const normalized = proficiency.toLowerCase().trim();
  // Direct matches
  if (normalized.includes('expert') || normalized.includes('senior')) return 'expert';
  if (normalized.includes('advanced') || normalized.includes('experienced')) return 'advanced';
  if (normalized.includes('beginner') || normalized.includes('junior') || normalized.includes('entry')) return 'beginner';
  // Year-based parsing
  const yearMatch = normalized.match(/(\d+(\.\d+)?)\s*(year|yr|yoe)/i);
  if (yearMatch) {
    const years = parseFloat(yearMatch[1]);
    return mapYOEToProficiency(years);
  }
  // Default to beginner if uncertain
  return 'beginner';
}

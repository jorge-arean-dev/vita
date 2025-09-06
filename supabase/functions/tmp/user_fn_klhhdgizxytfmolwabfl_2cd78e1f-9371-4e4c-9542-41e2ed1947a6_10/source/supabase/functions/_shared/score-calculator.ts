/**
 * Score Calculator Module
 * Implements additive scoring system where optional requirements only boost scores
 * Updated: 2025-08-27 - Changed 'strong' to 'fit' for clearer requirement matching
 */ /**
 * Categorize a numeric score into 4-tier system
 * Updated: 2025-08-27 - Changed "adequate" to "developing" and "strong" to "fit"
 * - fit: score >= 80 (meets requirement)
 * - developing: 60 <= score < 80 (has skill but below required level)
 * - weak: 30 <= score < 60 (limited skill present)
 * - missing: score < 30 (no evidence of skill)
 */ export function categorizeScore(score) {
  if (score >= 80) return 'fit';
  if (score >= 60) return 'developing';
  if (score >= 30) return 'weak';
  return 'missing';
}
/**
 * Calculate score for mandatory requirements
 * These form the base score (0-100)
 */ export function calculateMandatoryScore(requirementScores) {
  if (requirementScores.length === 0) {
    return {
      score: 100,
      maxPossible: 100,
      breakdown: []
    };
  }
  const totalScore = requirementScores.reduce((sum, req)=>sum + req.score, 0);
  const averageScore = totalScore / requirementScores.length;
  return {
    score: Math.round(averageScore),
    maxPossible: 100,
    breakdown: requirementScores
  };
}
/**
 * Calculate bonus from optional requirements
 * Can only add to score, never subtract
 * Maximum bonus: 20 points
 */ export function calculateOptionalBonus(requirementScores) {
  if (requirementScores.length === 0) return 0;
  // Calculate how many optional requirements were met well
  const wellMetCount = requirementScores.filter((req)=>req.score >= 70).length;
  const totalOptional = requirementScores.length;
  // Bonus based on percentage of optional requirements met well
  const percentage = wellMetCount / totalOptional;
  const bonus = Math.round(percentage * 20) // Max 20 points
  ;
  return Math.min(20, bonus);
}
/**
 * Calculate final score using additive system
 * Mandatory forms base, optional adds bonus (never penalty)
 */ export function calculateFinalScore(mandatoryScores, optionalScores) {
  // Calculate mandatory base score
  const mandatory = calculateMandatoryScore(mandatoryScores);
  // Calculate optional bonus (additive only)
  const optionalBonus = calculateOptionalBonus(optionalScores);
  // Final score: mandatory + optional bonus (capped at 100)
  const totalScore = Math.min(100, mandatory.score + optionalBonus);
  // Overall confidence based on requirement confidence scores
  const allScores = [
    ...mandatoryScores,
    ...optionalScores
  ];
  const avgConfidence = allScores.length > 0 ? allScores.reduce((sum, s)=>sum + s.confidence, 0) / allScores.length : 0;
  // Generate explanation
  const explanation = generateScoreExplanation(mandatory.score, optionalBonus, mandatoryScores.length, optionalScores.length);
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
  };
}
/**
 * Generate human-readable explanation of score
 */ function generateScoreExplanation(mandatoryScore, optionalBonus, mandatoryCount, optionalCount) {
  const parts = [];
  // Mandatory explanation
  if (mandatoryScore >= 80) {
    parts.push(`Fits ${mandatoryCount} mandatory requirement${mandatoryCount !== 1 ? 's' : ''}`);
  } else if (mandatoryScore >= 60) {
    parts.push(`Developing toward mandatory requirements`);
  } else if (mandatoryScore >= 30) {
    parts.push(`Weakly meets mandatory requirements`);
  } else {
    parts.push(`Missing most mandatory requirements`);
  }
  // Optional explanation
  if (optionalBonus > 15) {
    parts.push(`excels at optional requirements (+${optionalBonus} bonus)`);
  } else if (optionalBonus > 10) {
    parts.push(`meets many optional requirements (+${optionalBonus} bonus)`);
  } else if (optionalBonus > 5) {
    parts.push(`meets some optional requirements (+${optionalBonus} bonus)`);
  } else if (optionalBonus > 0) {
    parts.push(`meets few optional requirements (+${optionalBonus} bonus)`);
  }
  return parts.join(', ');
}
/**
 * Create a requirement score object
 */ export function createRequirementScore(requirement, score, evidence, confidence = 0.85) {
  return {
    requirementId: requirement.id,
    requirementName: requirement.name,
    score: Math.round(score),
    category: categorizeScore(score),
    matched: score >= 60,
    evidence,
    confidence
  };
}

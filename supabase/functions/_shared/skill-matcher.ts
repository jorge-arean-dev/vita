// skill-matcher.ts
// Shared module for skill matching logic
// Used by: match-analysis-linkedin-v2, match-analysis-pdf-v2, match-analysis-fallback-v2
// 
// This module contains logic for matching requirements against candidate skills
// including filtering by skill type (role, industry, technology_domain, etc.)
// IMPORTANT: This file needs updating when eliminating skill types
/**
 * Skill Matcher Module
 * Handles hierarchical and semantic skill matching
 * 
 * Version: 2025-08-27 - Proficiency-Focused Algorithm
 * Major Change: Updated scoring weight from 70% skill + 30% proficiency 
 *               to 10% skill + 90% proficiency for accurate experience-level evaluation
 * 
 * Updated: 2025-01-04 15:30 - Fixed critical field name mismatch in JobRequirement interface
 * Changed: JobRequirement.skill → JobRequirement.name to match CandidateSkill.name
 * Impact: Unified field naming enables proper string matching between requirements and skills
 * Before: requirement.skill vs skill.name (undefined vs "Laravel" = no match)
 * After: requirement.name vs skill.name ("Laravel" vs "Laravel" = exact match)
 * 
 * Updated: 2025-01-04 16:20 - Added null safety check for undefined requirement objects in findSkillMatches
 * Updated: 2025-01-04 18:50 - Added missing skill type handlers for complete coverage
 * Added: findRoleMatch(), findIndustryMatch(), findTechnologyDomainMatch()
 * Coverage: All 6 database skill types now supported:
 * - technical_skill → Technical matching with proficiency (existing)
 * - technology_domain → Technical matching with proficiency (NEW)
 * - role → Role-based matching with proficiency requirement (NEW)
 * - soft_skill → Evidence-based matching, no proficiency (existing)
 * - certification → Binary matching, no proficiency (existing)
 * - industry → Domain knowledge matching with proficiency (NEW)
 */ import { skillRegistry } from './skill-registry.ts';
 import { mapYOEToProficiency, calculateProficiencyMatch } from './proficiency-calculator.ts';
 import { categorizeScore } from './score-calculator.ts';
 /**
  * Find matches between a job requirement and candidate skills
  * Routes to appropriate matcher based on skill type
  */ export async function findSkillMatches(requirement, candidateSkills, useSemanticFallback = true, rawTextContext) {
   // Defensive check for undefined requirement
   if (!requirement || !requirement.name) {
     console.error('[SKILL-MATCHER] ERROR: Undefined requirement object:', requirement);
     return {
       requirement,
       score: 0,
       explanation: 'Invalid requirement object',
       matches: [],
       bestMatch: null
     };
   }
   // Match requirement against candidate skills
   // Route to appropriate matcher based on skill category
   const skillCategory = requirement.category?.toLowerCase() || 'technical_skill';
   let result;
   if (skillCategory === 'certification') {
     result = await findCertificationMatch(requirement, candidateSkills);
   } else if (skillCategory === 'soft_skill') {
     result = await findSoftSkillMatch(requirement, candidateSkills, rawTextContext);
   } else if (skillCategory === 'role') {
     result = await findRoleMatch(requirement, candidateSkills);
   } else if (skillCategory === 'industry') {
     result = await findIndustryMatch(requirement, candidateSkills);
   } else if (skillCategory === 'technology_domain') {
     result = await findTechnologyDomainMatch(requirement, candidateSkills, useSemanticFallback);
   } else {
     // Default to technical skill matching
     result = await findTechnicalSkillMatch(requirement, candidateSkills, useSemanticFallback);
   }
   // Return final match result
   return result;
 }
 /**
  * Find matches for technical skills (existing logic)
  * Uses proficiency levels and hierarchical matching
  */ async function findTechnicalSkillMatch(requirement, candidateSkills, useSemanticFallback = true) {
   // Filter candidate skills to technical skills only
   const matches = [];
   for (const skill of candidateSkills){
     // Skip empty skills or wrong type
     if (!skill.name || skill.name.trim() === '') continue;
     if (skill.type && skill.type !== 'technical_skill') continue;
     // Check each technical skill for match
     // 1. Check for exact match
     const areAliases = skillRegistry.areAliases(requirement.name, skill.name);
     // Check for exact match and aliases
     if (areAliases) {
       // Exact match found
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'exact',
         confidence: 1.0,
         evidence: `Exact match: ${skill.name} matches ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
       continue;
     }
     // 2. Check for alias match (already covered by areAliases above)
     // 3. Check if candidate skill is more specific (child qualifies for parent)
     // E.g., Django qualifies for Python requirement
     if (skillRegistry.isChildOf(skill.name, requirement.name)) {
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'child_qualifies',
         confidence: 0.9,
         evidence: `${skill.name} is specialized knowledge of ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
       continue;
     }
     // 4. Check if candidate skill is more general (parent of required)
     // E.g., Python for Django requirement (lower confidence)
     if (skillRegistry.isParentOf(skill.name, requirement.name)) {
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'parent_general',
         confidence: 0.7,
         evidence: `${skill.name} provides foundational knowledge for ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
       continue;
     }
     // 5. Check if skill qualifies for requirement
     if (skillRegistry.qualifiesFor(skill.name, requirement.name)) {
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'child_qualifies',
         confidence: 0.85,
         evidence: `${skill.name} qualifies for ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
     }
   }
   // 6. Semantic matching as fallback (if enabled and no good matches found)
   if (useSemanticFallback && matches.filter((m)=>m.confidence >= 0.7).length === 0) {
     // This would integrate with OpenAI embeddings in the actual implementation
     // For now, we'll add a placeholder
     const semanticMatches = await findSemanticMatches(requirement, candidateSkills);
     matches.push(...semanticMatches);
   }
   // Sort matches by confidence
   matches.sort((a, b)=>b.confidence - a.confidence);
   // Select best match
   const bestMatch = matches.length > 0 ? matches[0] : null;
   // Calculate overall score for this requirement
   const score = calculateRequirementScore(bestMatch, requirement);
   // Generate explanation
   const explanation = generateMatchExplanation(bestMatch, requirement);
   return {
     requirement,
     matches: matches.slice(0, 3),
     bestMatch,
     score,
     explanation
   };
 }
 /**
  * Evaluate proficiency match between requirement and candidate skill
  */ function evaluateProficiencyMatch(requirement, candidateSkill) {
   // Determine required proficiency level - prioritize explicit proficiency over years
   let requiredLevel;
   if (requirement.proficiencyRequired) {
     // Parse explicit proficiency requirement (e.g., "expert", "advanced")
     const normalized = requirement.proficiencyRequired.toLowerCase();
     if (normalized.includes('expert')) requiredLevel = 'expert';
     else if (normalized.includes('advanced')) requiredLevel = 'advanced';
     else requiredLevel = 'beginner';
   } else if (requirement.yearsRequired) {
     // Fall back to mapping years to proficiency
     requiredLevel = mapYOEToProficiency(requirement.yearsRequired);
   } else {
     requiredLevel = 'beginner';
   }
   // Determine candidate proficiency level - prioritize explicit proficiency over years
   let candidateLevel;
   if (candidateSkill.proficiencyLevel) {
     // Parse explicit candidate proficiency
     const normalized = candidateSkill.proficiencyLevel.toLowerCase();
     if (normalized.includes('expert')) candidateLevel = 'expert';
     else if (normalized.includes('advanced')) candidateLevel = 'advanced';
     else candidateLevel = 'beginner';
   } else if (candidateSkill.yearsOfExperience) {
     // Fall back to mapping years to proficiency
     candidateLevel = mapYOEToProficiency(candidateSkill.yearsOfExperience);
   } else {
     candidateLevel = 'beginner';
   }
   return calculateProficiencyMatch(requiredLevel, candidateLevel);
 }
 /**
  * Calculate score for a requirement based on best match
  * Updated: 2025-08-27 - Changed to proficiency-focused weighting (10% skill + 90% proficiency)
  */ function calculateRequirementScore(bestMatch, requirement) {
   if (!bestMatch) return 0;
   // Base score from match confidence
   let score = bestMatch.confidence * 100;
   // Adjust for proficiency match - PROFICIENCY-FOCUSED ALGORITHM
   if (bestMatch.proficiencyMatch) {
     // Weight: 10% skill match, 90% proficiency match
     // This prioritizes "do they meet our experience level" over "do they have the skill"
     score = score * 0.1 + bestMatch.proficiencyMatch.score * 0.9;
   }
   // Cap at 100
   return Math.min(100, Math.round(score));
 }
 /**
  * Generate human-readable explanation for match
  */ function generateMatchExplanation(bestMatch, requirement) {
   if (!bestMatch) {
     return `No matching skills found for ${requirement.name}`;
   }
   const parts = [];
   // Add match type explanation
   switch(bestMatch.type){
     case 'exact':
       parts.push(`Exact match with ${bestMatch.candidateSkill}`);
       break;
     case 'alias':
       parts.push(`Matched via alias: ${bestMatch.candidateSkill}`);
       break;
     case 'child_qualifies':
       parts.push(`Has specialized skill: ${bestMatch.candidateSkill}`);
       break;
     case 'parent_general':
       parts.push(`Has foundational skill: ${bestMatch.candidateSkill}`);
       break;
     case 'semantic':
       parts.push(`Related skill: ${bestMatch.candidateSkill}`);
       break;
   }
   // Add proficiency explanation
   if (bestMatch.proficiencyMatch) {
     parts.push(`(${bestMatch.proficiencyMatch.explanation})`);
   }
   return parts.join(' ');
 }
 /**
  * Find semantic matches using embeddings (placeholder for OpenAI integration)
  * In actual implementation, this would call OpenAI embeddings API
  */ async function findSemanticMatches(requirement, candidateSkills) {
   // This is a placeholder for semantic matching
   // In production, this would:
   // 1. Get embeddings for requirement.skill from OpenAI
   // 2. Get embeddings for each candidate skill from cache or OpenAI
   // 3. Calculate cosine similarity
   // 4. Return matches above threshold
   const semanticMatches = [];
   // For now, return empty array
   // The actual implementation would integrate with OpenAI embeddings
   return semanticMatches;
 }
 /**
  * Find matches for certifications (binary scoring)
  * Either you have the certification or you don't
  */ function findCertificationMatch(requirement, candidateSkills) {
   const matches = [];
   for (const skill of candidateSkills){
     // Skip empty skills or wrong type
     if (!skill.name || skill.name.trim() === '') continue;
     if (skill.type && skill.type !== 'certification') continue;
     // Check for exact match or aliases
     if (skillRegistry.areAliases(requirement.name, skill.name) || normalizeString(requirement.name) === normalizeString(skill.name)) {
       matches.push({
         type: 'exact',
         confidence: 1.0,
         evidence: `Has certification: ${skill.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name
       });
     } else if (certificationPartialMatch(requirement.name, skill.name)) {
       matches.push({
         type: 'alias',
         confidence: 0.9,
         evidence: `Has related certification: ${skill.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name
       });
     }
   }
   // For certifications: binary score (100 if found, 0 if not)
   const bestMatch = matches.length > 0 ? matches[0] : null;
   const score = bestMatch ? 100 : 0;
   const explanation = bestMatch ? `Certification verified: ${bestMatch.candidateSkill}` : `Missing certification: ${requirement.name}`;
   return Promise.resolve({
     requirement,
     matches: matches.slice(0, 1),
     bestMatch,
     score,
     explanation
   });
 }
 /**
  * Find matches for soft skills (evidence-based scoring)
  * Scores based on multiple mentions and contexts
  */ function findSoftSkillMatch(requirement, candidateSkills, rawTextContext) {
   let evidenceCount = 0;
   const evidenceSources = [];
   let bestSkillMatch = null;
   // 1. Check structured skills first (primary evidence)
   for (const skill of candidateSkills){
     if (!skill.name || skill.name.trim() === '') continue;
     if (skill.type && skill.type !== 'soft_skill') continue;
     if (skillRegistry.areAliases(requirement.name, skill.name) || softSkillsRelated(requirement.name, skill.name)) {
       evidenceCount += 2 // Strong evidence from structured skills
       ;
       evidenceSources.push(`Listed skill: ${skill.name}`);
       bestSkillMatch = skill;
     }
   }
   // 2. Check raw text for additional evidence (secondary evidence)
   if (rawTextContext) {
     const textEvidence = findSoftSkillInText(requirement.name, rawTextContext);
     evidenceCount += textEvidence.count;
     evidenceSources.push(...textEvidence.sources);
   }
   // Calculate score based on evidence strength
   let score = 0;
   let explanation = '';
   if (evidenceCount >= 4) {
     score = 100 // Strong evidence
     ;
     explanation = `Strong evidence of ${requirement.name} (${evidenceCount} indicators)`;
   } else if (evidenceCount >= 2) {
     score = 80 // Adequate evidence
     ;
     explanation = `Adequate evidence of ${requirement.name} (${evidenceCount} indicators)`;
   } else if (evidenceCount === 1) {
     score = 60 // Weak evidence
     ;
     explanation = `Limited evidence of ${requirement.name} (${evidenceCount} indicator)`;
   } else {
     score = 0 // No evidence
     ;
     explanation = `No evidence found for ${requirement.name}`;
   }
   const matches = [];
   if (bestSkillMatch) {
     matches.push({
       type: 'exact',
       confidence: Math.min(1.0, evidenceCount / 4),
       evidence: evidenceSources.join('; '),
       candidateSkill: bestSkillMatch.name,
       requirement: requirement.name
     });
   }
   const bestMatch = matches.length > 0 ? matches[0] : null;
   return Promise.resolve({
     requirement,
     matches,
     bestMatch,
     score,
     explanation
   });
 }
 /**
  * Helper function to normalize strings for comparison
  */ function normalizeString(str) {
   return str.toLowerCase().trim().replace(/[\s\-_\.]/g, '');
 }
 /**
  * Check if two certifications are partial matches
  */ function certificationPartialMatch(required, candidate) {
   const reqWords = required.toLowerCase().split(/\s+/);
   const candWords = candidate.toLowerCase().split(/\s+/);
   // Check if major keywords match (AWS, Microsoft, Google, etc.)
   const majorKeywords = [
     'aws',
     'microsoft',
     'google',
     'cisco',
     'oracle',
     'azure',
     'gcp'
   ];
   for (const keyword of majorKeywords){
     if (required.toLowerCase().includes(keyword) && candidate.toLowerCase().includes(keyword)) {
       return true;
     }
   }
   // Check if at least 60% of important words match
   const importantWords = reqWords.filter((word)=>word.length > 3);
   const matchCount = importantWords.filter((word)=>candWords.some((cword)=>cword.includes(word) || word.includes(cword))).length;
   return matchCount / importantWords.length >= 0.6;
 }
 /**
  * Check if soft skills are related
  */ function softSkillsRelated(required, candidate) {
   const relatedSkills = {
     'leadership': [
       'management',
       'team lead',
       'supervision',
       'mentoring'
     ],
     'communication': [
       'presentation',
       'public speaking',
       'stakeholder management',
       'client relations'
     ],
     'problem solving': [
       'analytical thinking',
       'troubleshooting',
       'critical thinking'
     ],
     'teamwork': [
       'collaboration',
       'team player',
       'cross-functional'
     ],
     'project management': [
       'planning',
       'coordination',
       'organization',
       'time management'
     ]
   };
   const reqLower = required.toLowerCase();
   const candLower = candidate.toLowerCase();
   // Direct match
   if (reqLower.includes(candLower) || candLower.includes(reqLower)) {
     return true;
   }
   // Check related skills
   for (const [mainSkill, related] of Object.entries(relatedSkills)){
     if (reqLower.includes(mainSkill)) {
       return related.some((rel)=>candLower.includes(rel));
     }
     if (candLower.includes(mainSkill)) {
       return related.some((rel)=>reqLower.includes(rel));
     }
   }
   return false;
 }
 /**
  * Find soft skill evidence in raw text
  */ function findSoftSkillInText(skill, text) {
   if (!text) return {
     count: 0,
     sources: []
   };
   const textLower = text.toLowerCase();
   const skillLower = skill.toLowerCase();
   const sources = [];
   let count = 0;
   // Direct mentions
   const directMatches = (textLower.match(new RegExp(skillLower, 'g')) || []).length;
   if (directMatches > 0) {
     count += Math.min(directMatches, 2) // Cap at 2 points for direct mentions
     ;
     sources.push(`Mentioned "${skill}" ${directMatches} time(s)`);
   }
   // Related action words
   const actionWords = {
     'leadership': [
       'led',
       'managed',
       'supervised',
       'mentored',
       'coordinated'
     ],
     'communication': [
       'presented',
       'communicated',
       'explained',
       'negotiated'
     ],
     'problem solving': [
       'solved',
       'resolved',
       'analyzed',
       'troubleshot'
     ],
     'teamwork': [
       'collaborated',
       'worked with',
       'partnered'
     ],
     'project management': [
       'planned',
       'organized',
       'scheduled',
       'delivered'
     ]
   };
   const actions = actionWords[skillLower] || [];
   for (const action of actions){
     if (textLower.includes(action)) {
       count += 0.5 // Half point for action words
       ;
       sources.push(`Action word: "${action}"`);
     }
   }
   // Title indicators
   const titleIndicators = {
     'leadership': [
       'lead',
       'manager',
       'supervisor',
       'director'
     ],
     'project management': [
       'project manager',
       'program manager',
       'coordinator'
     ]
   };
   const titles = titleIndicators[skillLower] || [];
   for (const title of titles){
     if (textLower.includes(title)) {
       count += 1 // Full point for title indicators
       ;
       sources.push(`Job title: "${title}"`);
     }
   }
   return {
     count: Math.floor(count),
     sources
   };
 }
 /**
  * Match all job requirements against candidate skills
  */ export async function matchAllRequirements(jobRequirements, candidateSkills, options) {
   // Process all job requirements against candidate skills
   const results = [];
   for (const requirement of jobRequirements){
     // Process individual requirement
     const matchResult = await findSkillMatches(requirement, candidateSkills, options?.useSemanticFallback ?? true, options?.rawTextContext);
     // Store match result
     results.push(matchResult);
   }
   // All requirements processed
   return results;
 }
 /**
  * Extract skills from raw text that might fill gaps
  * This is used for supplementary matching from unstructured data
  */ export async function extractSupplementarySkills(rawText, missingRequirements) {
   // This would integrate with LLM to extract specific skills
   // For now, return placeholder
   const supplementarySkills = [];
   // In production, this would:
   // 1. Use LLM to search for missingRequirements in rawText
   // 2. Extract any mentions with context
   // 3. Parse years of experience if mentioned
   // 4. Return as CandidateSkill array
   return supplementarySkills;
 }
 /**
  * Find matches for roles (job titles & experience with proficiency)
  * MUST HAVE proficiency level for meaningful comparison
  * 
  * Added: 2025-01-04 18:50 - New skill type handler for role-based matching
  * Purpose: Handle job titles and role requirements with proficiency evaluation
  * Examples: "Tech Lead", "Senior Developer", "Product Manager"
  */ async function findRoleMatch(requirement, candidateSkills) {
   console.log(`[ROLE-MATCHER] Starting role match for "${requirement.name}"`);
   console.log(`[ROLE-MATCHER] Candidate skills (role type):`, candidateSkills.filter((s)=>s.type === 'role').map((s)=>s.name));
   const matches = [];
   for (const skill of candidateSkills){
     // Skip empty skills or wrong type
     if (!skill.name || skill.name.trim() === '') continue;
     if (skill.type && skill.type !== 'role') continue;
     // Check each role skill for match
     // Check for exact match or aliases
     if (skillRegistry.areAliases(requirement.name, skill.name) || normalizeString(requirement.name) === normalizeString(skill.name)) {
       console.log(`[ROLE-MATCHER] EXACT ROLE MATCH FOUND: "${skill.name}" matches "${requirement.name}"`);
       // Role matching MUST have proficiency for meaningful comparison
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'exact',
         confidence: 1.0,
         evidence: `Role match: ${skill.name} matches ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
       continue;
     }
     // Check if candidate's role qualifies for the requirement
     // Added: 2025-01-04 23:40 - Check if senior roles qualify for junior requirements (e.g., CTO qualifies for Tech Lead)
     if (skillRegistry.qualifiesFor(skill.name, requirement.name)) {
       console.log(`[ROLE-MATCHER] QUALIFIES FOR MATCH: "${skill.name}" qualifies for "${requirement.name}"`);
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'child_qualifies',
         confidence: 0.95,
         evidence: `Senior role qualification: ${skill.name} qualifies for ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
       continue;
     }
     // Check for partial role matches (e.g., "Senior Tech Lead" matches "Tech Lead")
     if (skill.name.toLowerCase().includes(requirement.name.toLowerCase()) || requirement.name.toLowerCase().includes(skill.name.toLowerCase())) {
       console.log(`[ROLE-MATCHER] PARTIAL ROLE MATCH: "${skill.name}" partially matches "${requirement.name}"`);
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'semantic',
         confidence: 0.8,
         evidence: `Partial role match: ${skill.name} relates to ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
     }
   }
   // Calculate best match and score
   const bestMatch = matches.length > 0 ? matches[0] : null;
   const score = calculateRequirementScore(bestMatch, requirement);
   const category = categorizeScore(score);
   const explanation = generateMatchExplanation(bestMatch, requirement);
   console.log(`[ROLE-MATCHER] Role match result for "${requirement.name}": score=${score}, matches=${matches.length}`);
   return {
     requirement,
     score,
     category,
     matches,
     bestMatch,
     explanation,
     matchType: bestMatch?.type || 'none'
   };
 }
 /**
  * Find matches for industries (domain knowledge with proficiency) 
  * MUST HAVE proficiency level for meaningful comparison
  * 
  * Added: 2025-01-04 18:50 - New skill type handler for industry domain matching
  * Purpose: Handle industry knowledge and domain expertise with proficiency evaluation
  * Examples: "Healthcare", "Financial Services", "E-commerce", "SaaS"
  */ async function findIndustryMatch(requirement, candidateSkills) {
   console.log(`[INDUSTRY-MATCHER] Starting industry match for "${requirement.name}"`);
   console.log(`[INDUSTRY-MATCHER] Candidate skills (industry type):`, candidateSkills.filter((s)=>s.type === 'industry').map((s)=>s.name));
   const matches = [];
   for (const skill of candidateSkills){
     // Skip empty skills or wrong type
     if (!skill.name || skill.name.trim() === '') continue;
     if (skill.type && skill.type !== 'industry') continue;
     console.log(`[INDUSTRY-MATCHER] Checking industry skill: "${skill.name}" against requirement: "${requirement.name}"`);
     // Check for exact match or aliases
     if (skillRegistry.areAliases(requirement.name, skill.name) || normalizeString(requirement.name) === normalizeString(skill.name)) {
       console.log(`[INDUSTRY-MATCHER] EXACT INDUSTRY MATCH FOUND: "${skill.name}" matches "${requirement.name}"`);
       // Industry matching MUST have proficiency for meaningful comparison  
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'exact',
         confidence: 1.0,
         evidence: `Industry match: ${skill.name} matches ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
       continue;
     }
     // Check for related industry domains
     if (skill.name.toLowerCase().includes(requirement.name.toLowerCase()) || requirement.name.toLowerCase().includes(skill.name.toLowerCase())) {
       console.log(`[INDUSTRY-MATCHER] RELATED INDUSTRY MATCH: "${skill.name}" relates to "${requirement.name}"`);
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'semantic',
         confidence: 0.7,
         evidence: `Related industry: ${skill.name} relates to ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
     }
   }
   // Calculate best match and score
   const bestMatch = matches.length > 0 ? matches[0] : null;
   const score = calculateRequirementScore(bestMatch, requirement);
   const category = categorizeScore(score);
   const explanation = generateMatchExplanation(bestMatch, requirement);
   console.log(`[INDUSTRY-MATCHER] Industry match result for "${requirement.name}": score=${score}, matches=${matches.length}`);
   return {
     requirement,
     score,
     category,
     matches,
     bestMatch,
     explanation,
     matchType: bestMatch?.type || 'none'
   };
 }
 /**
  * Find matches for technology domains (technical matching with proficiency)
  * Same as technical skills but for broader technology categories
  * 
  * Added: 2025-01-04 18:50 - New skill type handler for technology domain matching
  * Purpose: Handle broader technology categories with same logic as technical skills
  * Examples: "Cloud Computing", "AI/ML", "DevOps", "Web Development", "Mobile Development"
  * Logic: Uses skill registry hierarchy + proficiency evaluation like technical skills
  */ async function findTechnologyDomainMatch(requirement, candidateSkills, useSemanticFallback = true) {
   console.log(`[TECH-DOMAIN-MATCHER] Starting technology domain match for "${requirement.name}"`);
   console.log(`[TECH-DOMAIN-MATCHER] Candidate skills (technology_domain type):`, candidateSkills.filter((s)=>s.type === 'technology_domain').map((s)=>s.name));
   const matches = [];
   for (const skill of candidateSkills){
     // Skip empty skills or wrong type
     if (!skill.name || skill.name.trim() === '') continue;
     if (skill.type && skill.type !== 'technology_domain') continue;
     console.log(`[TECH-DOMAIN-MATCHER] Checking tech domain: "${skill.name}" against requirement: "${requirement.name}"`);
     // 1. Check for exact match
     const areAliases = skillRegistry.areAliases(requirement.name, skill.name);
     console.log(`[TECH-DOMAIN-MATCHER] Are aliases check for "${requirement.name}" vs "${skill.name}": ${areAliases}`);
     if (areAliases) {
       console.log(`[TECH-DOMAIN-MATCHER] EXACT TECH DOMAIN MATCH FOUND: "${skill.name}" matches "${requirement.name}"`);
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'exact',
         confidence: 1.0,
         evidence: `Technology domain match: ${skill.name} matches ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
       continue;
     }
     // 2. Check if candidate skill is more specific (child qualifies for parent)
     if (skillRegistry.isChildOf(skill.name, requirement.name)) {
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'child_qualifies',
         confidence: 0.9,
         evidence: `Specialized tech domain: ${skill.name} qualifies for ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
       continue;
     }
     // 3. Check if candidate skill is more general (parent covers child)
     if (skillRegistry.isParentOf(skill.name, requirement.name)) {
       const proficiencyResult = evaluateProficiencyMatch(requirement, skill);
       matches.push({
         type: 'parent_general',
         confidence: 0.7,
         evidence: `General tech domain: ${skill.name} covers ${requirement.name}`,
         candidateSkill: skill.name,
         requirement: requirement.name,
         proficiencyMatch: proficiencyResult
       });
     }
   }
   // 4. Semantic matching for technology domains (if enabled and no matches)
   if (useSemanticFallback && matches.length === 0) {
     const semanticMatches = await findSemanticMatches(requirement, candidateSkills);
     matches.push(...semanticMatches);
   }
   // Calculate best match and score
   const bestMatch = matches.length > 0 ? matches.sort((a, b)=>b.confidence - a.confidence)[0] : null;
   const score = calculateRequirementScore(bestMatch, requirement);
   const category = categorizeScore(score);
   const explanation = generateMatchExplanation(bestMatch, requirement);
   console.log(`[TECH-DOMAIN-MATCHER] Tech domain match result for "${requirement.name}": score=${score}, matches=${matches.length}`);
   return {
     requirement,
     score,
     category,
     matches,
     bestMatch,
     explanation,
     matchType: bestMatch?.type || 'none'
   };
 }
 
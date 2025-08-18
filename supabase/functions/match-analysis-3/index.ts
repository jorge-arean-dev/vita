// Enhanced Match Analysis API v3 - Simplified Embedding-Based Analysis
// Maintains exact same output format as original match-analysis.ts but with improved accuracy
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Types based on existing API structure
interface CandidateSkill {
  name: string;
  type: 'technical_skill' | 'soft_skill' | 'role' | 'certification' | 'industry' | 'technology_domain';
  yoe: number | null;
  proficiency_level: 'beginner' | 'advanced' | 'expert' | null;
}

interface JobRequirement {
  requirement: string;
  type: string;
  is_mandatory: boolean;
  proficiency_level: 'beginner' | 'advanced' | 'expert' | null;
  weight: number;
}

interface LinkedInProfile {
  firstName: string;
  lastName: string;
  about: string;
  headline: string;
  experiences: Array<{
    title: string;
    subtitle: string;
    caption: string;
    description: string;
  }>;
  skills: Array<{
    title: string;
    subComponents: Array<{
      description: Array<{
        type: string;
        text: string;
      }>;
    }>;
  }>;
  recommendations?: Array<{
    section_name: string;
    section_components: Array<{
      subComponents: Array<{
        fixedListComponent: Array<{
          text: string;
        }>;
      }>;
    }>;
  }>;
}

interface SkillMatch {
  skill: string;
  similarity: number;
  matchType: 'exact' | 'semantic' | 'related';
  yearsExperience: number;
  evidence: string[];
  confidence: number;
}

// Skill hierarchy for relationship understanding
const SKILL_RELATIONSHIPS = {
  // Programming Languages and Frameworks
  'python': {
    children: ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
    domain: 'programming'
  },
  'javascript': {
    children: ['react', 'vue', 'angular', 'node.js', 'express', 'next.js', 'nuxt'],
    domain: 'programming'
  },
  'java': {
    children: ['spring', 'hibernate', 'maven', 'gradle'],
    domain: 'programming'
  },
  'typescript': {
    children: ['angular', 'nest.js'],
    parent: 'javascript',
    domain: 'programming'
  },
  'react': {
    parent: 'javascript',
    children: ['next.js', 'gatsby', 'react native'],
    domain: 'frontend'
  },
  'node.js': {
    parent: 'javascript',
    children: ['express', 'nest.js', 'fastify'],
    domain: 'backend'
  },
  
  // Cloud and Infrastructure
  'cloud': {
    children: ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
    domain: 'infrastructure'
  },
  'aws': {
    parent: 'cloud',
    children: ['s3', 'ec2', 'lambda', 'rds'],
    domain: 'cloud-platform'
  },
  'azure': {
    parent: 'cloud',
    children: ['azure functions', 'cosmos db'],
    domain: 'cloud-platform'
  },
  'docker': {
    parent: 'cloud',
    children: ['kubernetes', 'docker compose'],
    domain: 'containerization'
  },
  
  // Databases
  'database': {
    children: ['postgresql', 'mysql', 'mongodb', 'redis'],
    domain: 'data'
  },
  'sql': {
    children: ['postgresql', 'mysql', 'sql server'],
    domain: 'database'
  },
  'postgresql': {
    parent: 'database',
    aliases: ['postgres'],
    domain: 'relational-db'
  },
  'mongodb': {
    parent: 'database',
    aliases: ['mongo'],
    domain: 'nosql-db'
  },
  
  // Web Development
  'frontend': {
    children: ['react', 'vue', 'angular', 'html', 'css', 'javascript'],
    domain: 'web-development'
  },
  'backend': {
    children: ['node.js', 'python', 'java', 'api development'],
    domain: 'web-development'
  }
};

// Common skill variations and aliases
const SKILL_ALIASES = {
  'react.js': 'react',
  'reactjs': 'react',
  'node': 'node.js',
  'nodejs': 'node.js',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'js': 'javascript',
  'ts': 'typescript',
  'k8s': 'kubernetes',
  'vue.js': 'vue',
  'vuejs': 'vue'
};

// Proficiency level mapping
const PROFICIENCY_LEVELS = {
  'beginner': 1,
  'advanced': 2,
  'expert': 3
};

// Generate OpenAI embedding for text
async function generateEmbedding(text: string, openaiApiKey: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.toLowerCase().trim(),
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI embeddings API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Validate inputs
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    console.error('cosineSimilarity: Invalid input - not arrays', { vecA: typeof vecA, vecB: typeof vecB });
    return 0;
  }
  
  if (vecA.length !== vecB.length) {
    console.error('cosineSimilarity: Vector dimension mismatch', { vecA: vecA.length, vecB: vecB.length });
    return 0;
  }
  
  if (vecA.length === 0 || vecB.length === 0) {
    console.error('cosineSimilarity: Empty vectors');
    return 0;
  }
  
  // Verify all elements are numbers
  if (!vecA.every(x => typeof x === 'number') || !vecB.every(x => typeof x === 'number')) {
    console.error('cosineSimilarity: Non-numeric elements in vectors');
    return 0;
  }
  
  try {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    const similarity = dotProduct / (magnitudeA * magnitudeB);
    
    // Ensure result is within valid range
    if (isNaN(similarity) || !isFinite(similarity)) {
      console.error('cosineSimilarity: Invalid result', { similarity, dotProduct, magnitudeA, magnitudeB });
      return 0;
    }
    
    return Math.max(-1, Math.min(1, similarity)); // Clamp to [-1, 1]
  } catch (error) {
    console.error('cosineSimilarity: Calculation error', error);
    return 0;
  }
}

// Get or create cached embedding
async function getCachedEmbedding(text: string, supabase: any, openaiApiKey: string): Promise<number[]> {
  try {
    const normalizedText = text.toLowerCase().trim();
    
    // Try to get from cache first
    const { data: cached, error } = await supabase
      .from('skill_embeddings')
      .select('embedding')
      .eq('skill_text', normalizedText)
      .single();

    if (!error && cached?.embedding) {
      // Ensure the cached embedding is a proper array
      let cachedEmbedding = cached.embedding;
      
      // Handle different possible formats from Supabase
      if (typeof cachedEmbedding === 'string') {
        // If it's a string, try to parse it
        try {
          cachedEmbedding = JSON.parse(cachedEmbedding);
        } catch (parseError) {
          console.log(`Failed to parse cached embedding for ${normalizedText}, regenerating...`);
          cachedEmbedding = null;
        }
      }
      
      // Verify it's an array of numbers
      if (Array.isArray(cachedEmbedding) && cachedEmbedding.length > 0 && typeof cachedEmbedding[0] === 'number') {
        return cachedEmbedding;
      } else {
        console.log(`Invalid cached embedding format for ${normalizedText}, regenerating...`);
      }
    }

    // Generate new embedding
    const embedding = await generateEmbedding(normalizedText, openaiApiKey);
    
    // Verify the generated embedding is valid
    if (!Array.isArray(embedding) || embedding.length === 0 || typeof embedding[0] !== 'number') {
      throw new Error(`Invalid embedding generated for: ${normalizedText}`);
    }
    
    // Cache it (fire and forget - don't block on caching failures)
    supabase
      .from('skill_embeddings')
      .insert({
        skill_text: normalizedText,
        embedding: embedding,
        model_version: 'text-embedding-3-small'
      })
      .then(() => console.log(`Cached embedding for: ${normalizedText}`))
      .catch((error: any) => console.log(`Cache error for: ${normalizedText}`, error));

    return embedding;
  } catch (error) {
    console.error('Error with cached embedding:', error);
    // Fallback: generate without caching
    try {
      const fallbackEmbedding = await generateEmbedding(text, openaiApiKey);
      if (Array.isArray(fallbackEmbedding) && fallbackEmbedding.length > 0) {
        return fallbackEmbedding;
      }
    } catch (fallbackError) {
      console.error('Fallback embedding generation failed:', fallbackError);
    }
    
    // Return a zero vector as last resort
    console.warn(`Returning zero vector for: ${text}`);
    return new Array(1536).fill(0);
  }
}

// Normalize skill name using aliases
function normalizeSkillName(skillName: string): string {
  const normalized = skillName.toLowerCase().trim();
  return SKILL_ALIASES[normalized] || normalized;
}

// Check if skill A is related to skill B using hierarchy
function getSkillRelationship(skillA: string, skillB: string): {
  isRelated: boolean;
  relationship: 'exact' | 'parent' | 'child' | 'sibling' | 'alias';
  confidence: number;
} {
  const normalizedA = normalizeSkillName(skillA);
  const normalizedB = normalizeSkillName(skillB);
  
  // Exact match
  if (normalizedA === normalizedB) {
    return { isRelated: true, relationship: 'exact', confidence: 1.0 };
  }
  
  // Check aliases
  if (SKILL_ALIASES[normalizedA] === normalizedB || SKILL_ALIASES[normalizedB] === normalizedA) {
    return { isRelated: true, relationship: 'alias', confidence: 0.95 };
  }
  
  // Check hierarchy relationships
  const relationshipA = SKILL_RELATIONSHIPS[normalizedA];
  const relationshipB = SKILL_RELATIONSHIPS[normalizedB];
  
  if (relationshipA && relationshipA.children?.includes(normalizedB)) {
    return { isRelated: true, relationship: 'child', confidence: 0.8 };
  }
  
  if (relationshipB && relationshipB.children?.includes(normalizedA)) {
    return { isRelated: true, relationship: 'parent', confidence: 0.85 };
  }
  
  // Check siblings (same parent)
  if (relationshipA && relationshipB && relationshipA.parent === relationshipB.parent) {
    return { isRelated: true, relationship: 'sibling', confidence: 0.7 };
  }
  
  return { isRelated: false, relationship: 'exact', confidence: 0 };
}

// Extract skills and experience from LinkedIn profile
function extractSkillsFromProfile(profile: LinkedInProfile): Array<{ skill: string; years: number; evidence: string[] }> {
  const skillsFound: Array<{ skill: string; years: number; evidence: string[] }> = [];
  
  // Extract from explicit skills section
  if (profile.skills) {
    profile.skills.forEach(skillItem => {
      if (skillItem.title) {
        const evidence = [];
        
        // Get experience context from subComponents
        if (skillItem.subComponents) {
          skillItem.subComponents.forEach(sub => {
            if (sub.description) {
              sub.description.forEach(desc => {
                if (desc.text) {
                  evidence.push(desc.text);
                }
              });
            }
          });
        }
        
        // Estimate years from experience descriptions or default to 1
        let estimatedYears = 1;
        
        // Try to extract years from evidence
        const yearsMatch = evidence.join(' ').match(/(\d+)\s*(?:years?|yrs?)/i);
        if (yearsMatch) {
          estimatedYears = parseInt(yearsMatch[1]);
        }
        
        skillsFound.push({
          skill: skillItem.title.toLowerCase().trim(),
          years: estimatedYears,
          evidence: evidence.length > 0 ? evidence : [`Listed as skill: ${skillItem.title}`]
        });
      }
    });
  }
  
  // Extract from experience descriptions
  if (profile.experiences) {
    profile.experiences.forEach(exp => {
      if (exp.description) {
        const description = exp.description.toLowerCase();
        
        // Calculate years from caption (e.g., "Mar 2020 - Present · 4 yrs")
        let expYears = 1;
        const yearMatch = exp.caption.match(/(\d+)\s*(?:yrs?|years?)/i);
        if (yearMatch) {
          expYears = parseInt(yearMatch[1]);
        }
        
        // Look for technology mentions in description
        const techKeywords = [
          'python', 'javascript', 'react', 'node', 'django', 'flask', 'aws', 'azure', 
          'docker', 'kubernetes', 'postgresql', 'mongodb', 'mysql', 'redis',
          'typescript', 'vue', 'angular', 'express', 'spring', 'java', 'golang',
          'machine learning', 'ai', 'data science', 'devops', 'ci/cd'
        ];
        
        techKeywords.forEach(tech => {
          if (description.includes(tech)) {
            const existingSkill = skillsFound.find(s => s.skill === tech);
            if (existingSkill) {
              // Add to existing skill years
              existingSkill.years = Math.max(existingSkill.years, expYears);
              existingSkill.evidence.push(`${exp.title} at ${exp.subtitle}: ${exp.description.substring(0, 100)}...`);
            } else {
              skillsFound.push({
                skill: tech,
                years: expYears,
                evidence: [`${exp.title} at ${exp.subtitle}: ${exp.description.substring(0, 100)}...`]
              });
            }
          }
        });
      }
    });
  }
  
  return skillsFound;
}

// Find matching skills using hybrid approach (embeddings + logic)
async function findMatchingSkills(
  requirement: string,
  candidateSkills: CandidateSkill[],
  profileSkills: Array<{ skill: string; years: number; evidence: string[] }>,
  supabase: any,
  openaiApiKey: string
): Promise<SkillMatch[]> {
  const matches: SkillMatch[] = [];
  const normalizedRequirement = normalizeSkillName(requirement);
  
  try {
    // Step 1: Check explicit candidate skills for relationships
    for (const candidateSkill of candidateSkills) {
      const relationship = getSkillRelationship(normalizedRequirement, candidateSkill.name);
      
      if (relationship.isRelated) {
        matches.push({
          skill: candidateSkill.name,
          similarity: relationship.confidence,
          matchType: relationship.relationship === 'exact' ? 'exact' : 'related',
          yearsExperience: candidateSkill.yoe || 1,
          evidence: [`Listed skill: ${candidateSkill.name}`],
          confidence: relationship.confidence
        });
      }
    }
    
    // Step 2: Check profile-extracted skills for relationships
    for (const profileSkill of profileSkills) {
      const relationship = getSkillRelationship(normalizedRequirement, profileSkill.skill);
      
      if (relationship.isRelated && !matches.find(m => normalizeSkillName(m.skill) === normalizeSkillName(profileSkill.skill))) {
        matches.push({
          skill: profileSkill.skill,
          similarity: relationship.confidence,
          matchType: relationship.relationship === 'exact' ? 'exact' : 'related',
          yearsExperience: profileSkill.years,
          evidence: profileSkill.evidence,
          confidence: relationship.confidence
        });
      }
    }
    
    // Step 3: Use embeddings for semantic matching (if no strong matches found)
    if (matches.length === 0 || matches.every(m => m.confidence < 0.7)) {
      const requirementEmbedding = await getCachedEmbedding(normalizedRequirement, supabase, openaiApiKey);
      
      // Check all candidate skills + profile skills for semantic similarity
      const allSkills = [
        ...candidateSkills.map(s => ({ skill: s.name, years: s.yoe || 1, evidence: [`Listed skill: ${s.name}`] })),
        ...profileSkills.filter(ps => !candidateSkills.find(cs => normalizeSkillName(cs.name) === normalizeSkillName(ps.skill)))
      ];
      
      for (const skillItem of allSkills) {
        try {
          const skillEmbedding = await getCachedEmbedding(skillItem.skill, supabase, openaiApiKey);
          const similarity = cosineSimilarity(requirementEmbedding, skillEmbedding);
          
          // Apply hybrid logic: higher threshold for parent->child relationships
          let threshold = 0.6;
          const relationship = getSkillRelationship(normalizedRequirement, skillItem.skill);
          
          if (relationship.relationship === 'child') {
            // Child skill satisfying parent requirement (e.g., Django -> Python)
            threshold = 0.5;
          } else if (relationship.relationship === 'parent') {
            // Parent skill satisfying child requirement (e.g., Python -> Django)
            threshold = 0.8; // Higher threshold required
          }
          
          if (similarity >= threshold && !matches.find(m => normalizeSkillName(m.skill) === normalizeSkillName(skillItem.skill))) {
            matches.push({
              skill: skillItem.skill,
              similarity: similarity,
              matchType: 'semantic',
              yearsExperience: skillItem.years,
              evidence: skillItem.evidence,
              confidence: similarity
            });
          }
        } catch (embeddingError) {
          console.error(`Error getting embedding for skill: ${skillItem.skill}`, embeddingError);
          // Continue with other skills
        }
      }
    }
    
    // Sort by confidence/similarity (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
    
  } catch (error) {
    console.error(`Error finding matches for requirement: ${requirement}`, error);
    return [];
  }
}

// Generate recruiter-friendly feedback
function generateRecruiterFeedback(
  requirement: string,
  matches: SkillMatch[],
  skillType: string,
  score: number,
  status: string
): string {
  if (matches.length === 0) {
    return `No ${requirement} experience found in the candidate's profile.`;
  }
  
  const primaryMatch = matches[0];
  const additionalMatches = matches.slice(1);
  
  // Handle different skill types
  if (skillType === 'soft_skill') {
    if (primaryMatch.matchType === 'exact') {
      return `The candidate demonstrates ${requirement} through their profile and experience.`;
    } else {
      return `The candidate shows ${requirement} capabilities through related experience with ${primaryMatch.skill}.`;
    }
  }
  
  if (skillType === 'certification') {
    if (primaryMatch.matchType === 'exact') {
      return `The candidate holds the required ${requirement} certification.`;
    } else {
      return `The candidate has related certification experience with ${primaryMatch.skill}.`;
    }
  }
  
  // Technical skills, roles, industry, technology_domain
  let feedback = '';
  
  if (primaryMatch.matchType === 'exact') {
    feedback = `The candidate has ${primaryMatch.yearsExperience} years of direct ${requirement} experience.`;
  } else if (primaryMatch.matchType === 'related') {
    // Use skill relationships to explain the connection
    const relationship = getSkillRelationship(requirement, primaryMatch.skill);
    
    if (relationship.relationship === 'child') {
      feedback = `The candidate has experience with ${primaryMatch.skill}, which is a ${requirement} framework/technology, demonstrating ${requirement} capabilities.`;
    } else if (relationship.relationship === 'parent') {
      feedback = `The candidate's ${primaryMatch.skill} experience (${primaryMatch.yearsExperience} years) includes ${requirement} proficiency.`;
    } else if (relationship.relationship === 'sibling') {
      feedback = `The candidate has ${primaryMatch.yearsExperience} years of experience with ${primaryMatch.skill}, which is closely related to ${requirement}.`;
    } else {
      feedback = `The candidate has ${primaryMatch.yearsExperience} years of experience with ${primaryMatch.skill}, which aligns with ${requirement} requirements.`;
    }
  } else {
    // Semantic match
    feedback = `The candidate demonstrates ${requirement} capabilities through ${primaryMatch.yearsExperience} years of experience with ${primaryMatch.skill}.`;
  }
  
  // Add information about additional matches if present
  if (additionalMatches.length > 0) {
    const additionalSkills = additionalMatches.slice(0, 2).map(m => m.skill).join(' and ');
    feedback += ` Additional relevant experience includes ${additionalSkills}.`;
  }
  
  // Add confidence/status context
  if (status === 'weak') {
    feedback += ' However, the experience level may be below the ideal requirement.';
  } else if (status === 'strong') {
    feedback += ' This represents strong alignment with the job requirements.';
  }
  
  return feedback;
}

// Calculate proficiency level based on years of experience
function calculateProficiencyLevel(
  yearsExperience: number,
  skillType: string,
  requirement: string
): 'beginner' | 'advanced' | 'expert' {
  // Different thresholds for different skill types
  let beginnerThreshold = 2;
  let expertThreshold = 5;
  
  // Some skills have different learning curves
  const complexSkills = ['machine learning', 'ai', 'data science', 'distributed systems', 'security', 'architecture'];
  const isComplexSkill = complexSkills.some(complex => 
    requirement.toLowerCase().includes(complex.toLowerCase())
  );
  
  if (isComplexSkill) {
    beginnerThreshold = 3;
    expertThreshold = 7;
  }
  
  if (yearsExperience <= beginnerThreshold) {
    return 'beginner';
  } else if (yearsExperience <= expertThreshold) {
    return 'advanced';
  } else {
    return 'expert';
  }
}

// Evaluate a single requirement against candidate data
async function evaluateRequirement(
  requirement: JobRequirement,
  candidateSkills: CandidateSkill[],
  profileSkills: Array<{ skill: string; years: number; evidence: string[] }>,
  supabase: any,
  openaiApiKey: string
): Promise<{
  requirement_name: string;
  score: number;
  status: 'strong' | 'adequate' | 'weak' | 'missing';
  feedback: string;
}> {
  
  console.log(`🔍 Evaluating requirement: ${requirement.requirement} (${requirement.type})`);
  
  try {
    // Find matching skills using hybrid approach
    const matches = await findMatchingSkills(
      requirement.requirement,
      candidateSkills,
      profileSkills,
      supabase,
      openaiApiKey
    );
    
    if (matches.length === 0) {
      return {
        requirement_name: requirement.requirement,
        score: 0,
        status: 'missing',
        feedback: generateRecruiterFeedback(requirement.requirement, [], requirement.type, 0, 'missing')
      };
    }
    
    // Calculate total years of experience from all matches
    let totalYears = 0;
    let maxYears = 0;
    
    for (const match of matches) {
      const relationship = getSkillRelationship(requirement.requirement, match.skill);
      let weightedYears = match.yearsExperience;
      
      // Apply weighting based on relationship type
      if (relationship.relationship === 'exact' || relationship.relationship === 'alias') {
        weightedYears *= 1.0;
      } else if (relationship.relationship === 'child') {
        weightedYears *= 0.9; // Child skills are highly relevant
      } else if (relationship.relationship === 'parent') {
        weightedYears *= 0.7; // Parent skills are somewhat relevant
      } else if (relationship.relationship === 'sibling') {
        weightedYears *= 0.6; // Sibling skills are moderately relevant
      } else {
        weightedYears *= match.confidence; // Semantic matches weighted by similarity
      }
      
      totalYears += weightedYears;
      maxYears = Math.max(maxYears, match.yearsExperience);
    }
    
    // Cap unrealistic total experience
    totalYears = Math.min(totalYears, 15);
    
    // Handle soft skills without proficiency requirements differently
    let finalScore: number;
    
    if (requirement.type === 'soft_skill' && requirement.proficiency_level === null) {
      // For soft skills without proficiency levels, score based on presence and evidence quality
      const bestMatch = matches[0];
      
      if (bestMatch.matchType === 'exact') {
        finalScore = Math.round(75 + (bestMatch.confidence * 25)); // 75-100% for exact matches
      } else {
        finalScore = Math.round(50 + (bestMatch.confidence * 25)); // 50-75% for related matches
      }
    } else {
      // Calculate candidate proficiency level for skills with proficiency requirements
      const candidateProficiency = calculateProficiencyLevel(totalYears, requirement.type, requirement.requirement);
      const requiredProficiency = requirement.proficiency_level || 'advanced';
      
      // Score calculation based on proficiency alignment and match quality
      let baseScore = 0;
      const candidateValue = PROFICIENCY_LEVELS[candidateProficiency];
      const requiredValue = PROFICIENCY_LEVELS[requiredProficiency];
      
      // Proficiency alignment score (0-70%)
      const proficiencyRatio = candidateValue / requiredValue;
      baseScore = Math.min(proficiencyRatio * 70, 70);
      
      // Match quality bonus (0-30%)
      const bestMatch = matches[0];
      const qualityBonus = bestMatch.confidence * 30;
      
      // Final score
      finalScore = Math.min(Math.round(baseScore + qualityBonus), 100);
    }
    
    // Determine status
    let status: 'strong' | 'adequate' | 'weak' | 'missing' = 'missing';
    if (finalScore >= 75) status = 'strong';
    else if (finalScore >= 50) status = 'adequate';
    else if (finalScore >= 25) status = 'weak';
    
    // Generate feedback
    const feedback = generateRecruiterFeedback(
      requirement.requirement,
      matches,
      requirement.type,
      finalScore,
      status
    );
    
    console.log(`✅ ${requirement.requirement}: ${finalScore}% (${status}) - ${matches.length} matches`);
    
    return {
      requirement_name: requirement.requirement,
      score: finalScore,
      status,
      feedback
    };
    
  } catch (error) {
    console.error(`Error evaluating requirement ${requirement.requirement}:`, error);
    return {
      requirement_name: requirement.requirement,
      score: 0,
      status: 'missing',
      feedback: `Unable to evaluate ${requirement.requirement} - please review manually.`
    };
  }
}

// Generate AI feedback for overall analysis and recruiter recommendations
async function generateOverallFeedback(
  candidateData: any,
  jobData: any,
  requirementEvaluations: any[],
  openaiApiKey: string
): Promise<{
  overall_feedback: string;
  summary: {
    strengths: string[];
    gaps: string[];
  };
  recruiter_recommendations: {
    interview_strategy: string[];
    other_options: string[];
  };
}> {
  try {
    const candidateName = `${candidateData.main.first_name} ${candidateData.main.last_name}`;
    const jobTitle = jobData.attributes.title;
    
    // Prepare analysis summary
    const strongRequirements = requirementEvaluations.filter(req => req.status === 'strong');
    const weakRequirements = requirementEvaluations.filter(req => req.status === 'weak' || req.status === 'missing');
    const mandatoryRequirements = requirementEvaluations.filter(req => 
      jobData.requirements.find((jr: JobRequirement) => jr.requirement === req.requirement_name)?.is_mandatory
    );
    
    const prompt = `
You are an expert recruiter analyzing how well a candidate matches a job opening. Generate human-readable content for recruiter decision-making.

## CANDIDATE & JOB CONTEXT:
**Candidate**: ${candidateName}
**Position**: ${jobTitle}
**Candidate Experience**: ${candidateData.years_of_experience} years total

## ANALYSIS RESULTS:
**Strong Matches**: ${strongRequirements.map(r => r.requirement_name).join(', ') || 'None'}
**Gaps/Weak Areas**: ${weakRequirements.map(r => r.requirement_name).join(', ') || 'None'}
**Mandatory Requirements**: ${mandatoryRequirements.map(r => `${r.requirement_name} (${r.status})`).join(', ')}

## REQUIRED OUTPUT:
Return a JSON object with this structure:

{
  "overall_feedback": "1-2 sentence summary for recruiters",
  "summary": {
    "strengths": ["3-5 specific strengths based on strong matches"],
    "gaps": ["3-5 specific gaps or areas of concern"]
  },
  "recruiter_recommendations": {
    "interview_strategy": ["3-4 specific interview focus areas"],
    "other_options": ["3-4 alternative positioning suggestions"]
  }
}

Focus on practical recruiting insights. Be specific and actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter. Generate practical, actionable insights for recruiting decisions. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No valid JSON found in AI response");
    }
    
    const jsonStr = content.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
    
  } catch (error) {
    console.error('Error generating overall feedback:', error);
    
    // Fallback response
    const strongCount = requirementEvaluations.filter(req => req.status === 'strong').length;
    const totalCount = requirementEvaluations.length;
    
    return {
      overall_feedback: `Candidate shows strong alignment in ${strongCount} out of ${totalCount} key requirements. Detailed analysis completed.`,
      summary: {
        strengths: ["Technical skills assessment completed", "Experience evaluation performed"],
        gaps: ["Manual review recommended for specific areas"]
      },
      recruiter_recommendations: {
        interview_strategy: ["Focus on technical competencies", "Validate experience claims", "Assess cultural fit"],
        other_options: ["Consider for related positions", "Evaluate for future opportunities"]
      }
    };
  }
}

// Main match analysis function
async function runMatchAnalysis(candidateData: any, jobData: any, supabase: any) {
  const startTime = Date.now();
  console.log("🚀 Starting Enhanced Match Analysis v3 (Simplified Embedding-Based)");
  console.log(`👤 Candidate: ${candidateData.main.first_name} ${candidateData.main.last_name}`);
  console.log(`💼 Job: ${jobData.attributes?.title}`);
  console.log(`📋 Requirements: ${jobData.requirements.length}`);
  console.log(`🧠 LinkedIn Profile Available: ${!!candidateData.raw_profile}`);

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not found");
  }

  try {
    // Extract skills from LinkedIn profile if available
    let profileSkills: Array<{ skill: string; years: number; evidence: string[] }> = [];
    if (candidateData.raw_profile) {
      console.log("🔍 Extracting skills from LinkedIn profile...");
      profileSkills = extractSkillsFromProfile(candidateData.raw_profile);
      console.log(`📊 Extracted ${profileSkills.length} skills from profile`);
    }

    // Evaluate each requirement
    console.log("⚡ Evaluating job requirements...");
    const requirementEvaluations = [];
    
    for (const requirement of jobData.requirements) {
      const evaluation = await evaluateRequirement(
        requirement,
        candidateData.skills,
        profileSkills,
        supabase,
        openaiApiKey
      );
      requirementEvaluations.push(evaluation);
    }

    // Calculate overall metrics
    const mandatoryReqs = jobData.requirements.filter((req: JobRequirement) => req.is_mandatory);
    const optionalReqs = jobData.requirements.filter((req: JobRequirement) => !req.is_mandatory);
    
    const calculateWeightedAverage = (requirements: JobRequirement[], evaluations: any[]) => {
      if (requirements.length === 0) return 0;
      let totalWeight = 0;
      let weightedSum = 0;
      
      requirements.forEach((req: JobRequirement) => {
        const evaluation = evaluations.find(evalItem => evalItem.requirement_name === req.requirement);
        if (evaluation) {
          totalWeight += req.weight;
          weightedSum += evaluation.score * req.weight;
        }
      });
      
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    };
    
    const mandatoryScore = calculateWeightedAverage(mandatoryReqs, requirementEvaluations);
    const optionalScore = calculateWeightedAverage(optionalReqs, requirementEvaluations);
    const overallScore = Math.round(mandatoryScore * 0.8 + optionalScore * 0.2);
    
    const getOverallStatus = (score: number) => {
      if (score >= 75) return "strong";
      if (score >= 50) return "adequate";
      if (score >= 25) return "weak";
      return "missing";
    };
    
    const overallStatus = getOverallStatus(overallScore);
    const matchedMandatory = mandatoryReqs.filter((req: JobRequirement) => {
      const evaluation = requirementEvaluations.find(evalItem => evalItem.requirement_name === req.requirement);
      return evaluation && evaluation.score >= 50;
    }).length;

    // Generate overall feedback and recommendations
    console.log("🤖 Generating recruiter insights...");
    const overallFeedback = await generateOverallFeedback(
      candidateData,
      jobData,
      requirementEvaluations,
      openaiApiKey
    );

    // Build response in exact same format as original API
    const processingTime = Date.now() - startTime;
    
    const response = {
      match_analysis: {
        overall_score: overallScore,
        status: overallStatus,
        overall_feedback: overallFeedback.overall_feedback,
        matched_mandatory_requirements: matchedMandatory,
        total_mandatory_requirements: mandatoryReqs.length
      },
      requirement_evaluations: requirementEvaluations,
      summary: overallFeedback.summary,
      recruiter_recommendations: overallFeedback.recruiter_recommendations,
      metadata: {
        analysis_timestamp: new Date().toISOString(),
        job_id: "placeholder_job_id",
        candidate_id: "placeholder_candidate_id",
        algorithm_version: "3.0-embedding-enhanced",
        total_processing_time_ms: processingTime
      }
    };

    // Enhanced console logging
    console.log("\n🎯 ENHANCED MATCH ANALYSIS v3 RESULTS:");
    console.log("=====================================");
    console.log(`📊 Overall Score: ${overallScore}% (${overallStatus})`);
    console.log(`✅ Mandatory Requirements Met: ${matchedMandatory}/${mandatoryReqs.length}`);
    console.log(`🕒 Processing Time: ${processingTime}ms`);
    console.log(`🧠 Profile Skills Extracted: ${profileSkills.length}`);
    console.log(`🎯 Enhanced Feedback Generated: Yes`);
    
    console.log("\n📋 REQUIREMENT BREAKDOWN:");
    requirementEvaluations.forEach((req, i) => {
      console.log(`${i + 1}. ${req.requirement_name}: ${req.score}% (${req.status})`);
    });
    
    console.log("\n💼 RECRUITER INSIGHTS:");
    console.log("Strengths:", overallFeedback.summary.strengths.slice(0, 2));
    console.log("Gaps:", overallFeedback.summary.gaps.slice(0, 2));

    return response;
  } catch (error) {
    console.error("❌ Enhanced match analysis v3 error:", error);
    throw error;
  }
}

// Main Edge Function handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log("🎬 Enhanced Match Analysis API v3 - Starting");
    const startTime = Date.now();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const requestData = await req.json();
    
    if (!requestData.candidate || !requestData.job) {
      return new Response(JSON.stringify({
        error: "Invalid input. Expected object with 'candidate' and 'job' properties."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { candidate, job } = requestData;

    // Validate candidate data
    if (!candidate.main || !candidate.skills || !Array.isArray(candidate.skills)) {
      return new Response(JSON.stringify({
        error: "Invalid candidate data. Must contain 'main' and 'skills' array."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate job data
    if (!job.requirements || !Array.isArray(job.requirements) || job.requirements.length === 0) {
      return new Response(JSON.stringify({
        error: "Invalid job data. Must contain non-empty 'requirements' array."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📥 Processing: ${candidate.main.first_name} ${candidate.main.last_name} vs ${job.attributes?.title}`);
    console.log(`📋 Requirements: ${job.requirements.length}, LinkedIn Profile: ${!!candidate.raw_profile ? 'Yes' : 'No'}`);

    // Run enhanced analysis
    const result = await runMatchAnalysis(candidate, job, supabase);
    
    // Update timing
    result.metadata.total_processing_time_ms = Date.now() - startTime;

    console.log(`✅ Enhanced analysis v3 completed in ${result.metadata.total_processing_time_ms}ms`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Enhanced match analysis v3 error:", error);
    return new Response(JSON.stringify({
      error: 'Enhanced analysis v3 failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
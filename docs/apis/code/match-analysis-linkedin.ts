// LinkedIn Match Analysis API - Two-Tier Scoring with Evidence Extraction
// Implements mandatory vs non-mandatory scoring logic with detailed LinkedIn evidence
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};
// Skill hierarchy for relationship understanding
const SKILL_RELATIONSHIPS = {
  // Programming Languages and Frameworks
  'python': {
    children: [
      'django',
      'flask',
      'fastapi',
      'pandas',
      'numpy',
      'tensorflow',
      'pytorch'
    ],
    domain: 'programming'
  },
  'javascript': {
    children: [
      'react',
      'vue',
      'angular',
      'node.js',
      'express',
      'next.js',
      'nuxt'
    ],
    domain: 'programming'
  },
  'java': {
    children: [
      'spring',
      'hibernate',
      'maven',
      'gradle'
    ],
    domain: 'programming'
  },
  'typescript': {
    children: [
      'angular',
      'nest.js'
    ],
    parent: 'javascript',
    domain: 'programming'
  },
  'react': {
    parent: 'javascript',
    children: [
      'next.js',
      'gatsby',
      'react native'
    ],
    domain: 'frontend'
  },
  'node.js': {
    parent: 'javascript',
    children: [
      'express',
      'nest.js',
      'fastify'
    ],
    domain: 'backend'
  },
  // Cloud and Infrastructure
  'cloud': {
    children: [
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes'
    ],
    domain: 'infrastructure'
  },
  'aws': {
    parent: 'cloud',
    children: [
      's3',
      'ec2',
      'lambda',
      'rds'
    ],
    domain: 'cloud-platform'
  },
  'azure': {
    parent: 'cloud',
    children: [
      'azure functions',
      'cosmos db'
    ],
    domain: 'cloud-platform'
  },
  'docker': {
    parent: 'cloud',
    children: [
      'kubernetes',
      'docker compose'
    ],
    domain: 'containerization'
  },
  // Databases
  'database': {
    children: [
      'postgresql',
      'mysql',
      'mongodb',
      'redis'
    ],
    domain: 'data'
  },
  'sql': {
    children: [
      'postgresql',
      'mysql',
      'sql server'
    ],
    domain: 'database'
  },
  'postgresql': {
    parent: 'database',
    aliases: [
      'postgres'
    ],
    domain: 'relational-db'
  },
  'mongodb': {
    parent: 'database',
    aliases: [
      'mongo'
    ],
    domain: 'nosql-db'
  },
  // Web Development
  'frontend': {
    children: [
      'react',
      'vue',
      'angular',
      'html',
      'css',
      'javascript'
    ],
    domain: 'web-development'
  },
  'backend': {
    children: [
      'node.js',
      'python',
      'java',
      'api development'
    ],
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
// Evidence extraction patterns for LinkedIn profile analysis
const EVIDENCE_PATTERNS = {
  leadership: /(?:led|managed|supervised|directed)\s+(?:team|group)\s+of\s+(\d+)|(?:managed|led)\s+(\d+)\s+(?:people|employees|developers|engineers)/i,
  teamSize: /(\d+)\s*(?:\+|plus)?\s*(?:member|person|people|developer|engineer)\s*team/i,
  experience: /(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp)\s*(?:with|in|using)?/i,
  technology: /(?:built|developed|implemented|created|designed|architected)\s+.*?(?:using|with|in)\s+([A-Z][a-zA-Z]+)/i,
  scale: /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s+(?:users|customers|transactions|requests|records)/i,
  metrics: /(?:increased|improved|reduced|achieved|delivered)\s+.*?(?:by\s+)?(\d+%|\$[\d,]+)/i,
  projects: /(?:delivered|completed|launched)\s+(\d+)\s+projects?/i,
  certifications: /(?:certified|certification)\s+(?:in\s+)?([A-Z][a-zA-Z\s]+)/i
};
// Scoring thresholds and constants
const SCORING_CONFIG = {
  MANDATORY_THRESHOLD: 70,
  STRONG_THRESHOLD: 75,
  ADEQUATE_THRESHOLD: 50,
  WEAK_THRESHOLD: 25,
  MANDATORY_WEIGHT: 0.8,
  ENHANCEMENT_WEIGHT: 0.2,
  MAX_ENHANCEMENT_BONUS: 30 // Maximum bonus points from non-mandatory requirements
};
// Proficiency level mapping
const PROFICIENCY_LEVELS = {
  'beginner': 1,
  'advanced': 2,
  'expert': 3
};
// Generate OpenAI embedding for text
async function generateEmbedding(text, openaiApiKey) {
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
function cosineSimilarity(vecA, vecB) {
  // Validate inputs
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    console.error('cosineSimilarity: Invalid input - not arrays', {
      vecA: typeof vecA,
      vecB: typeof vecB
    });
    return 0;
  }
  if (vecA.length !== vecB.length) {
    console.error('cosineSimilarity: Vector dimension mismatch', {
      vecA: vecA.length,
      vecB: vecB.length
    });
    return 0;
  }
  if (vecA.length === 0 || vecB.length === 0) {
    console.error('cosineSimilarity: Empty vectors');
    return 0;
  }
  // Verify all elements are numbers
  if (!vecA.every((x)=>typeof x === 'number') || !vecB.every((x)=>typeof x === 'number')) {
    console.error('cosineSimilarity: Non-numeric elements in vectors');
    return 0;
  }
  try {
    const dotProduct = vecA.reduce((sum, a, i)=>sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a)=>sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b)=>sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    const similarity = dotProduct / (magnitudeA * magnitudeB);
    // Ensure result is within valid range
    if (isNaN(similarity) || !isFinite(similarity)) {
      console.error('cosineSimilarity: Invalid result', {
        similarity,
        dotProduct,
        magnitudeA,
        magnitudeB
      });
      return 0;
    }
    return Math.max(-1, Math.min(1, similarity)); // Clamp to [-1, 1]
  } catch (error) {
    console.error('cosineSimilarity: Calculation error', error);
    return 0;
  }
}
// Get or create cached embedding
async function getCachedEmbedding(text, supabase, openaiApiKey) {
  try {
    const normalizedText = text.toLowerCase().trim();
    // Try to get from cache first
    const { data: cached, error } = await supabase.from('skill_embeddings').select('embedding').eq('skill_text', normalizedText).single();
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
    supabase.from('skill_embeddings').insert({
      skill_text: normalizedText,
      embedding: embedding,
      model_version: 'text-embedding-3-small'
    }).then(()=>console.log(`Cached embedding for: ${normalizedText}`)).catch((error)=>console.log(`Cache error for: ${normalizedText}`, error));
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
function normalizeSkillName(skillName) {
  const normalized = skillName.toLowerCase().trim();
  return SKILL_ALIASES[normalized] || normalized;
}
// Check if skill A is related to skill B using hierarchy
function getSkillRelationship(skillA, skillB) {
  const normalizedA = normalizeSkillName(skillA);
  const normalizedB = normalizeSkillName(skillB);
  // Exact match
  if (normalizedA === normalizedB) {
    return {
      isRelated: true,
      relationship: 'exact',
      confidence: 1.0
    };
  }
  // Check aliases
  if (SKILL_ALIASES[normalizedA] === normalizedB || SKILL_ALIASES[normalizedB] === normalizedA) {
    return {
      isRelated: true,
      relationship: 'alias',
      confidence: 0.95
    };
  }
  // Check hierarchy relationships
  const relationshipA = SKILL_RELATIONSHIPS[normalizedA];
  const relationshipB = SKILL_RELATIONSHIPS[normalizedB];
  if (relationshipA && relationshipA.children?.includes(normalizedB)) {
    return {
      isRelated: true,
      relationship: 'child',
      confidence: 0.8
    };
  }
  if (relationshipB && relationshipB.children?.includes(normalizedA)) {
    return {
      isRelated: true,
      relationship: 'parent',
      confidence: 0.85
    };
  }
  // Check siblings (same parent)
  if (relationshipA && relationshipB && relationshipA.parent === relationshipB.parent) {
    return {
      isRelated: true,
      relationship: 'sibling',
      confidence: 0.7
    };
  }
  return {
    isRelated: false,
    relationship: 'exact',
    confidence: 0
  };
}
// Enhanced evidence extraction from LinkedIn profile text with company attribution
function extractSpecificEvidence(text, skill, source, companyName, jobTitle) {
  const evidence = [];
  const lowercaseText = text.toLowerCase();
  const lowercaseSkill = skill.toLowerCase();
  // Look for skill mentions with context
  if (lowercaseText.includes(lowercaseSkill)) {
    // Extract sentences containing the skill
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences){
      if (sentence.toLowerCase().includes(lowercaseSkill)) {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence.length > 10) {
          let evidenceType = 'mention';
          let context = '';
          // Determine evidence type based on patterns
          if (EVIDENCE_PATTERNS.leadership.test(trimmedSentence)) {
            evidenceType = 'leadership';
            const match = trimmedSentence.match(EVIDENCE_PATTERNS.leadership);
            context = match && (match[1] || match[2]) ? `Team size: ${match[1] || match[2]}` : '';
          } else if (EVIDENCE_PATTERNS.technology.test(trimmedSentence)) {
            evidenceType = 'implementation';
            context = 'Technical implementation';
          } else if (EVIDENCE_PATTERNS.experience.test(trimmedSentence)) {
            evidenceType = 'experience';
            const match = trimmedSentence.match(EVIDENCE_PATTERNS.experience);
            context = match && match[1] ? `${match[1]} years experience` : '';
          } else if (EVIDENCE_PATTERNS.scale.test(trimmedSentence)) {
            evidenceType = 'scale';
            const match = trimmedSentence.match(EVIDENCE_PATTERNS.scale);
            context = match && match[1] ? `Scale: ${match[1]}` : '';
          } else if (EVIDENCE_PATTERNS.metrics.test(trimmedSentence)) {
            evidenceType = 'achievement';
            const match = trimmedSentence.match(EVIDENCE_PATTERNS.metrics);
            context = match && match[1] ? `Impact: ${match[1]}` : '';
          }
          evidence.push({
            quote: trimmedSentence,
            source: source,
            context: context,
            type: evidenceType,
            company: companyName,
            role: jobTitle
          });
        }
      }
    }
  }
  return evidence;
}
// Extract quantifiable metrics from text
function extractMetrics(text) {
  const metrics = [];
  // Leadership metrics
  const leadershipMatch = text.match(EVIDENCE_PATTERNS.leadership);
  if (leadershipMatch && (leadershipMatch[1] || leadershipMatch[2])) {
    metrics.push({
      type: 'leadership',
      value: leadershipMatch[1] || leadershipMatch[2],
      context: 'Team management'
    });
  }
  // Experience metrics
  const experienceMatch = text.match(EVIDENCE_PATTERNS.experience);
  if (experienceMatch && experienceMatch[1]) {
    metrics.push({
      type: 'experience',
      value: experienceMatch[1],
      context: 'Years of experience'
    });
  }
  // Scale metrics
  const scaleMatch = text.match(EVIDENCE_PATTERNS.scale);
  if (scaleMatch && scaleMatch[1]) {
    metrics.push({
      type: 'scale',
      value: scaleMatch[1],
      context: 'System scale'
    });
  }
  // Achievement metrics
  const metricsMatch = text.match(EVIDENCE_PATTERNS.metrics);
  if (metricsMatch && metricsMatch[1]) {
    metrics.push({
      type: 'achievement',
      value: metricsMatch[1],
      context: 'Performance improvement'
    });
  }
  return metrics;
}
// Extract skills and experience from LinkedIn profile with robust evidence extraction
function extractSkillsFromProfile(profile) {
  const skillsFound = [];
  // Extract from explicit skills section with enhanced evidence
  if (profile.skills) {
    profile.skills.forEach((skillItem)=>{
      if (skillItem.title) {
        const evidence = [];
        let specificEvidence = [];
        // Get experience context from subComponents
        if (skillItem.subComponents) {
          skillItem.subComponents.forEach((sub)=>{
            if (sub.description) {
              sub.description.forEach((desc)=>{
                if (desc.text) {
                  evidence.push(desc.text);
                  // Check if this is an insight component with company reference
                  if (desc.type === 'insightComponent' && desc.text.includes(' at ')) {
                    // Extract company reference: "Frontend Developer at VAIRIX"
                    const match = desc.text.match(/(.+?)\s+at\s+(.+)/);
                    if (match) {
                      const role = match[1];
                      const company = match[2];
                      specificEvidence.push({
                        quote: desc.text,
                        source: `${role} at ${company}`,
                        context: `Skill used in professional role`,
                        type: 'skill_reference',
                        company: company,
                        role: role
                      });
                    }
                  }
                }
              });
            }
          });
        }
        // If no specific evidence found, create fallback evidence
        if (specificEvidence.length === 0) {
          specificEvidence = [
            {
              quote: `${skillItem.title} skill listed in LinkedIn profile`,
              source: 'LinkedIn Skills Section',
              context: 'Professional skill listing',
              type: 'skill_listing'
            }
          ];
        }
        // Estimate years from experience descriptions or default to 1
        let estimatedYears = 1;
        skillsFound.push({
          skill: skillItem.title.toLowerCase().trim(),
          years: estimatedYears,
          evidence: evidence.length > 0 ? evidence : [
            `Listed as skill: ${skillItem.title}`
          ],
          specificEvidence: specificEvidence
        });
      }
    });
  }
  // Extract from experience descriptions with enhanced evidence extraction
  if (profile.experiences) {
    profile.experiences.forEach((exp)=>{
      // Extract years from caption
      let expYears = 1;
      if (exp.caption && exp.caption.includes('yr')) {
        const simpleMatch = exp.caption.match(/(\d+)/i);
        if (simpleMatch && simpleMatch[1]) {
          expYears = parseInt(simpleMatch[1]);
        }
      }
      // Enhanced experience context
      const experienceContext = `${exp.title} at ${exp.subtitle?.split(' · ')[0] || 'Unknown Company'}`;
      const companyName = exp.subtitle?.split(' · ')[0] || 'Unknown Company';
      // Look for detailed descriptions in subComponents
      let hasDetailedDescription = false;
      let fullDescription = '';
      if (exp.subComponents) {
        exp.subComponents.forEach((sub)=>{
          if (sub.description) {
            sub.description.forEach((desc)=>{
              if (desc.type === 'textComponent' && desc.text) {
                hasDetailedDescription = true;
                fullDescription += desc.text + ' ';
              }
            });
          }
        });
      }
      // Technology keywords to look for
      const techKeywords = [
        'python',
        'javascript',
        'react',
        'node',
        'django',
        'flask',
        'aws',
        'azure',
        'docker',
        'kubernetes',
        'postgresql',
        'mongodb',
        'mysql',
        'redis',
        'typescript',
        'vue',
        'angular',
        'express',
        'spring',
        'java',
        'golang',
        'machine learning',
        'ai',
        'data science',
        'devops',
        'ci/cd',
        'next.js',
        'nestjs'
      ];
      if (hasDetailedDescription) {
        // Process detailed descriptions for technology mentions
        const description = fullDescription.toLowerCase();
        techKeywords.forEach((tech)=>{
          if (description.includes(tech)) {
            // Extract specific evidence for this technology
            const specificEvidence = extractSpecificEvidence(fullDescription, tech, experienceContext, companyName, exp.title);
            const existingSkill = skillsFound.find((s)=>s.skill === tech);
            if (existingSkill) {
              existingSkill.years = Math.max(existingSkill.years, expYears);
              existingSkill.evidence.push(`${experienceContext}: ${fullDescription.substring(0, 100)}...`);
              if (existingSkill.specificEvidence) {
                existingSkill.specificEvidence.push(...specificEvidence);
              } else {
                existingSkill.specificEvidence = specificEvidence;
              }
            } else {
              skillsFound.push({
                skill: tech,
                years: expYears,
                evidence: [
                  `${experienceContext}: ${fullDescription.substring(0, 100)}...`
                ],
                specificEvidence: specificEvidence
              });
            }
          }
        });
      } else {
        // For experiences without detailed descriptions, create basic evidence from role title
        // Look for technologies in job title or context
        const jobTitle = exp.title.toLowerCase();
        techKeywords.forEach((tech)=>{
          if (jobTitle.includes(tech) || jobTitle.includes(tech.replace('.', ''))) {
            const specificEvidence = [
              {
                quote: `Role: ${exp.title} at ${companyName}`,
                source: experienceContext,
                context: `Professional role involving ${tech}`,
                type: 'role_reference',
                company: companyName,
                role: exp.title
              }
            ];
            const existingSkill = skillsFound.find((s)=>s.skill === tech);
            if (existingSkill) {
              existingSkill.years = Math.max(existingSkill.years, expYears);
              existingSkill.evidence.push(`Role: ${experienceContext}`);
              if (existingSkill.specificEvidence) {
                existingSkill.specificEvidence.push(...specificEvidence);
              } else {
                existingSkill.specificEvidence = specificEvidence;
              }
            } else {
              skillsFound.push({
                skill: tech,
                years: expYears,
                evidence: [
                  `Role: ${experienceContext}`
                ],
                specificEvidence: specificEvidence
              });
            }
          }
        });
      }
    });
  }
  // Extract from about section if available
  if (profile.about) {
    const aboutText = profile.about.toLowerCase();
    const techKeywords = [
      'python',
      'javascript',
      'react',
      'node',
      'django',
      'flask',
      'aws',
      'azure',
      'docker',
      'kubernetes',
      'postgresql',
      'mongodb',
      'mysql',
      'redis',
      'typescript',
      'vue',
      'angular',
      'express',
      'spring',
      'java',
      'golang',
      'machine learning',
      'ai',
      'data science',
      'devops',
      'ci/cd',
      'next.js',
      'nestjs'
    ];
    techKeywords.forEach((tech)=>{
      if (aboutText.includes(tech)) {
        const specificEvidence = [
          {
            quote: profile.about.substring(0, 200) + (profile.about.length > 200 ? '...' : ''),
            source: 'LinkedIn About Section',
            context: 'Professional summary',
            type: 'about_mention'
          }
        ];
        const existingSkill = skillsFound.find((s)=>s.skill === tech);
        if (existingSkill) {
          existingSkill.evidence.push('Mentioned in LinkedIn about section');
          if (existingSkill.specificEvidence) {
            existingSkill.specificEvidence.push(...specificEvidence);
          } else {
            existingSkill.specificEvidence = specificEvidence;
          }
        } else {
          skillsFound.push({
            skill: tech,
            years: 1,
            evidence: [
              'Mentioned in LinkedIn about section'
            ],
            specificEvidence: specificEvidence
          });
        }
      }
    });
  }
  return skillsFound;
}
// Find matching skills using hybrid approach (embeddings + logic)
async function findMatchingSkills(requirement, candidateSkills, profileSkills, supabase, openaiApiKey) {
  const matches = [];
  const normalizedRequirement = normalizeSkillName(requirement);
  try {
    // Step 1: Check explicit candidate skills for relationships
    for (const candidateSkill of candidateSkills){
      const relationship = getSkillRelationship(normalizedRequirement, candidateSkill.name);
      if (relationship.isRelated) {
        matches.push({
          skill: candidateSkill.name,
          similarity: relationship.confidence,
          matchType: relationship.relationship === 'exact' ? 'exact' : 'related',
          yearsExperience: candidateSkill.yoe || 1,
          evidence: [
            `Listed skill: ${candidateSkill.name}`
          ],
          confidence: relationship.confidence,
          specificEvidence: []
        });
      }
    }
    // Step 2: Check profile-extracted skills for relationships
    for (const profileSkill of profileSkills){
      const relationship = getSkillRelationship(normalizedRequirement, profileSkill.skill);
      if (relationship.isRelated && !matches.find((m)=>normalizeSkillName(m.skill) === normalizeSkillName(profileSkill.skill))) {
        matches.push({
          skill: profileSkill.skill,
          similarity: relationship.confidence,
          matchType: relationship.relationship === 'exact' ? 'exact' : 'related',
          yearsExperience: profileSkill.years,
          evidence: profileSkill.evidence,
          confidence: relationship.confidence,
          specificEvidence: profileSkill.specificEvidence || []
        });
      }
    }
    // Step 3: Use embeddings for semantic matching (if no strong matches found)
    if (matches.length === 0 || matches.every((m)=>m.confidence < 0.7)) {
      const requirementEmbedding = await getCachedEmbedding(normalizedRequirement, supabase, openaiApiKey);
      // Check all candidate skills + profile skills for semantic similarity
      const allSkills = [
        ...candidateSkills.map((s)=>({
            skill: s.name,
            years: s.yoe || 1,
            evidence: [
              `Listed skill: ${s.name}`
            ],
            specificEvidence: []
          })),
        ...profileSkills.filter((ps)=>!candidateSkills.find((cs)=>normalizeSkillName(cs.name) === normalizeSkillName(ps.skill)))
      ];
      for (const skillItem of allSkills){
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
          if (similarity >= threshold && !matches.find((m)=>normalizeSkillName(m.skill) === normalizeSkillName(skillItem.skill))) {
            matches.push({
              skill: skillItem.skill,
              similarity: similarity,
              matchType: 'semantic',
              yearsExperience: skillItem.years,
              evidence: skillItem.evidence,
              confidence: similarity,
              specificEvidence: skillItem.specificEvidence || []
            });
          }
        } catch (embeddingError) {
          console.error(`Error getting embedding for skill: ${skillItem.skill}`, embeddingError);
        // Continue with other skills
        }
      }
    }
    // Sort by confidence/similarity (highest first)
    return matches.sort((a, b)=>b.confidence - a.confidence);
  } catch (error) {
    console.error(`Error finding matches for requirement: ${requirement}`, error);
    return [];
  }
}
// Generate enhanced recruiter-friendly feedback with LinkedIn evidence
function generateRecruiterFeedback(requirement, matches, skillType, score, status) {
  if (matches.length === 0) {
    return `No ${requirement} experience found in the candidate's profile.`;
  }
  const primaryMatch = matches[0];
  const additionalMatches = matches.slice(1);
  // Handle different skill types with LinkedIn profile references
  if (skillType === 'soft_skill') {
    const hasLinkedInEvidence = primaryMatch.specificEvidence && primaryMatch.specificEvidence.length > 0;
    if (hasLinkedInEvidence) {
      const evidence = primaryMatch.specificEvidence[0];
      const location = evidence.company && evidence.role ? `their role as ${evidence.role} at ${evidence.company}` : evidence.source;
      if (primaryMatch.matchType === 'exact') {
        return `We can observe ${requirement} capabilities in the candidate's LinkedIn profile, specifically during ${location}. Evidence: "${evidence.quote.substring(0, 100)}${evidence.quote.length > 100 ? '...' : ''}". This demonstrates practical application of ${requirement} in a professional setting.`;
      } else {
        return `We can identify ${requirement} capabilities through their LinkedIn profile during ${location}, where they demonstrated ${primaryMatch.skill}. Quote: "${evidence.quote.substring(0, 100)}${evidence.quote.length > 100 ? '...' : ''}".`;
      }
    } else {
      return `We can observe ${requirement} capabilities through their LinkedIn profile and professional experience, evidenced in their role descriptions and professional accomplishments.`;
    }
  }
  if (skillType === 'certification') {
    const hasLinkedInEvidence = primaryMatch.specificEvidence && primaryMatch.specificEvidence.length > 0;
    if (hasLinkedInEvidence) {
      const evidence = primaryMatch.specificEvidence[0];
      const location = evidence.company && evidence.role ? `during their tenure as ${evidence.role} at ${evidence.company}` : `in their ${evidence.source}`;
      if (primaryMatch.matchType === 'exact') {
        return `We can identify that the candidate holds the ${requirement} certification as evidenced in their LinkedIn profile ${location}. Reference: "${evidence.quote.substring(0, 100)}${evidence.quote.length > 100 ? '...' : ''}".`;
      } else {
        return `We can observe related certification background with ${primaryMatch.skill}, mentioned in their LinkedIn profile ${location}: "${evidence.quote.substring(0, 100)}${evidence.quote.length > 100 ? '...' : ''}".`;
      }
    } else {
      return `We can identify ${requirement} credentials listed in their LinkedIn profile skills section or mentioned in their professional experience descriptions.`;
    }
  }
  // Technical skills, roles, industry, technology_domain
  let feedback = '';
  // Get specific evidence for enhanced feedback
  const specificEvidence = primaryMatch.specificEvidence || [];
  const hasEvidence = specificEvidence.length > 0;
  if (primaryMatch.matchType === 'exact') {
    feedback = `The candidate has ${primaryMatch.yearsExperience} years of direct ${requirement} experience`;
    // Add specific LinkedIn evidence if available
    if (hasEvidence) {
      const bestEvidence = specificEvidence.find((e)=>e.type === 'leadership') || specificEvidence.find((e)=>e.type === 'implementation') || specificEvidence[0];
      if (bestEvidence) {
        const linkedInLocation = bestEvidence.company && bestEvidence.role ? `their LinkedIn profile shows this during their role as ${bestEvidence.role} at ${bestEvidence.company}` : `evidenced in their LinkedIn ${bestEvidence.source}`;
        feedback += `, as ${linkedInLocation}: "${bestEvidence.quote.substring(0, 120)}${bestEvidence.quote.length > 120 ? '...' : ''}"`;
        if (bestEvidence.context) {
          feedback += ` (${bestEvidence.context})`;
        }
      }
    } else {
      feedback += `, listed in their LinkedIn profile skills section and mentioned across their professional experience entries`;
    }
    feedback += '.';
  } else if (primaryMatch.matchType === 'related') {
    // Use skill relationships to explain the connection
    const relationship = getSkillRelationship(requirement, primaryMatch.skill);
    if (relationship.relationship === 'child') {
      feedback = `The candidate has experience with ${primaryMatch.skill}, which is a ${requirement} framework/technology, demonstrating ${requirement} capabilities`;
    } else if (relationship.relationship === 'parent') {
      feedback = `The candidate's ${primaryMatch.skill} experience (${primaryMatch.yearsExperience} years) includes ${requirement} proficiency`;
    } else if (relationship.relationship === 'sibling') {
      feedback = `The candidate has ${primaryMatch.yearsExperience} years of experience with ${primaryMatch.skill}, which is closely related to ${requirement}`;
    } else {
      feedback = `The candidate has ${primaryMatch.yearsExperience} years of experience with ${primaryMatch.skill}, which aligns with ${requirement} requirements`;
    }
    // Add LinkedIn evidence for related matches
    if (hasEvidence) {
      const implementationEvidence = specificEvidence.find((e)=>e.type === 'implementation') || specificEvidence[0];
      if (implementationEvidence) {
        const linkedInRef = implementationEvidence.company && implementationEvidence.role ? `their LinkedIn profile during their time as ${implementationEvidence.role} at ${implementationEvidence.company}` : `their LinkedIn ${implementationEvidence.source}`;
        feedback += `. This is evidenced in ${linkedInRef}: "${implementationEvidence.quote.substring(0, 100)}${implementationEvidence.quote.length > 100 ? '...' : ''}"`;
      }
    } else {
      feedback += `, as shown in their LinkedIn professional experience and skills sections`;
    }
    feedback += '.';
  } else {
    // Semantic match
    feedback = `The candidate demonstrates ${requirement} capabilities through ${primaryMatch.yearsExperience} years of experience with ${primaryMatch.skill}`;
    // Add best available LinkedIn evidence
    if (hasEvidence) {
      const bestEvidence = specificEvidence[0];
      const linkedInReference = bestEvidence.company && bestEvidence.role ? `their LinkedIn profile shows this experience as ${bestEvidence.role} at ${bestEvidence.company}` : `evidenced in their LinkedIn ${bestEvidence.source}`;
      feedback += `. ${linkedInReference}: "${bestEvidence.quote.substring(0, 100)}${bestEvidence.quote.length > 100 ? '...' : ''}"`;
    } else {
      feedback += `, as reflected in their LinkedIn profile's professional experience descriptions`;
    }
    feedback += '.';
  }
  // Add information about additional matches with LinkedIn evidence if present
  if (additionalMatches.length > 0) {
    const additionalSkills = additionalMatches.slice(0, 2).map((m)=>{
      let skillInfo = m.skill;
      // Add LinkedIn evidence context for additional skills if available
      if (m.specificEvidence && m.specificEvidence.length > 0) {
        const evidence = m.specificEvidence[0];
        const linkedInContext = evidence.company ? ` (from their work at ${evidence.company})` : evidence.context ? ` (${evidence.context})` : ` (from LinkedIn profile)`;
        skillInfo += linkedInContext;
      } else {
        skillInfo += ` (mentioned in LinkedIn profile)`;
      }
      return skillInfo;
    }).join(' and ');
    feedback += ` Additional relevant experience from their LinkedIn profile includes ${additionalSkills}.`;
  }
  // Add confidence/status context
  if (status === 'weak') {
    feedback += ' However, the experience level may be below the ideal requirement.';
  } else if (status === 'strong') {
    feedback += ' This represents strong alignment with the job requirements.';
  }
  return feedback;
}
// Generate enhanced recruiter-friendly feedback with detailed rationale and LinkedIn evidence
function generateEnhancedRecruiterFeedback(requirement, matches, skillType, score, status, isMandatory) {
  if (matches.length === 0) {
    if (isMandatory) {
      return `No evidence of ${requirement} experience was found across the candidate's profile, including their work history, listed skills, or project descriptions. This creates a significant gap since this skill is essential for the role and would need to be developed or acquired.`;
    } else {
      return `The candidate's profile doesn't show ${requirement} experience, but given this is an optional qualification, it doesn't impact their core suitability. This could be an area for future development or on-the-job learning.`;
    }
  }
  const primaryMatch = matches[0];
  const additionalMatches = matches.slice(1);
  const hasStrongEvidence = primaryMatch.specificEvidence && primaryMatch.specificEvidence.length > 0;
  let feedback = '';
  // Provide detailed rationale based on experience depth and type
  const getExperienceDepthRationale = (years, matchType)=>{
    if (years >= 5) {
      return `substantial ${years}-year background`;
    } else if (years >= 3) {
      return `solid ${years}-year foundation`;
    } else if (years >= 1) {
      return `${years}-year experience base`;
    } else {
      return 'limited but relevant exposure';
    }
  };
  const experienceDepth = getExperienceDepthRationale(primaryMatch.yearsExperience, primaryMatch.matchType);
  // Core competency assessment with detailed reasoning - handle soft skills differently
  if (skillType === 'soft_skill') {
    // For soft skills, focus on observation and identification rather than experience depth
    if (primaryMatch.matchType === 'exact') {
      feedback += `We can observe ${requirement} capabilities in the candidate's LinkedIn profile, indicating they have demonstrated this soft skill in professional contexts. Their profile shows evidence of applying ${requirement} in real work situations`;
    } else if (primaryMatch.matchType === 'related') {
      feedback += `We can identify ${requirement} capabilities through their demonstrated ${primaryMatch.skill} in professional settings. These related soft skills share similar interpersonal and professional principles, suggesting the candidate has the foundational mindset required for ${requirement}`;
    } else {
      feedback += `The candidate demonstrates ${requirement} alignment through their professional background and ${primaryMatch.skill} capabilities. While not explicitly stated, the conceptual overlap suggests they have the interpersonal foundations that support ${requirement}`;
    }
  } else {
    // For technical skills, roles, industry, technology_domain - keep experience-based language
    if (primaryMatch.matchType === 'exact') {
      feedback += `The candidate shows a ${experienceDepth} in ${requirement}, indicating they have direct hands-on experience with this specific skill. This experience level suggests they can contribute immediately without requiring significant onboarding in this area`;
    } else if (primaryMatch.matchType === 'related') {
      const relationship = getSkillRelationship(requirement, primaryMatch.skill);
      if (relationship.relationship === 'child') {
        feedback += `The candidate's ${experienceDepth} in ${primaryMatch.skill} demonstrates ${requirement} proficiency, since ${primaryMatch.skill} is built on ${requirement} fundamentals. This indicates they have the underlying knowledge and can apply ${requirement} concepts in practical scenarios`;
      } else if (relationship.relationship === 'parent') {
        feedback += `Through their ${experienceDepth} in ${primaryMatch.skill}, the candidate has necessarily developed ${requirement} capabilities, as this broader skillset encompasses ${requirement}. This suggests comprehensive understanding that goes beyond basic ${requirement} knowledge`;
      } else {
        feedback += `Their ${experienceDepth} in ${primaryMatch.skill} provides relevant transferable knowledge for ${requirement}. These complementary skills share similar principles and methodologies, indicating the candidate can adapt their existing expertise`;
      }
    } else {
      feedback += `The candidate demonstrates ${requirement} alignment through their ${experienceDepth} in ${primaryMatch.skill}. While not a direct match, the conceptual overlap and shared problem-solving approaches suggest they have the foundational thinking required`;
    }
  }
  // Add specific LinkedIn evidence with context and company attribution
  if (hasStrongEvidence) {
    const bestEvidence = primaryMatch.specificEvidence.find((e)=>e.type === 'leadership') || primaryMatch.specificEvidence.find((e)=>e.type === 'implementation') || primaryMatch.specificEvidence.find((e)=>e.type === 'achievement') || primaryMatch.specificEvidence[0];
    if (bestEvidence) {
      const evidenceContext = bestEvidence.type === 'leadership' ? 'leadership responsibility' : bestEvidence.type === 'implementation' ? 'hands-on implementation work' : bestEvidence.type === 'achievement' ? 'measurable achievement' : 'professional experience';
      let evidenceSource = bestEvidence.source;
      if (bestEvidence.company && bestEvidence.role) {
        evidenceSource = `${bestEvidence.role} at ${bestEvidence.company}`;
      } else if (bestEvidence.company) {
        evidenceSource = `their work at ${bestEvidence.company}`;
      }
      feedback += `. Their profile shows ${evidenceContext} during ${evidenceSource}, specifically: "${bestEvidence.quote.substring(0, 120)}`;
      if (bestEvidence.quote.length > 120) feedback += '...';
      feedback += '". This demonstrates practical application rather than just theoretical knowledge';
      if (bestEvidence.context) {
        feedback += ` and shows ${bestEvidence.context.toLowerCase()}`;
      }
    }
  }
  // Add comprehensive view of additional experience
  if (additionalMatches.length > 0) {
    const experienceDescriptions = additionalMatches.slice(0, 2).map((m)=>{
      if (m.specificEvidence && m.specificEvidence.length > 0) {
        const evidence = m.specificEvidence[0];
        return `their ${m.skill} work at ${evidence.source}, which involved ${evidence.type === 'leadership' ? 'team leadership' : evidence.type === 'implementation' ? 'hands-on development' : 'practical application'}`;
      } else {
        return `${m.yearsExperience} years of ${m.skill} experience across multiple roles`;
      }
    });
    feedback += `. The assessment also considers ${experienceDescriptions.join(' and ')}, creating a comprehensive view of their capabilities in this domain`;
  }
  // Provide specific rationale for the assessment level
  const getAssessmentRationale = (status, isMandatory, primaryMatch, skillType)=>{
    if (skillType === 'soft_skill') {
      // Handle soft skills without experience references
      if (status === 'strong') {
        return isMandatory ? 'The clear evidence of this soft skill in their professional background creates confidence in their ability to apply it effectively in this role.' : 'While optional, this soft skill represents a notable strength that would enhance team dynamics and collaboration.';
      } else if (status === 'adequate') {
        return isMandatory ? 'The soft skill is present in their background, though you may want to explore specific examples during interviews to assess depth of application.' : 'This optional soft skill adds value to their interpersonal profile.';
      } else if (status === 'weak') {
        return isMandatory ? 'The limited evidence of this soft skill suggests it may need development. Consider exploring this area in interviews and potential mentoring needs.' : 'Given this is optional, the limited evidence here is not concerning and these interpersonal skills can typically be developed.';
      }
    } else {
      // Handle technical skills with experience references
      if (status === 'strong') {
        if (primaryMatch.matchType === 'exact' && primaryMatch.yearsExperience >= 3) {
          return isMandatory ? 'The combination of direct experience and substantial tenure creates high confidence in their ability to excel in this critical area.' : 'While optional, this represents a significant strength that would add considerable value to their contribution.';
        } else {
          return isMandatory ? 'The depth and relevance of their experience provides strong assurance they can handle this essential requirement.' : 'This optional qualification is well-supported by their background and enhances their overall profile.';
        }
      } else if (status === 'adequate') {
        return isMandatory ? 'While they meet the basic requirement, you may want to explore specific examples and depth during interviews to ensure they can handle complex scenarios.' : 'This optional qualification adds value to their profile, though not at an expert level.';
      } else if (status === 'weak') {
        return isMandatory ? 'The limited or indirect experience raises questions about their readiness for this essential requirement. Consider whether additional training or support would be needed.' : 'Given this is optional, the limited experience here is not concerning and could be developed over time.';
      }
    }
    return '';
  };
  feedback += ` ${getAssessmentRationale(status, isMandatory, primaryMatch)}`;
  return feedback;
}
// Calculate proficiency level based on years of experience
function calculateProficiencyLevel(yearsExperience, skillType, requirement) {
  // Different thresholds for different skill types
  let beginnerThreshold = 2;
  let expertThreshold = 5;
  // Some skills have different learning curves
  const complexSkills = [
    'machine learning',
    'ai',
    'data science',
    'distributed systems',
    'security',
    'architecture'
  ];
  const isComplexSkill = complexSkills.some((complex)=>requirement.toLowerCase().includes(complex.toLowerCase()));
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
async function evaluateRequirement(requirement, candidateSkills, profileSkills, supabase, openaiApiKey) {
  console.log(`🔍 Evaluating requirement: ${requirement.requirement} (${requirement.type})`);
  try {
    // Find matching skills using hybrid approach
    const matches = await findMatchingSkills(requirement.requirement, candidateSkills, profileSkills, supabase, openaiApiKey);
    if (matches.length === 0) {
      return {
        requirement_name: requirement.requirement,
        score: 0,
        status: 'missing',
        feedback: generateEnhancedRecruiterFeedback(requirement.requirement, [], requirement.type, 0, 'missing', requirement.is_mandatory)
      };
    }
    // Calculate total years of experience from all matches
    let totalYears = 0;
    let maxYears = 0;
    for (const match of matches){
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
    // Enhanced scoring logic considering mandatory vs non-mandatory requirements
    let finalScore;
    if (requirement.type === 'soft_skill' && requirement.proficiency_level === null) {
      // For soft skills without proficiency levels, score based on presence and evidence quality
      const bestMatch = matches[0];
      if (bestMatch.matchType === 'exact') {
        finalScore = Math.round(75 + bestMatch.confidence * 25); // 75-100% for exact matches
      } else {
        finalScore = Math.round(50 + bestMatch.confidence * 25); // 50-75% for related matches
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
      // Calculate base final score
      let calculatedScore = Math.min(Math.round(baseScore + qualityBonus), 100);
      // Apply mandatory vs non-mandatory scoring logic
      if (requirement.is_mandatory) {
        // Mandatory requirements: score normally, but ensure higher standards
        finalScore = calculatedScore;
      } else {
        // Non-mandatory requirements: be more generous with scoring since they're "nice to have"
        // Give bonus points for any match found
        if (calculatedScore > 0) {
          finalScore = Math.min(calculatedScore + 10, 100); // +10 bonus for non-mandatory matches
        } else {
          finalScore = 0; // Still 0 if no match found
        }
      }
    }
    // Determine status with mandatory requirement considerations
    let status = 'missing';
    if (requirement.is_mandatory) {
      // Stricter thresholds for mandatory requirements
      if (finalScore >= 80) status = 'strong';
      else if (finalScore >= 60) status = 'adequate';
      else if (finalScore >= 30) status = 'weak';
    } else {
      // More lenient thresholds for non-mandatory requirements
      if (finalScore >= 70) status = 'strong';
      else if (finalScore >= 40) status = 'adequate';
      else if (finalScore >= 20) status = 'weak';
    }
    // Generate enhanced feedback with evidence and rationale
    const feedback = generateEnhancedRecruiterFeedback(requirement.requirement, matches, requirement.type, finalScore, status, requirement.is_mandatory);
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
      feedback: `Unable to evaluate ${requirement.requirement} - please review manually.`,
      is_mandatory: requirement.is_mandatory,
      evidence_details: []
    };
  }
}
// Infer candidate role type and career focus based on job requirements and LinkedIn profile
function inferCandidateRole(candidateData, requirementEvaluations, profileSkills) {
  const strongRequirements = requirementEvaluations.filter((req)=>req.status === 'strong');
  const experiences = candidateData.raw_linkedin_profile?.experiences || [];
  const totalYears = candidateData.years_of_experience || 0;
  // Analyze requirement types to infer role
  const roleSignals = {
    'frontend': strongRequirements.filter((r)=>[
        'react',
        'javascript',
        'vue',
        'angular',
        'html',
        'css'
      ].some((tech)=>r.requirement_name.toLowerCase().includes(tech))).length,
    'backend': strongRequirements.filter((r)=>[
        'python',
        'java',
        'node.js',
        'api',
        'database',
        'sql'
      ].some((tech)=>r.requirement_name.toLowerCase().includes(tech))).length,
    'fullstack': 0,
    'data': strongRequirements.filter((r)=>[
        'data science',
        'machine learning',
        'analytics',
        'sql',
        'python'
      ].some((tech)=>r.requirement_name.toLowerCase().includes(tech))).length,
    'devops': strongRequirements.filter((r)=>[
        'aws',
        'docker',
        'kubernetes',
        'ci/cd',
        'azure'
      ].some((tech)=>r.requirement_name.toLowerCase().includes(tech))).length,
    'mobile': strongRequirements.filter((r)=>[
        'react native',
        'ios',
        'android',
        'mobile'
      ].some((tech)=>r.requirement_name.toLowerCase().includes(tech))).length,
    'management': strongRequirements.filter((r)=>[
        'leadership',
        'team management',
        'project management'
      ].some((skill)=>r.requirement_name.toLowerCase().includes(skill))).length
  };
  // Calculate fullstack score
  roleSignals.fullstack = Math.min(roleSignals.frontend, roleSignals.backend);
  // Find primary role
  const sortedRoles = Object.entries(roleSignals).filter(([_, score])=>score > 0).sort(([_, a], [__, b])=>b - a);
  const primaryRole = sortedRoles.length > 0 ? sortedRoles[0][0] : 'software engineer';
  const roleConfidence = sortedRoles.length > 0 ? Math.min(sortedRoles[0][1] / Math.max(strongRequirements.length, 1) * 100, 100) : 50;
  // Determine seniority based on experience and evidence patterns
  let seniority = 'mid-level';
  if (totalYears >= 8) seniority = 'senior';
  else if (totalYears >= 12) seniority = 'staff/principal';
  else if (totalYears <= 2) seniority = 'junior';
  // Extract leadership indicators from profile
  const leadershisIndicators = [];
  const domainExpertise = [];
  if (candidateData.raw_linkedin_profile) {
    experiences.forEach((exp)=>{
      const description = exp.description?.toLowerCase() || '';
      const title = exp.title?.toLowerCase() || '';
      if (title.includes('lead') || title.includes('senior') || title.includes('architect')) {
        leadershisIndicators.push(`${exp.title} at ${exp.subtitle}`);
      }
      if (description.includes('led') || description.includes('managed team')) {
        leadershisIndicators.push(`Team leadership at ${exp.subtitle}`);
      }
      // Extract domain expertise
      const domains = [
        'fintech',
        'healthcare',
        'e-commerce',
        'enterprise',
        'startup',
        'saas'
      ];
      domains.forEach((domain)=>{
        if (description.includes(domain) || exp.subtitle?.toLowerCase().includes(domain)) {
          domainExpertise.push(domain);
        }
      });
    });
  }
  // Determine career focus areas
  const careerFocus = [];
  if (roleSignals.frontend > 0) careerFocus.push('Frontend Development');
  if (roleSignals.backend > 0) careerFocus.push('Backend Development');
  if (roleSignals.data > 0) careerFocus.push('Data Science');
  if (roleSignals.devops > 0) careerFocus.push('DevOps & Infrastructure');
  if (roleSignals.management > 0) careerFocus.push('Technical Leadership');
  // Analyze technical depth
  const techSkillCount = profileSkills.filter((s)=>[
      'programming',
      'technical_skill',
      'technology_domain'
    ].includes(s.skill) || [
      'javascript',
      'python',
      'react',
      'aws',
      'sql'
    ].some((tech)=>s.skill.toLowerCase().includes(tech))).length;
  const technicalDepth = techSkillCount > 15 ? 'Deep technical expertise across multiple domains' : techSkillCount > 8 ? 'Solid technical foundation with specialization' : 'Focused technical skillset';
  // Career progression analysis
  let careerProgression = 'Individual contributor track';
  if (leadershisIndicators.length > 1) {
    careerProgression = 'Management track with technical background';
  } else if (seniority === 'senior' || seniority === 'staff/principal') {
    careerProgression = 'Senior individual contributor track';
  }
  return {
    primary_role: primaryRole,
    role_confidence: Math.round(roleConfidence),
    career_focus: careerFocus,
    seniority_level: seniority,
    profile_analysis: {
      technical_depth: technicalDepth,
      leadership_indicators: leadershisIndicators,
      domain_expertise: [
        ...new Set(domainExpertise)
      ],
      career_progression: careerProgression
    }
  };
}
// Generate AI feedback for overall analysis and recruiter recommendations
async function generateOverallFeedback(candidateData, jobData, requirementEvaluations, profileSkills, candidateProfile, openaiApiKey) {
  try {
    const candidateName = `${candidateData.main.first_name} ${candidateData.main.last_name}`;
    const jobTitle = jobData.attributes.title;
    // Prepare enhanced analysis summary with mandatory focus
    const allMandatoryReqs = jobData.requirements.filter((req)=>req.is_mandatory);
    const allOptionalReqs = jobData.requirements.filter((req)=>!req.is_mandatory);
    // Separate mandatory and optional evaluations
    const mandatoryEvaluations = requirementEvaluations.filter((req)=>allMandatoryReqs.find((jr)=>jr.requirement === req.requirement_name));
    const optionalEvaluations = requirementEvaluations.filter((req)=>allOptionalReqs.find((jr)=>jr.requirement === req.requirement_name));
    // Categorize by strength with mandatory priority
    const strongMandatory = mandatoryEvaluations.filter((req)=>req.status === 'strong');
    const adequateMandatory = mandatoryEvaluations.filter((req)=>req.status === 'adequate');
    const weakMandatory = mandatoryEvaluations.filter((req)=>req.status === 'weak' || req.status === 'missing');
    const strongOptional = optionalEvaluations.filter((req)=>req.status === 'strong');
    const adequateOptional = optionalEvaluations.filter((req)=>req.status === 'adequate');
    const strongRequirements = [
      ...strongMandatory,
      ...strongOptional
    ];
    const weakRequirements = [
      ...weakMandatory,
      ...optionalEvaluations.filter((req)=>req.status === 'weak' || req.status === 'missing')
    ];
    const prompt = `
You are an expert recruiter analyzing how well a candidate matches a job opening. Generate human-readable content for recruiter decision-making.

## CANDIDATE & JOB CONTEXT:
**Candidate**: ${candidateName}
**Position**: ${jobTitle}
**Candidate Experience**: ${candidateData.years_of_experience} years total

## CANDIDATE PROFILE ANALYSIS:
**Inferred Role**: ${candidateProfile.primary_role} (${candidateProfile.role_confidence}% confidence)
**Seniority Level**: ${candidateProfile.seniority_level}
**Career Focus**: ${candidateProfile.career_focus.join(', ')}
**Technical Depth**: ${candidateProfile.profile_analysis.technical_depth}
**Leadership Experience**: ${candidateProfile.profile_analysis.leadership_indicators.length > 0 ? candidateProfile.profile_analysis.leadership_indicators.slice(0, 2).join(', ') : 'None identified'}
**Domain Expertise**: ${candidateProfile.profile_analysis.domain_expertise.length > 0 ? candidateProfile.profile_analysis.domain_expertise.join(', ') : 'General'}
**Career Progression**: ${candidateProfile.profile_analysis.career_progression}

## ANALYSIS RESULTS:
**MANDATORY Requirements Status**: 
- Strong: ${strongMandatory.map((r)=>r.requirement_name).join(', ') || 'None'}
- Adequate: ${adequateMandatory.map((r)=>r.requirement_name).join(', ') || 'None'}
- Gaps: ${weakMandatory.map((r)=>r.requirement_name).join(', ') || 'None'}

**Optional/Preferred Qualifications**:
- Strong: ${strongOptional.map((r)=>r.requirement_name).join(', ') || 'None'}
- Adequate: ${adequateOptional.map((r)=>r.requirement_name).join(', ') || 'None'}

**Overall Assessment**: Mandatory score impact on candidacy considering inferred role fit

## STRATEGIC CONTEXT FOR RECOMMENDATIONS:
Consider the following when generating strategic recommendations:
1. **Evidence Quality**: Strong LinkedIn evidence vs. weak claims - affects interview focus
2. **Role Fit**: How well does their inferred role align with the job opening?
3. **Seniority Match**: Are they under/over-qualified based on experience level?
4. **Growth Potential**: Can gaps be filled through training or is this a fundamental mismatch?
5. **Market Reality**: What alternatives exist if mandatory requirements have gaps?
6. **Company Needs**: Balance between ideal candidate and practical hiring decisions

## REQUIRED OUTPUT:
Return a JSON object with this structure:

{
  "overall_feedback": "1-2 sentence summary highlighting role fit and key strengths/gaps",
  "summary": {
    "strengths": ["Include role alignment, strong mandatory requirements, and standout qualifications"],
    "gaps": ["Prioritize mandatory gaps with context of role expectations"]
  },
  "recruiter_recommendations": {
    "interview_strategy": ["Specific questions to validate weak evidence areas and probe strengths"],
    "other_options": ["Strategic alternatives: role adjustments, team fit, growth trajectory, next steps"]
  }
}

Focus on role fit, practical recruiting insights, and strategic recommendations. Be specific and actionable.`;
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
    const result = JSON.parse(jsonStr);
    // Note: candidateProfile used internally for AI prompt, not returned to maintain API compatibility
    return result;
  } catch (error) {
    console.error('Error generating overall feedback:', error);
    // Fallback response
    const strongCount = requirementEvaluations.filter((req)=>req.status === 'strong').length;
    const totalCount = requirementEvaluations.length;
    return {
      overall_feedback: `Candidate shows strong alignment in ${strongCount} out of ${totalCount} key requirements. Detailed analysis completed.`,
      summary: {
        strengths: [
          "Technical skills assessment completed",
          "Experience evaluation performed"
        ],
        gaps: [
          "Manual review recommended for specific areas"
        ]
      },
      recruiter_recommendations: {
        interview_strategy: [
          "Focus on technical competencies",
          "Validate experience claims",
          "Assess cultural fit"
        ],
        other_options: [
          "Consider for related positions",
          "Evaluate for future opportunities",
          "Request work samples"
        ]
      }
    };
  }
}
// Main match analysis function
async function runMatchAnalysis(candidateData, jobData, supabase) {
  const startTime = Date.now();
  console.log("🚀 Starting Enhanced Match Analysis v3 (Simplified Embedding-Based)");
  console.log(`👤 Candidate: ${candidateData.main.first_name} ${candidateData.main.last_name}`);
  console.log(`💼 Job: ${jobData.attributes?.title}`);
  console.log(`📋 Requirements: ${jobData.requirements.length}`);
  console.log(`🧠 LinkedIn Profile Available: ${!!candidateData.raw_linkedin_profile}`);
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not found");
  }
  try {
    // Extract skills from LinkedIn profile if available
    let profileSkills = [];
    if (candidateData.raw_linkedin_profile) {
      console.log("🔍 Extracting skills from LinkedIn profile...");
      profileSkills = extractSkillsFromProfile(candidateData.raw_linkedin_profile);
      console.log(`📊 Extracted ${profileSkills.length} skills from profile`);
    }
    // Evaluate each requirement
    console.log("⚡ Evaluating job requirements...");
    const requirementEvaluations = [];
    for (const requirement of jobData.requirements){
      const evaluation = await evaluateRequirement(requirement, candidateData.skills, profileSkills, supabase, openaiApiKey);
      requirementEvaluations.push(evaluation);
    }
    // Enhanced two-tier scoring: Weight mandatory requirements heavily
    const mandatoryReqs = jobData.requirements.filter((req)=>req.is_mandatory);
    const optionalReqs = jobData.requirements.filter((req)=>!req.is_mandatory);
    // Calculate weighted scores for mandatory and optional requirements separately
    const calculateWeightedAverage = (requirements, evaluations)=>{
      if (requirements.length === 0) return 0;
      let totalWeight = 0;
      let weightedSum = 0;
      requirements.forEach((req)=>{
        const evaluation = evaluations.find((evalItem)=>evalItem.requirement_name === req.requirement);
        if (evaluation) {
          totalWeight += req.weight;
          weightedSum += evaluation.score * req.weight;
        }
      });
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    };
    const mandatoryScore = calculateWeightedAverage(mandatoryReqs, requirementEvaluations);
    const optionalScore = calculateWeightedAverage(optionalReqs, requirementEvaluations);
    // Weight mandatory requirements much more heavily (80/20 split)
    let overallScore;
    if (mandatoryReqs.length === 0) {
      // If no mandatory requirements, use optional score
      overallScore = Math.round(optionalScore);
    } else if (optionalReqs.length === 0) {
      // If no optional requirements, use mandatory score
      overallScore = Math.round(mandatoryScore);
    } else {
      // Standard case: weight mandatory 80%, optional 20%
      overallScore = Math.round(mandatoryScore * 0.8 + optionalScore * 0.2);
    }
    const getOverallStatus = (score, mandatoryScore)=>{
      // If mandatory requirements are very low, cap the status
      if (mandatoryScore < SCORING_CONFIG.ADEQUATE_THRESHOLD && mandatoryReqs.length > 0) {
        return score >= SCORING_CONFIG.ADEQUATE_THRESHOLD ? "weak" : "missing";
      }
      if (score >= SCORING_CONFIG.STRONG_THRESHOLD) return "strong";
      if (score >= SCORING_CONFIG.ADEQUATE_THRESHOLD) return "adequate";
      if (score >= SCORING_CONFIG.WEAK_THRESHOLD) return "weak";
      return "missing";
    };
    const overallStatus = getOverallStatus(overallScore, mandatoryScore);
    const matchedMandatory = mandatoryReqs.filter((req)=>{
      const evaluation = requirementEvaluations.find((evalItem)=>evalItem.requirement_name === req.requirement);
      return evaluation && evaluation.score >= SCORING_CONFIG.ADEQUATE_THRESHOLD;
    }).length;
    // Generate candidate profile analysis
    const candidateProfile = inferCandidateRole(candidateData, requirementEvaluations, profileSkills);
    // Generate overall feedback and recommendations
    console.log("🤖 Generating recruiter insights...");
    const overallFeedback = await generateOverallFeedback(candidateData, jobData, requirementEvaluations, profileSkills, candidateProfile, openaiApiKey);
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
        algorithm_version: "linkedin-v1.0",
        total_processing_time_ms: processingTime
      }
    };
    // Enhanced console logging
    console.log("\n🎯 ENHANCED MATCH ANALYSIS v3.1.1 RESULTS:");
    console.log("==========================================");
    console.log(`📊 Overall Score: ${overallScore}% (${overallStatus})`);
    console.log(`🎯 Mandatory Score: ${Math.round(mandatoryScore)}% | Optional Score: ${Math.round(optionalScore)}%`);
    console.log(`✅ Mandatory Requirements Met: ${matchedMandatory}/${mandatoryReqs.length}`);
    console.log(`🕒 Processing Time: ${processingTime}ms`);
    console.log(`🧠 Profile Skills Extracted: ${profileSkills.length}`);
    console.log(`👤 Inferred Role: ${candidateProfile.primary_role} (${candidateProfile.role_confidence}%)`);
    console.log(`📈 Seniority Level: ${candidateProfile.seniority_level}`);
    console.log(`📝 Evidence-Based Feedback: Yes (Company Attribution)`);
    console.log(`⚖️ Scoring Logic: 80% Mandatory + 20% Optional`);
    console.log("\n📋 REQUIREMENT BREAKDOWN:");
    requirementEvaluations.forEach((req, i)=>{
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
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    console.log("🎬 LinkedIn Match Analysis API - Starting");
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { candidate, job } = requestData;
    // Validate candidate data
    if (!candidate.main || !candidate.skills || !Array.isArray(candidate.skills)) {
      return new Response(JSON.stringify({
        error: "Invalid candidate data. Must contain 'main' and 'skills' array."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate job data
    if (!job.requirements || !Array.isArray(job.requirements) || job.requirements.length === 0) {
      return new Response(JSON.stringify({
        error: "Invalid job data. Must contain non-empty 'requirements' array."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`📥 Processing: ${candidate.main.first_name} ${candidate.main.last_name} vs ${job.attributes?.title}`);
    console.log(`📋 Requirements: ${job.requirements.length}, LinkedIn Profile: ${!!candidate.raw_linkedin_profile ? 'Yes' : 'No'}`);
    // Run enhanced analysis
    const result = await runMatchAnalysis(candidate, job, supabase);
    // Update timing
    result.metadata.total_processing_time_ms = Date.now() - startTime;
    console.log(`✅ Enhanced analysis v3 completed in ${result.metadata.total_processing_time_ms}ms`);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("❌ Enhanced match analysis v3 error:", error);
    return new Response(JSON.stringify({
      error: 'Enhanced analysis v3 failed',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

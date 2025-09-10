/**
 * Shared Skill Definitions for Supabase Edge Functions
 * 
 * This module contains all skill type categorizations, proficiency level criteria,
 * and soft skills keywords used across skill parsing APIs.
 * 
 * Used by:
 * - job-details-extractor
 * - parse-linkedin-skill
 * - Any future skill parsing functions
 * 
 * Mirrors: docs/apis/code/_shared/skill-definitions.js (GCP version)
 * 
 * Last updated: 2025-09-10 - Fixed Product Management categorization
 */

/**
 * Complete list of soft skills keywords for identification and matching
 * Used in skill categorization prompts and soft skill detection
 */
export const SOFT_SKILLS_KEYWORDS = [
  'Communication',
  'Public Speaking',
  'Presentation Skills',
  'Active Listening',
  'Negotiation',
  'Conflict Resolution',
  'Customer Service',
  'Relationship Building',
  'Leadership',
  'Team Leadership',
  'People Management',
  'Mentoring',
  'Coaching',
  'Decision Making',
  'Strategic Thinking',
  'Teamwork',
  'Collaboration',
  'Cross-functional Collaboration',
  'Stakeholder Management',
  'Team Building',
  'Consensus Building',
  'Problem Solving',
  'Critical Thinking',
  'Analytical Thinking',
  'Creative Thinking',
  'Innovation',
  'Research Skills',
  'Troubleshooting',
  'Adaptability',
  'Flexibility',
  'Change Management',
  'Continuous Learning',
  'Resilience',
  'Stress Management',
  'Multi-tasking',
  'Time Management',
  'Organization',
  'Attention to Detail',
  'Self-Motivation',
  'Initiative',
  'Reliability',
  'Accountability',
  'Work-Life Balance'
];

/**
 * Proficiency level criteria for skill assessment
 * Defines how years of experience map to proficiency levels
 */
export const PROFICIENCY_LEVEL_CRITERIA = `
Each proficiency level category is explained below:
"beginner":
	- Less than or equal to 2 years (0 < yoe <= 2.0) of hands-on experience with the skill OR
	- Just starting to learn and apply the skill in real-world situations

"advanced":
	- More than 2 years to less than or equal to 5 years (2.0 < yoe <= 5.0) of consistent, practical experience OR
	- Has contributed to multiple projects and is able to work independently

"expert":
	- More than 5 years (yoe > 5.0) of in-depth, specialized experience OR
	- May include responsibilities such as mentoring, providing architectural guidance, or leading initiatives

Additional Considerations: Use these to further refine the appropriate level:
- How often the skill is used (e.g., daily vs. occasionally)
- Complexity of the projects (e.g., hobby vs. production-level work)
- Experience mentoring or teaching others
- Certifications or public recognition in the field

IMPORTANT: For soft_skill and certification types, ALWAYS set proficiency_level to null regardless of experience.
`;

/**
 * Skill type categories with detailed definitions and examples
 * Comprehensive version includes culture analysis for job requirements
 * 
 * UPDATED: 2025-09-10 - Simplified from 6 skill types to 3 core types
 * CHANGE: Eliminated 'role', 'industry', 'technology_domain' as separate categories
 * CONSOLIDATION: All technical competencies now under 'technical_skill' umbrella
 * IMPACT: Simpler categorization, reduced complexity, better semantic grouping
 * 
 * ELIMINATED TYPES (now part of technical_skill):
 * - role: Job titles like "Senior Developer", "Data Scientist"
 * - industry: Domain knowledge like "Banking", "Healthcare" 
 * - technology_domain: Broad tech areas like "Machine Learning", "DevOps"
 */
export const SKILL_TYPE_CATEGORIES = `
Each skill type category is explained below (simplified to 3 core types):

- "technical_skill": All technical competencies including:
  • Programming languages, frameworks, and libraries (React, Python, JavaScript, etc.)
  • Cloud platforms and services (AWS, GCP, Azure, etc.)
  • Development tools and methodologies (Git, Docker, Agile, etc.)
  • Technology domains (Machine Learning, Data Engineering, DevOps, etc.)
  • Professional roles and titles (Software Engineer, Data Scientist, Product Manager, etc.)
  • Industry-specific technical knowledge (FinTech, Healthcare IT, etc.)
  Examples: React, AWS, JavaScript, Python, Machine Learning, Senior Developer, Product Manager, Banking Systems, Kubernetes, PostgreSQL, REST APIs

  // UPDATED: 2025-09-10 - Added "Product Manager" to technical_skill examples
  // ISSUE: Product Management was incorrectly categorized as soft_skill with null yoe/proficiency
  // SOLUTION: Explicitly include Product Manager in technical roles and examples
  // IMPACT: Product Management skills will now show proper technical matching with YoE calculation

- "soft_skill": Interpersonal and non-technical skills such as Communication, Leadership, Teamwork, and Problem-Solving. To identify these skills, scan the input and match the content against the following soft skill keywords: ${SOFT_SKILLS_KEYWORDS.join(', ')}.
        - IMPORTANT NOTE 1: While exact keyword matches are required, you must also capture the underlying idea. For example, if a input states, "communicate with stakeholders" then 'Communication' should be selected. Or if a input states, "the candidate will lead a team of 10" then 'Leadership' should be selected. Consider both the frequency of exact keyword occurrences and the relevance of content to the keywords.
        - IMPORTANT NOTE 2: For all soft skills, always set 'yoe' (years of experience) to null and 'proficiency_level' to null.
        - IMPORTANT NOTE 3: MANDATORY - If company culture information is provided, you MUST analyze it carefully and extract relevant soft skills. For example: if culture mentions "team work" → include "Teamwork"; if culture mentions "fast paced" → include "Adaptability" and "Time Management"; if culture mentions "resilience" → include "Resilience"; if culture mentions "low ego" → include "Collaboration" and "Teamwork". Always include soft skills that match or closely relate to the cultural values described. This is critical for accurate role assessment.

- "certification": Official credentials or certifications awarded by recognized institutions or providers (e.g., AWS Solutions Architect, PMP, CISSP, CPA). For certifications, ALWAYS set yoe: null and proficiency_level: null.
`;

/**
 * Helper function to build skill categorization prompt sections
 * Useful for APIs that need to inject the categorization criteria into larger prompts
 */
export function buildSkillCategorizationPrompt(includeCulture: boolean = true): string {
  return includeCulture ? SKILL_TYPE_CATEGORIES : SKILL_TYPE_CATEGORIES.replace(/- IMPORTANT NOTE 3:.*?This is critical for accurate role assessment\./s, '');
}

/**
 * Helper function to get soft skills as comma-separated string
 * Useful for prompt injection
 */
export function getSoftSkillsString(): string {
  return SOFT_SKILLS_KEYWORDS.join(', ');
}
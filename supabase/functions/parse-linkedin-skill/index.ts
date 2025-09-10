/**
 * parse-linkedin-skill
 * 
 * Updated: 2025-01-10
 * Version: 2.1.0
 * 
 * Changes:
 * - v2.0.0: Migrated to use shared skill definitions module
 * - v2.0.1: Fixed import path to use root _shared folder (proper Supabase pattern)
 * - v2.1.0: Enhanced extraction to scan headline and about sections for role-based skills (Product Manager fix)
 * - Removed inline constants (softSkillKeywords, skillTypeCategories, proficiencyLevelCriteria)
 * - Maintains all original LinkedIn profile parsing logic
 * 
 * Dependencies:
 * - ../_shared/skill-definitions.ts (root shared module)
 */

// supabase/functions/parse-linkedin-skill/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  SOFT_SKILLS_KEYWORDS,
  PROFICIENCY_LEVEL_CRITERIA,
  SKILL_TYPE_CATEGORIES
} from '../_shared/skill-definitions.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Clean JSON string - equivalent to the Python clean_json_string function
function cleanJsonString(jsonString) {
  if (!jsonString) return '';
  // Remove control characters (ASCII codes 0-31 and 127-159)
  let cleaned = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // Fix improperly escaped backslashes
  cleaned = cleaned.replace(/\\([^"\\/bfnrtu])/g, '$1');
  return cleaned;
}

// Enhanced duration parsing function
function parseDurationToYears(caption) {
  if (!caption || typeof caption !== 'string') return 0;
  const text = caption.toLowerCase();
  
  // Pattern matching for various duration formats
  const patterns = [
    // "X yrs Y mos" or "X yr Y mos"
    /(\d+)\s*yrs?\s*(\d+)\s*mos?/,
    // "X yrs" or "X yr"
    /(\d+)\s*yrs?(?!\s*\d)/,
    // "Y mos" or "Y mo"
    /(\d+)\s*mos?(?!\s*\d)/,
    // "X years Y months"
    /(\d+)\s*years?\s*(\d+)\s*months?/,
    // "X years"
    /(\d+)\s*years?(?!\s*\d)/,
    // "Y months"
    /(\d+)\s*months?(?!\s*\d)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        // Years and months format
        const years = parseInt(match[1]) || 0;
        const months = parseInt(match[2]) || 0;
        return parseFloat((years + months / 12).toFixed(1));
      } else {
        // Only years or only months
        const value = parseInt(match[1]) || 0;
        if (text.includes('month') || text.includes('mo')) {
          return parseFloat((value / 12).toFixed(1));
        } else {
          return parseFloat(value.toFixed(1));
        }
      }
    }
  }
  return 0;
}

// Calculate date span from start to end
function calculateDateSpan(startYear, endYear, isPresent = false) {
  const currentYear = 2025; // August 19, 2025
  const actualEndYear = isPresent ? currentYear : endYear;
  if (startYear && actualEndYear) {
    return parseFloat(Math.max(actualEndYear - startYear, 0).toFixed(1));
  }
  return 0;
}

// Extract year from various date formats
function extractYear(dateString) {
  if (!dateString) return null;
  const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
}

// Process LinkedIn profile using OpenAI
async function processLinkedInProfile(profileData) {
  console.log("Function processLinkedInProfile started");
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error("OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key not found in environment variables");
  }

  // Using shared definitions instead of inline constants
  const prompt = `
    You are processing a LinkedIn profile to extract structured information. Follow this simplified extraction methodology:

    ## EXTRACTION PIPELINE FLOW

    ### 1. Extract Main Profile Information
    Map directly from the profile data:
    - first_name: Extract from firstName
    - last_name: Extract from lastName  
    - country: Convert addressCountryOnly to ISO 3166-1 alpha-2 code (e.g., "Argentina" → "AR"), if null use addressWithCountry
    - email: Extract from email field (use empty string if null)
    - phone: Extract from mobileNumber, strip spaces (use empty string if null)
    - linkedin: Use linkedinUrl or construct from publicIdentifier
    - github: Detect GitHub URLs from about section and interests (use empty string if not found)

    ### 2. Extract Skills from Headline and About Section
    // ADDED: 2025-01-10 - Enhanced extraction to scan headline and about sections
    // ISSUE: Product Management roles often appear in headline/about but not experiences
    // SOLUTION: Extract role-based skills from these critical sections
    
    From headline field:
    - Extract job titles and roles (e.g., "Product Manager", "Tech Lead", "Software Engineer")
    - Common patterns: titles separated by "|", ",", or "-"
    - These become technical_skill type with experience based on currentJobDurationInYrs or overall experience
    - Example: "Tech Leader | Product Manager | Software Developer" → Extract all three as technical skills
    
    From about section:
    - Scan for role-related keywords and competencies
    - Look for patterns like "product lead", "Product lifecycle ownership", "engineering manager"
    - Extract management and leadership roles as technical_skill type
    - Use overall years_of_experience for yoe calculation if specific duration not mentioned
    - Also extract technical competencies mentioned (frameworks, languages, methodologies)

    ### 3. Extract Skills from Experience Descriptions
    For each experience in experiences[]:
    - Parse duration from caption (e.g., "1 yr 7 mos" → 1.6 years)
    - Extract ALL technologies, frameworks, and tools mentioned in description text
    - Assign the full experience duration to EVERY skill found in that experience
    - Handle nested experiences (breakdown: true with subComponents):
      * Process each subComponent separately
      * Extract skills from each subComponent's description
      * Assign the subComponent's duration to each skill found

    ### 4. Extract Skills from Skills Section (Reference-Based Only)
    For each skill in skills[]:
    - Only include skills that reference specific experiences:
      * Company names: "2 experiences across Jusmet and 1 other company"
      * Job titles: "Principal Engineer at DEPT®"
    - EXCLUDE skills with only endorsements: "23 endorsements"
    - Map referenced experiences to actual experience durations
    - Assign full experience duration to each qualifying skill

    ### 5. Extract Skills from Projects
    For each project in projects[]:
    - Parse project duration from subtitle (e.g., "Jan 2014 - Present" → calculate years)
    - If "Present", use current date (August 19, 2025)
    - Extract ALL technologies mentioned in project descriptions
    - Assign the full project duration to EVERY skill found in that project

    ### 6. Calculate Skill Experience with Overlap Detection
    For each unique skill found across all sources:
    - Create timeline for each skill mention with start/end dates
    - For overlapping periods, use the MAXIMUM duration, not sum
    - For non-overlapping periods, add durations
    - Example: AWS in Job1 (2020-2024, 4y) + Job2 (2022-2025, 3y) = 5 years total (not 7)
    - Round to one decimal place
    
    // UPDATED: 2025-09-10 - Fixed duration overlap calculation issue
    // ISSUE: Previous "simple addition" logic caused inflated skill durations
    // SOLUTION: Implement smart overlap detection to prevent double-counting concurrent roles
    // IMPACT: AWS skills will show realistic ~4.8 years instead of inflated 19.9 years

    ### 7. Extract Soft Skills and Certifications
    7.1. Soft Skills:
      - Scan about section and recommendations for keywords: ${SOFT_SKILLS_KEYWORDS.join(', ')}
      - Look for contextual mentions (e.g., "led 10 people" → "Team Leadership")
      - IMPORTANT: Set yoe: null and proficiency_level: null

    7.2. Certifications:
      - Extract from courses[] and licenseAndCertificates[] arrays
      - IMPORTANT: Set yoe: null and proficiency_level: null

    ### 8. Assign Proficiency Levels
    For technical skills, technology domains, roles, and industry skills:
    - ${PROFICIENCY_LEVEL_CRITERIA}
    - CRITICAL: soft_skill and certification types must have yoe: null and proficiency_level: null

    ### 9. Calculate Total Career Experience
    Calculate overall career span using the following specific logic:
    9.1. Find the start date of the EARLIEST experience across all experiences
    9.2. Find the end date of the LATEST experience across all experiences
    9.3. If the latest experience is "Present" or ongoing, use today's date (August 19, 2025) as the end date
    9.4. Calculate the difference: (Latest experience end date) - (Earliest experience start date)
    9.5. Express the result in years with one decimal place
    
    IMPORTANT: This calculation represents the career span from first job start to current job end, regardless of gaps or overlaps.

    ## PROCESSING EXAMPLES:

    ### Headline Skills Example:
    - Headline: "Tech Leader | Product Manager | Software Developer"
    - Extract: "Tech Leader", "Product Manager", "Software Developer" as technical_skill
    - Use currentJobDurationInYrs or overall experience for yoe
    - Result: Product Manager: 13.5 years (using overall experience)

    ### About Section Example:
    - About mentions: "product lead", "Product lifecycle ownership"
    - Extract: "Product Management" as technical_skill
    - Result: Product Management: 13.5 years

    ### Experience Skills Example:
    - DEPT® experience (3.5 years) mentions "React, Node.js, Firebase"
    - Result: React: 3.5 years, Node.js: 3.5 years, Firebase: 3.5 years

    ### Skills Section Example:
    - "JavaScript" with "2 experiences across DEPT® and Microsoft"
    - Map to actual durations: DEPT® (3.5 years) + Microsoft (2.0 years) = 5.5 years
    - Result: JavaScript: 5.5 years

    ### Projects Example:
    - Personal project (Jan 2020 - Dec 2021) mentions "Python, TensorFlow"
    - Duration: 2.0 years
    - Result: Python: 2.0 years, TensorFlow: 2.0 years

    ## SKILL CATEGORIZATION:
    
    Follow these guidelines to categorize each skill you identify: ${SKILL_TYPE_CATEGORIES}

    ## OUTPUT FORMAT:

    Return valid JSON with this structure:
    {
      "main": {
        "first_name": "string",
        "last_name": "string",
        "country": "string",
        "email": "string", 
        "phone": "string",
        "linkedin": "string",
        "github": "string"
      },
      "skills": [
        {
          "name": "string",
          "type": "technical_skill" | "soft_skill" | "certification",
          "yoe": number | null,
          "proficiency_level": "beginner" | "advanced" | "expert" | null
        }
      ],
      "years_of_experience": number
    }

    ## CRITICAL REQUIREMENTS:

    1. **Evidence-Based Skills**: Extract skills from headline, about section, experience descriptions, reference-based skills entries, and projects
    2. **Headline & About Priority**: ALWAYS extract job titles and roles from headline and about sections as technical_skill type
    3. **Full Duration Assignment**: Assign complete experience/project duration to every skill found in that source
    4. **Smart Overlap Detection**: Use timeline-based overlap detection to prevent inflated skill durations
    5. **Reference Filtering**: Include skills section entries ONLY if they reference specific companies/roles
    6. **Exclude Endorsements**: NEVER include skills with only endorsement counts
    7. **Nested Processing**: Handle subComponents in breakdown experiences separately
    8. **Formatting**: Title Case for skill names, one decimal place for numbers
    9. **Null Handling**: ALWAYS null for yoe/proficiency_level on soft_skill and certification types

    Return only valid JSON, no additional text.

    LinkedIn Profile Data:
    ${JSON.stringify(profileData)}
  `;

  try {
    console.log("Sending request to OpenAI API");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at processing LinkedIn profiles and extracting structured professional information. ALWAYS extract job titles and roles from headline and about sections first (e.g., Product Manager, Tech Lead). Then extract skills from experience descriptions, reference-based skills section entries, and projects. Assign full duration to every skill found in each source. Use overall experience for headline/about skills. CRITICAL: For soft_skill and certification types, always set yoe and proficiency_level to null."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Received response from OpenAI API");
    const result = data.choices[0].message.content;
    console.log("Extracted content from OpenAI API response");
    
    const cleanedResult = cleanJsonString(result);
    
    // Find the JSON object in the response
    const jsonStart = cleanedResult.indexOf('{');
    const jsonEnd = cleanedResult.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No valid JSON object found in the response");
    }
    
    const jsonStr = cleanedResult.substring(jsonStart, jsonEnd);
    const parsedResult = JSON.parse(jsonStr);
    
    // Add raw profile text for enhanced match analysis
    parsedResult.raw_linkedin_profile_text = JSON.stringify(profileData);
    
    return parsedResult;
  } catch (error) {
    console.error(`Error in processLinkedInProfile: ${error.message}`);
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
    throw error;
  }
}

// Edge Function handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  // Only allow POST
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
    console.log("Function parse-linkedin-skill started");
    console.log("*** UPDATED VERSION WITH SHARED DEFINITIONS IS RUNNING ***");
    
    // Parse request body
    const requestData = await req.json();
    
    // Validate input
    if (!requestData || !requestData.profile_data) {
      console.error("Invalid input received");
      return new Response(JSON.stringify({
        error: "Invalid input. Please provide 'profile_data' field."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Process the LinkedIn profile
    const result = await processLinkedInProfile(requestData.profile_data);
    console.log("Generated result");
    
    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Unhandled error: ${error.message}`);
    return new Response(JSON.stringify({
      error: 'Internal server error',
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
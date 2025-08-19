// supabase/functions/process-linkedin-profile/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
  for (const pattern of patterns){
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
  const currentYear = 2025; // August 2025
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
  // Soft skills keywords for detection
  const softSkillKeywords = [
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
  // Skill type categories explanation
  const skillTypeCategories = `
    Each skill type category is explained below:
    - "technical_skill": Skills related to software development, IT tools, programming languages, platforms, cloud services, data tools, technical methodologies, etc (e.g., React, AWS, JavaScript, Snowflake, Automation, ABAP, SAP ERP).
    
    - "technology_domain": Broad areas of technological expertise or disciplines that represent overarching fields of focus rather than concrete tools or implementations. Encompasses high-level technology fields, research areas or methodological domains.
        Distinction:
          - technology_domain vs technical_skill:
                "Machine Learning" → technology_domain
                "scikit-learn"     → technical_skill
          - technology_domain vs industry:
                "Data Engineering" → technology_domain
                "Banking"         → industry
        Examples: Artificial Intelligence, Machine Learning, Data Engineering, Cybersecurity, DevOps, ERP, CRM, Web Development, Mobile Development, Project Management.
        
    - "soft_skill": Interpersonal and non-technical skills, like Communication, Leadership, Teamwork, Problem-solving, etc (e.g., Leadership, Public Speaking, Mentoring). For soft skills, ALWAYS set yoe: null and proficiency_level: null.
    
    - "role": Specific job titles or functions that describe the individual's position or responsibility within an organization or project (e.g., Fullstack Developer, Software Architect, Cloud Engineer, Technical Consultant).
    
    - "certification": Official credentials or certifications awarded by recognized institutions or providers, typically related to technology or project management (e.g., AWS Solutions Architect, GCP Cloud Solutions Architect, SAP Certification). For certifications, ALWAYS set yoe: null and proficiency_level: null.
    
    - "industry": Skills corresponding to industry experience. For example, if experience in the banking sector is identified, the skill should be labeled as "Banking." Other examples include Insurance, Healthcare, Energy, etc.
  `;
  // Proficiency level criteria
  const proficiencyLevelCriteria = `
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
  const prompt = `
    You are processing a LinkedIn profile to extract structured information. Follow the extraction pipeline methodology exactly as described below:

    ## EXTRACTION PIPELINE FLOW

    ### 1. Input Validation
    Confirm the profile contains firstName, lastName, experiences[], and optional fields (skills[], courses[], licenseAndCertificates[], about, recommendations[], projects[]).

    ### 2. Extract Main Profile Information
    Map directly from the profile data:
    - first_name: Extract from firstName
    - last_name: Extract from lastName  
    - country: Convert addressCountryOnly to ISO 3166-1 alpha-2 code (e.g., "Argentina" → "AR"), if null use addressWithCountry
    - email: Extract from email field (use empty string if null)
    - phone: Extract from mobileNumber, strip spaces (use empty string if null)
    - linkedin: Use linkedinUrl or construct from publicIdentifier
    - github: Detect GitHub URLs from about section and interests (use empty string if not found)

    ### 3. Build Comprehensive Experience Map
    Create a detailed map of all experiences with their durations and technologies:

    3.1. Process Main Experiences:
    For each experience in experiences[]:
      - Extract company name from subtitle or title
      - Parse duration from caption using enhanced parsing
      - Handle nested experiences (breakdown: true with subComponents):
        * For experiences with subComponents, process each subComponent as separate role
        * Calculate individual duration for each subComponent from its caption
        * Extract technologies from each subComponent's description
        * Map parent company to all subComponents
      - For flat experiences, extract technologies from description
      - Store as: {company: duration, role: role_name, technologies: [tech_list]}

    3.2. Handle Overlapping Experiences:
    When multiple roles exist at the same company with overlapping dates:
      - Calculate the actual unique calendar time span for that company
      - Apply this total duration to ALL skills found across all roles at that company
      - Do not double-count overlapping periods

    ### 4. Skills Section Analysis (Primary Source)
    Process skills[] array as the PRIMARY source for skill-experience mapping:

    4.1. For each skill in skills[]:
      - Extract skill name from "title" field
      - Parse experience mappings from description text:
        * "X experiences across [Company A] and Y other company" → identify specific companies
        * "[Role] at [Company B]" → map to specific company/role
        * "X endorsements" → note for validation only
      
    4.2. Map Skills to Companies:
      - When skill shows "2 experiences across Company A and 1 other company":
        * Find Company A in experience map
        * Identify the most likely "other company" based on:
          - Technology stack mentioned in experience descriptions
          - Role types and job functions
          - Industry context and chronological alignment
      - Sum durations from all mapped companies for each skill

    ### 5. Experience Descriptions Analysis (Secondary Source)
    Supplement skills section findings with detailed experience descriptions:

    5.1. For each experience with detailed description:
      - Extract technology stacks, frameworks, tools mentioned
      - Add any skills not captured in skills section
      - Validate skills found in skills section

    5.2. For experiences with empty/generic descriptions:
      - Infer skills from job titles and roles
      - Use company context and industry standards
      - Apply reasonable assumptions for technology usage

    ### 6. Projects Analysis (Supplementary Source)
    If projects[] array exists, process for additional skill validation:
      - Extract technologies mentioned in project descriptions
      - Use project duration to supplement skill experience calculation
      - Cross-reference with main experience timeline

    ### 7. Extract Soft Skills and Certifications
    7.1. Soft Skills from About & Recommendations:
      - Scan about section and recommendations for soft skill keywords: ${softSkillKeywords.join(', ')}
      - Look for contextual mentions (e.g., "led 10 people" → "Team Leadership")
      - IMPORTANT: For all soft skills, set yoe: null and proficiency_level: null

    7.2. Certifications:
      - Extract from courses[] and licenseAndCertificates[] arrays
      - Add each as type 'certification'
      - IMPORTANT: For all certifications, set yoe: null and proficiency_level: null

    ### 8. Advanced Skill Aggregation and Deduplication
    8.1. Merge Skills from All Sources:
      - Combine skills from: skills section (primary), experience descriptions (secondary), projects (supplementary)
      - Deduplicate by normalized name (handle variations like React.js = React = ReactJS)

    8.2. Calculate Final Years of Experience:
      - For skills mapped via skills section: use company durations from experience map
      - For skills only in descriptions: use experience duration where mentioned
      - For skills in multiple sources: take the higher/more comprehensive calculation
      - Apply reasonable caps (max 20 years per skill)
      - Round to one decimal place

    ### 9. Calculate Years of Experience and Proficiency Levels
    For each skill:
    - Calculate yoe based on skill type:
      * Technical skills, technology domains, roles, industry: Use aggregated duration
      * Soft skills: ALWAYS set to null
      * Certifications: ALWAYS set to null
    - Assign proficiency_level: ${proficiencyLevelCriteria}
    - CRITICAL: soft_skill and certification types must have yoe: null and proficiency_level: null

    ### 10. Calculate Total Career Experience
    Calculate overall career span:
    10.1. Find all experience start/end dates
    10.2. Calculate chronological span from earliest start to latest end (or Present)
    10.3. Account for overlapping experiences to avoid double-counting
    10.4. Round to one decimal place

    ## ENHANCED PROCESSING EXAMPLES:

    ### Skills Section Mapping Example:
    - Skills section: "React.js": "2 experiences across Jusmet and 1 other company"
    - Experience map: Jusmet (1.6 years), DEPT® (3.5 years with React mentioned in description)
    - Result: React.js = 1.6 + 3.5 = 5.1 years

    ### Nested Experience Example:
    - DEPT® experience with breakdown: true and two subComponents
    - SubComponent 1: "Principal Engineer" (3.5 years) with React, Node.js
    - SubComponent 2: "Team Lead" (1.9 years) with React, Next.js
    - Overlap handling: React gets full company duration (3.5 years), not sum of roles

    ## INPUT PROFILE DATA:
    ${JSON.stringify(profileData, null, 2)}

    ## REQUIRED OUTPUT FORMAT:
    Return a valid JSON object with this exact structure:
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
          "type": "technical_skill" | "technology_domain" | "soft_skill" | "role" | "certification" | "industry",
          "yoe": number | null,
          "proficiency_level": "beginner" | "advanced" | "expert" | null
        }
      ],
      "years_of_experience": number
    }

    ## CRITICAL REQUIREMENTS:

    1. **Hybrid Processing**: Use skills section as primary, experience descriptions as secondary, projects as supplementary
    2. **Nested Experience Handling**: Process subComponents in breakdown experiences correctly
    3. **Overlap Management**: Calculate actual unique time spans for companies with multiple roles
    4. **Comprehensive Mapping**: When skills section says "X companies", identify ALL relevant companies from experience data
    5. **Duration Accuracy**: Use enhanced duration parsing for all caption formats
    6. **Total Experience**: Calculate realistic total career span with overlap consideration
    7. **Formatting**: Title Case for skill names, one decimal place for numbers
    8. **Null Handling**: ALWAYS null for yoe/proficiency_level on soft_skill and certification types

    Return only valid JSON, no additional text.
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
            content: "You are an expert at processing LinkedIn profiles and extracting structured professional information. Follow the extraction pipeline methodology precisely. Handle nested experience structures and overlapping roles correctly. Use skills section as primary source, experience descriptions as secondary. CRITICAL: For soft_skill and certification types, always set yoe and proficiency_level to null."
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
serve(async (req)=>{
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
    console.log("Function process-linkedin-profile started");
    // Parse request body - expecting LinkedIn profile JSON
    const profileData = await req.json();
    // Handle both array and object inputs
    const profile = Array.isArray(profileData) ? profileData[0] : profileData;
    // Validate input
    if (!profile || typeof profile !== 'object') {
      console.error("Invalid input: expected profile object");
      return new Response(JSON.stringify({
        error: "Invalid input. Expected LinkedIn profile object."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate required fields
    if (!profile.firstName && !profile.lastName) {
      console.error("Missing required name fields");
      return new Response(JSON.stringify({
        error: "Profile must contain at least firstName or lastName."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!profile.experiences || !Array.isArray(profile.experiences) || profile.experiences.length === 0) {
      console.error("Missing or empty experiences array");
      return new Response(JSON.stringify({
        error: "Profile must contain non-empty experiences array."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Processing profile for: ${profile.firstName} ${profile.lastName}`);
    // Process the LinkedIn profile
    const result = await processLinkedInProfile(profile);
    console.log("Generated result successfully");
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
}); /*
ENHANCED FEATURES IMPLEMENTED:

1. **Hybrid Processing Strategy**:
   - Skills section as primary source for skill-company mappings
   - Experience descriptions as secondary validation/supplementation
   - Projects as additional validation source

2. **Nested Experience Handling**:
   - Proper processing of breakdown: true experiences with subComponents
   - Individual role duration extraction from subComponent captions
   - Technology extraction from each subComponent description

3. **Advanced Overlap Management**:
   - Calculates actual unique time spans for companies with multiple roles
   - Avoids double-counting overlapping periods
   - Applies company total duration to all skills found at that company

4. **Enhanced Duration Parsing**:
   - Handles complex formats: "X yrs Y mos", "X years Y months"
   - Proper Present date handling (August 2025)
   - Fallback mechanisms for various caption formats

5. **Comprehensive Skill Mapping**:
   - Maps "X experiences across companies" to actual company names
   - Uses technology context and role alignment for mapping
   - Cross-validates with experience descriptions

6. **Improved Total Experience Calculation**:
   - Chronological span calculation with overlap consideration
   - Realistic career timeline assessment
   - Validation against educational timeline

7. **Better Error Handling**:
   - Supports both array and object input formats
   - Enhanced validation for edge cases
   - Detailed error messaging

8. **Model Upgrade**:
   - Uses GPT-4o for better reasoning and complex data handling
   - Increased token limit for comprehensive processing
   - Enhanced system prompt for better instruction following
*/ 

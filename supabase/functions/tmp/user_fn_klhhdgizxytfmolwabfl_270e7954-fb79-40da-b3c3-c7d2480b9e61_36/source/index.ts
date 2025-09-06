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

    ### 2. Extract Skills from Experience Descriptions
    For each experience in experiences[]:
    - Parse duration from caption (e.g., "1 yr 7 mos" → 1.6 years)
    - Extract ALL technologies, frameworks, and tools mentioned in description text
    - Assign the full experience duration to EVERY skill found in that experience
    - Handle nested experiences (breakdown: true with subComponents):
      * Process each subComponent separately
      * Extract skills from each subComponent's description
      * Assign the subComponent's duration to each skill found

    ### 3. Extract Skills from Skills Section (Reference-Based Only)
    For each skill in skills[]:
    - Only include skills that reference specific experiences:
      * Company names: "2 experiences across Jusmet and 1 other company"
      * Job titles: "Principal Engineer at DEPT®"
    - EXCLUDE skills with only endorsements: "23 endorsements"
    - Map referenced experiences to actual experience durations
    - Assign full experience duration to each qualifying skill

    ### 4. Extract Skills from Projects
    For each project in projects[]:
    - Parse project duration from subtitle (e.g., "Jan 2014 - Present" → calculate years)
    - If "Present", use current date (August 19, 2025)
    - Extract ALL technologies mentioned in project descriptions
    - Assign the full project duration to EVERY skill found in that project

    ### 5. Sum Skill Durations
    For each unique skill found across all sources:
    - Add up ALL durations where the skill was mentioned
    - No overlap handling - simple addition
    - Round to one decimal place

    ### 6. Extract Soft Skills and Certifications
    6.1. Soft Skills:
      - Scan about section and recommendations for keywords: ${softSkillKeywords.join(', ')}
      - Look for contextual mentions (e.g., "led 10 people" → "Team Leadership")
      - IMPORTANT: Set yoe: null and proficiency_level: null

    6.2. Certifications:
      - Extract from courses[] and licenseAndCertificates[] arrays
      - IMPORTANT: Set yoe: null and proficiency_level: null

    ### 7. Assign Proficiency Levels
    For technical skills, technology domains, roles, and industry skills:
    - ${proficiencyLevelCriteria}
    - CRITICAL: soft_skill and certification types must have yoe: null and proficiency_level: null

    ### 8. Calculate Total Career Experience
    Calculate overall career span using the following specific logic:
    8.1. Find the start date of the EARLIEST experience across all experiences
    8.2. Find the end date of the LATEST experience across all experiences
    8.3. If the latest experience is "Present" or ongoing, use today's date (August 19, 2025) as the end date
    8.4. Calculate the difference: (Latest experience end date) - (Earliest experience start date)
    8.5. Express the result in years with one decimal place
    
    IMPORTANT: This calculation represents the career span from first job start to current job end, regardless of gaps or overlaps.

    ## PROCESSING EXAMPLES:

    ### Experience Skills Example:
    - DEPT® experience (3.5 years) mentions "React, Node.js, Firebase"
    - Result: React = 3.5 years, Node.js = 3.5 years, Firebase = 3.5 years

    ### Skills Section Example:
    - "Next.js": "2 experiences across Jusmet and 1 other company"
    - Map to: Jusmet (1.6 years) + DEPT® (3.5 years) = 5.1 years
    - "JavaScript": "23 endorsements" → EXCLUDE (endorsement only)

    ### Project Skills Example:
    - "Velocity" project (Jan 2014 - Present = 11.7 years) mentions "EmberJs, NodeJs"
    - Result: EmberJs = 11.7 years, NodeJs = 11.7 years

    ### Skill Duration Summing Example:
    - React found in: DEPT® experience (3.5 years) + Jusmet experience (1.6 years)
    - Result: React = 3.5 + 1.6 = 5.1 years

    ### Total Years of Experience Example:
    - Earliest experience: "Making Sense LLC - AngularJS developer" starts Jun 2015
    - Latest experience: "Genium - Senior Fullstack Engineer" starts Aug 2025, marked as "Present"
    - Calculation: Aug 2025 (current date for "Present") - Jun 2015 = 10.2 years
    - Result: years_of_experience = 10.2

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

    1. **Evidence-Based Skills**: Extract skills ONLY from experience descriptions, reference-based skills entries, and projects
    2. **Full Duration Assignment**: Assign complete experience/project duration to every skill found in that source
    3. **Simple Addition**: Sum all durations for each skill across all sources (no overlap handling)
    4. **Reference Filtering**: Include skills section entries ONLY if they reference specific companies/roles
    5. **Exclude Endorsements**: NEVER include skills with only endorsement counts
    6. **Nested Processing**: Handle subComponents in breakdown experiences separately
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
            content: "You are an expert at processing LinkedIn profiles and extracting structured professional information. Extract skills ONLY from experience descriptions, reference-based skills section entries, and projects. Assign full duration to every skill found in each source. Sum all durations for each skill. CRITICAL: For soft_skill and certification types, always set yoe and proficiency_level to null."
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
SIMPLIFIED FEATURES IMPLEMENTED:

1. **Evidence-Based Skill Extraction**:
   - Skills from experience descriptions (with full experience duration)
   - Skills from reference-based skills section entries (company/role mentions)
   - Skills from project descriptions (with full project duration)
   - Exclusion of endorsement-only skills

2. **Straightforward Duration Assignment**:
   - Full experience duration assigned to every skill in that experience
   - Full project duration assigned to every skill in that project
   - Simple addition across all sources (no overlap complexity)

3. **Simplified Processing Logic**:
   - Direct skill extraction from descriptions
   - Basic reference filtering for skills section
   - Streamlined nested experience handling

4. **Maintained Core Features**:
   - Enhanced duration parsing for various formats
   - Proper Present date handling (August 19, 2025)
   - Total career span calculation (earliest start to latest end)
   - Soft skills and certifications extraction with null values

5. **Reduced Complexity**:
   - Removed complex skill-company mapping algorithms
   - Eliminated overlap management logic
   - Simplified validation and cross-referencing
   - Streamlined prompt and processing flow

6. **Better Error Handling**:
   - Supports both array and object input formats
   - Enhanced validation for edge cases
   - Detailed error messaging

7. **Model Configuration**:
   - Uses GPT-4o for reliable processing
   - Optimized token limit for simplified workflow
   - Clear system prompt for straightforward instruction following
*/ 

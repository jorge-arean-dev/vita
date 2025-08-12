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
    Confirm the profile contains firstName, lastName, experiences[], courses[], licenseAndCertificates[], about, and recommendations[].

    ### 2. Extract Main Profile Information
    Map directly from the profile data:
    - first_name: Extract from firstName
    - last_name: Extract from lastName  
    - country: Convert addressCountryOnly to ISO 3166-1 alpha-2 code (e.g., "Argentina" → "AR")
    - email: Extract from email field (use empty string if null)
    - phone: Extract from mobileNumber, strip spaces (use empty string if null)
    - linkedin: Use linkedinUrl or construct from publicIdentifier
    - github: Detect GitHub URLs from about section and interests (use empty string if not found)

    ### 3. Parse Experiences & Build Per-Role Skills
    For each experience entry:
    1. Parse the caption to extract duration in years (decimal format)
    2. Extract skills from the description text using intelligent parsing (not just delimiters)
    3. Classify each skill into the appropriate type: ${skillTypeCategories}
    4. Calculate years of experience for each skill based on role duration

    ### 4. Pull Soft Skills from About & Recommendations
    1. Scan the about section and recommendation texts for these soft skill keywords: ${softSkillKeywords.join(', ')}
    2. Add identified soft skills with type 'soft_skill'
    3. IMPORTANT: For all soft skills, set yoe: null and proficiency_level: null
    4. While exact keyword matches are required, you must also capture the underlying idea. For example, if a work experience states, "I led 10 people," then 'Team Leadership' should be selected. Consider both the frequency of exact keyword occurrences and the relevance of content to the keywords.

    ### 5. Pull Certifications
    Extract from courses[] and licenseAndCertificates[] arrays:
    - Add each as type 'certification'
    - IMPORTANT: For all certifications, set yoe: null and proficiency_level: null

    ### 6. Combine & Deduplicate Skills
    - Merge all skill entries (from experiences, soft skills, certifications)
    - Deduplicate by normalized name (case-insensitive, handle variations)
    - For technical skills, sum up years of experience across different roles
    - For soft skills and certifications, ensure yoe and proficiency_level remain null

    ### 7. Compute Years of Experience & Proficiency Levels
    For each skill:
    - Calculate yoe (years of experience) based on skill type:
      * Technical skills, technology domains, roles, industry: Sum duration across roles where skill appeared, rounded to 1 decimal place
      * Soft skills: ALWAYS set to null
      * Certifications: ALWAYS set to null
    - Assign proficiency_level based on yoe: ${proficiencyLevelCriteria}
    - Round yoe to one decimal place for applicable skill types
    - CRITICAL: soft_skill and certification types must have yoe: null and proficiency_level: null

    ### 8. Compute Overall Years of Experience
    Calculate total career span:
    - If most recent experience is ongoing (no end date): earliest_start → today
    - If most recent experience has ended: earliest_start → most_recent_end_date
    - Round to one decimal place

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

    IMPORTANT NOTES:
    - Return only valid JSON, no additional text
    - Round all numeric values to one decimal place
    - CRITICAL: Use null for yoe and proficiency_level for soft_skill and certification types
    - For other skill types, calculate yoe and proficiency_level based on experience
    - Ensure country codes are valid ISO 3166-1 alpha-2 format
    - Process all skills intelligently, don't just rely on delimiters
    - Consider the context and meaning when extracting skills from descriptions
    - Formatting Requirement: Each skill.name must be written in Title Case, with the first letter of each word capitalized (e.g., React, Amazon Web Services, Cloud Engineer). Avoid using all caps or all lowercase letters, except for established acronyms or brand-specific stylizations (e.g., AWS, GCP, iOS).
    - Proficiency level boundaries: beginner (0 < yoe <= 2.0), advanced (2.0 < yoe <= 5.0), expert (yoe > 5.0)
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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at processing LinkedIn profiles and extracting structured professional information. Follow the extraction pipeline methodology precisely. CRITICAL: For soft_skill and certification types, always set yoe and proficiency_level to null."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
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
    // Parse request body - expecting reduced LinkedIn profile JSON directly
    const profileData = await req.json();
    // Validate input - expect reduced profile object (not array)
    if (!profileData || typeof profileData !== 'object') {
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
    if (!profileData.firstName && !profileData.lastName) {
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
    if (!profileData.experiences || !Array.isArray(profileData.experiences) || profileData.experiences.length === 0) {
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
    console.log(`Processing profile for: ${profileData.firstName} ${profileData.lastName}`);
    // Process the LinkedIn profile
    const result = await processLinkedInProfile(profileData);
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
FUTURE ENHANCEMENTS TO IMPLEMENT:

1. Standalone skills[] array processing:
   - Add processing of the LinkedIn skills section with endorsement counts
   - Use endorsements to validate and weight extracted skills
   - Cross-reference standalone skills with experience-based skills

2. Title-based proficiency bumps:
   - Check if role title includes "Senior", "Lead", "Architect", "Principal"
   - Bump proficiency level by one tier for relevant skills

3. Endorsement-based proficiency adjustments:
   - Parse endorsement counts from standalone skills array
   - Adjust proficiency based on endorsement levels (e.g., >10 endorsements = expert)

4. Recency-based proficiency modifications:
   - Consider how recently a skill was used
   - Downgrade proficiency for skills not used in recent years

5. Advanced skill overlap detection:
   - Handle skill variations more intelligently (e.g., "JavaScript" vs "JS")
   - Detect skill relationships and hierarchies

6. Enhanced GitHub detection:
   - Use more sophisticated pattern matching for GitHub profiles
   - Extract GitHub username and validate profile existence

7. Improved country code mapping:
   - Handle edge cases and regional variations
   - Support multiple address formats

8. Better date parsing:
   - Handle various date formats from LinkedIn
   - Account for employment gaps in experience calculation

9. Skills weight calculation:
   - Assign importance weights to skills based on frequency and context
   - Use weights to influence proficiency level calculations

10. Enhanced data validation:
    - Add more robust input validation for edge cases
    - Implement retry logic for API failures
    - Add data quality scoring
*/ 

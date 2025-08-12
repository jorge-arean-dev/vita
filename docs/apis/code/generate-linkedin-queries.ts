// supabase/functions/generate-linkedin-queries/index.ts
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
// Generate LinkedIn Boolean queries using OpenAI
async function generateLinkedInQueries(jobData) {
  console.log("Function generateLinkedInQueries started");
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error("OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key not found in environment variables");
  }
  const systemPrompt = `You are an AI specialized in generating LinkedIn Boolean search queries compatible with both LinkedIn Recruiter and LinkedIn Sales Navigator. Your task is to produce an output consisting of two clearly structured elements based on the provided job attributes and requirements in JSON format.

Your output must include:
1. LinkedIn Boolean Query:
   
   1.1 Complete Query (ALL):
    - Include mandatory and non-mandatory skill-related (this corresponds to requirement types: "technical_skill", "industry" and "technology_domain" only) and job-title-related requirements (this corresponds to requirement types: "role" only). Make sure the boolean logic includes all mandatory requirements.
   1.2 Complete Query (SKILLS ONLY): 
    - Include mandatory and non-mandatory skill-related requirements only (this corresponds to requirement types: "technical_skill", "industry" and "technology_domain" only). Make sure the boolean logic includes all mandatory requirements.
   1.3 Complete Query (JOB TITLES ONLY): 
    - Include mandatory and non-mandatory job-titles-related requirements only (this corresponds to requirement types: "role" only). Make sure the boolean logic includes all mandatory requirements.
   1.4 Mandatory-Only Query (ALL): 
    - Include only mandatory skill-related (this corresponds to requirement types: "technical_skill", "industry" and "technology_domain" only) and job-title-related requirements (this corresponds to requirement types: "role" only). Make sure the boolean logic includes all mandatory requirements.
   1.5 Mandatory-only (SKILLS ONLY):
    - Include only mandatory skill-related requirements only (this corresponds to requirement types: "technical_skill", "industry" and "technology_domain" only). Make sure the boolean logic includes all mandatory requirements.
   1.6 Mandatory-only (JOB TITLES ONLY):
    - Include only mandatory job-titles-related requirements only (this corresponds to requirement types: "role" only). Make sure the boolean logic includes all mandatory requirements.

2. Recommendations:
   - Provide clear, structured guidance for applying filters separately on LinkedIn for aspects like location, experience years, or other requirements not directly compatible with Boolean queries.

Important considerations:
	1. When building the Boolean queries, ensure the logic aligns with both mandatory and non-mandatory requirements. In other words, construct the queries so that all mandatory requirements are effectively included. For example, if there are two requirements, "req1" and "req2", and both have 'is_mandatory = true', then the Boolean query must ensure that candidates shown in the results satisfy both req1 and req2 (req1 AND req2).
	2. Regarding the job titles or requirements of type "role", when building the Boolean queries you must also generate a Boolean OR block of common LinkedIn title variations. Include synonyms (e.g., "Engineer", "Developer"), spelling variants (e.g., "Fullstack", "Full Stack"), and seniority levels like "Senior" or "Sr" if applicable. 
		Example:  
			- Input: Senior Fullstack Developer  
			- Output: "Senior Fullstack Developer" OR "Senior Full-Stack Developer" OR "Fullstack Engineer" OR "Full Stack Engineer" OR "Senior Software Engineer"
	3. Non-technical or non-skill-related requirements—such as the "location" element from the JSON, or any child element within the "requirements" element that is not strictly a skill or technical keyword (e.g., "5+ years of professional experience")—must be addressed separately using LinkedIn's structured filters. Do not include these directly in the Boolean query. Instead, place these non-technical requirements in the second element of the output ("Recommendations").
	4. From the sample JSON input, each child element within "requirements" includes a "proficiency_level" value except for types "soft_skill" and "certification". This value can be one of three options: "beginner," "advanced," or "expert." Each level is explained below:
		"beginner":
			- Less than 2 years of hands-on experience with the skill
			- Just starting to learn and apply the skill in real-world situations
		"advanced":
			- 2 to less than 5 years of consistent, practical experience
			- Has contributed to multiple projects and is able to work independently
		"expert":
			- 5 or more years of in-depth, specialized experience
			- May include responsibilities such as mentoring, providing architectural guidance, or leading initiatives
  5. For requirements where the type is either "soft_skill" or "certification", the 'proficiency_level' can be null. Do NOT include these values in the query. Instead, use soft skills and certifications to build recommendations on how to better find candidates who align with these types of requirements.
	6. Output formatting:
		- Your response should be a valid JSON object with the following structure (this is just an example):
		"{
		  "boolean_queries": {
			"complete_query": "your complete boolean query here",
			"mandatory_only_query": "your mandatory-only boolean query here"
		  },
		  "recommendations": [
			{
			  "type": "location",
        "display_name_type": "Location",
			  "recommendation": "your location-based recommendation here"
			},
			{
			  "type": "industry",
        "display_name_type": "Industry",
			  "recommendation": "your industry-based recommendation here"
			},
      {
			  "type": "soft_skill",
        "display_name_type": "Soft Skills",
			  "recommendation": "your soft skills-related recommendation here"
			},
			{
			  "type": "function",
        "display_name_type": "Function",
			  "recommendation": "your function-based recommendation here"
			}
		  ]
		}"

		- For the recommendations array, use appropriate "type" values based on LinkedIn search filter categories such as: "location", "industry", "function", "experience", "company_size", "education", "connections", or other relevant LinkedIn filter categories. The "display_name_type" value must be equivalent to the "type" value, but formatted appropriately for display. Each recommendation should provide specific, actionable guidance for using that particular LinkedIn filter.

`;
  const userPrompt = `Based on the following job data, generate LinkedIn Boolean queries and recommendations:

${JSON.stringify(jobData, null, 2)}`;
  try {
    console.log("Sending request to OpenAI API");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
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
    console.error(`Error in generateLinkedInQueries: ${error.message}`);
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
    throw error;
  }
}
// Validate input structure
function validateInput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error("Input must be a valid JSON object");
  }
  // Check for attributes
  if (!data.attributes || typeof data.attributes !== 'object') {
    throw new Error("Missing or invalid 'attributes' field");
  }
  // Validate attributes structure
  if (!data.attributes.title || typeof data.attributes.title !== 'string') {
    throw new Error("Attributes must have a 'title' field with a string value");
  }
  // Validate location if present
  if (data.attributes.location) {
    if (typeof data.attributes.location !== 'object') {
      throw new Error("Location must be an object");
    }
    if (data.attributes.location.category && typeof data.attributes.location.category !== 'string') {
      throw new Error("Location category must be a string");
    }
    if (data.attributes.location.regions && !Array.isArray(data.attributes.location.regions)) {
      throw new Error("Location regions must be an array");
    }
    if (data.attributes.location.countries && !Array.isArray(data.attributes.location.countries)) {
      throw new Error("Location countries must be an array");
    }
  }
  // Check for requirements
  if (!data.requirements || !Array.isArray(data.requirements)) {
    throw new Error("Missing or invalid 'requirements' field - must be an array");
  }
  // Validate requirements structure
  for (const req of data.requirements){
    if (!req.requirement || typeof req.requirement !== 'string') {
      throw new Error("Each requirement must have a 'requirement' field with a string value");
    }
    if (!req.type || typeof req.type !== 'string') {
      throw new Error("Each requirement must have a 'type' field with a string value");
    }
    if (typeof req.is_mandatory !== 'boolean') {
      throw new Error("Each requirement must have an 'is_mandatory' field with a boolean value");
    }
    //if (!req.proficiency_level || typeof req.proficiency_level !== 'string') {
    //  throw new Error("Each requirement must have a 'proficiency_level' field with a string value");
    //}
    // Validate proficiency levels
    //const validProficiencyLevels = [
    //  'beginner',
    //  'advanced',
    //  'expert'
    //];
    //if (!validProficiencyLevels.includes(req.proficiency_level)) {
    //  throw new Error(`Proficiency level must be one of: ${validProficiencyLevels.join(', ')}`);
    //}
    // Validate requirement types
    const validTypes = [
      'technical_skill',
      'technology_domain',
      'soft_skill',
      'role',
      'certification',
      'industry'
    ];
    if (!validTypes.includes(req.type)) {
      throw new Error(`Requirement type must be one of: ${validTypes.join(', ')}`);
    }
  }
  return true;
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
    console.log("Function generate-linkedin-queries started");
    // Parse request body
    const requestData = await req.json();
    // Validate input
    validateInput(requestData);
    console.log("Input validated successfully");
    // Generate LinkedIn queries and recommendations
    const result = await generateLinkedInQueries(requestData);
    console.log("Generated LinkedIn queries and recommendations");
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

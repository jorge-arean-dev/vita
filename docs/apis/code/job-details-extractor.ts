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
// Generate job description using OpenAI
async function generateJobDescription(content, companyName, industry, culture = '') {
  console.log("Function generateJobDescription started");
  console.log(`Received parameters - Content: ${content?.substring(0, 30)}..., Company: ${companyName}, Industry: ${industry}, Culture: ${culture}`);
  console.log(`Culture parameter type: ${typeof culture}, value: '${culture}'`);
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error("OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key not found in environment variables");
  }
  const softSkills = [
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
  const requirementCategories = `
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
	   
	- "soft_skill": Interpersonal and non-technical skills such as Communication, Leadership, Teamwork, and Problem-Solving. To identify these skills, scan the input and match the content against the following soft skill keywords: ${softSkills.join(', ')}.
        - IMPORTANT NOTE 1: While exact keyword matches are required, you must also capture the underlying idea. For example, if a input states, "communicate with stakeholders" then 'Communication' should be selected. Or if a input states, "the candidate will lead a team of 10" then 'Leadership' should be selected. Consider both the frequency of exact keyword occurrences and the relevance of content to the keywords.
        - IMPORTANT NOTE 2: For all soft skills, always set 'yoe' (years of experience) to null and 'proficiency_level' to null.
        - IMPORTANT NOTE 3: MANDATORY - If company culture information is provided, you MUST analyze it carefully and extract relevant soft skills. For example: if culture mentions "team work" → include "Teamwork"; if culture mentions "fast paced" → include "Adaptability" and "Time Management"; if culture mentions "resilience" → include "Resilience"; if culture mentions "low ego" → include "Collaboration" and "Teamwork". Always include soft skills that match or closely relate to the cultural values described. This is critical for accurate role assessment.


	- "role": Specific job titles or functions that describe the individual's position or responsibility within an organization or project (e.g., Fullstack Developer, Software Architect, Cloud Engineer, Technical Consultant).

	- "certification": Official credentials or certifications awarded by recognized institutions or providers, typically related to technology or project management (e.g., AWS Solutions Architect, GCP Cloud Solutions Architect, SAP Certification). For certifications, ALWAYS set yoe: null and proficiency_level: null.

	- "industry": Skills corresponding to industry experience. For example, if experience in the banking sector is identified, the skill should be labeled as "Banking." Other examples include Insurance, Healthcare, Energy, etc.
	`;
  const prompt = `
    Given the following content, which contains information related to a job search (It may be a job description or notes from a client call regarding a hiring need):

    ${content}

    Company Name: ${companyName}
    Industry: ${industry}
    ${culture ? `Company Culture: ${culture}` : 'Company Culture: Not provided'}

    IMPORTANT: When analyzing requirements, pay special attention to the Company Culture information provided above. Use it to identify relevant soft skills that would be important for this role based on the company's values and work environment.

    Please generate a JSON that includes the following parent groups: attributes and requirements. Each parent group should follow these guidelines:
	
		- "attributes" must have this structure:
		
			{"title": "", "rate": {"value": <number>, "freq": ""}, "commitment": "", "duration": "", "location": {"category": "", "regions": ["",""], "countries": ["",""]}}
		
			- Below are considerations about child elements from "attributes":
				- title: The title of the position. If not provided, generate it based on the content provided
				- rate: This element contains 2 elements: "value" and "freq". "value" represent the numerical value corresponding to either the rate or the salary. "freq" corresponds to the payment frequency. Allowed values for "freq' are "hourly", "weekly", "monthly", "yearly". You must process the input provided and identify the respective values for "value" and "freq". If rate/salary information is not provided or not available, the content must be empty.
				- commitment: This attribute can be either "full_time" or "part_time" or "hourly". If not provided, the content must be empty.
				- duration: The duration of the job. The content must be categorized within any of these category values only: "2_4_weeks", "4_8_weeks", "3_6_months", "6_12_months", "12_plus_months" or "permanent". If not provided, the content must be empty.
				- location: If provided, you must identify the location-related information, and interpret it. Within "location", there must be 3 elements: "category", "regions" and "countries". In "category", based on the input, you must put any these values only: "remote_global" (100% remote position, all countries/regions are permitted with no restrictions), "remote_region_specific" (remote position but restricted to certain regions), "remote_country_specific" (remote position but restricted to certain countries), "hybrid" (hybrid position), "on_site" (on-site position). If not provided, this attribute must be set to "remote_global". In "regions" you must indicate the allowed regions (this value will be empty for "remote_global", "remote_country_specific", "hybrid" and "on_site"). In "countries" you must indicate the allowed countries (this value will be empty for "remote_global" and "remote_region_specific"). For "regions" values use any of these values only: "north_america", "south_america", "central_america", "west_europe", "east_europe", "africa", "middle_east", "oceania", "americas", "asia", "europe". Dont use other values for "regions" by any mean. For "countries", allowed values are the countries respective ISO codes (2 characters only). No other values are permitted. If no location information is provided, this element must be empty.
				
		- "requirements" is an array of requirement objects. Each object in the array follows a standard structure with the following fields:
			- requirement (string): Requirement name.
			- type (string): The category of the requirement which must be one of: "technical_skill", "technology_domain", "soft_skill", "role", "certification", or "industry". Follow these guidelines to categorize each requirement you identify: ${requirementCategories}
			- is_mandatory (boolean): Indicates whether the requirement is mandatory. Determine this based on the information provided. If no explicit information is available for a specific requirement, default to true.
			- proficiency_level (string): The expected level of proficiency which must be one of: "beginner", "advanced", "expert". Follow these guidelines to assign a proficiency level for each requirement you identify: ${proficiencyLevelCriteria}. If you can't assign a proficiency level by following the provided guidelines, default it to "advanced"
			- weight (number): A numeric value between 0.00 and 1.00 that indicates the relative importance of the requirement. Determine the weight based on factors such as frequency in the input content, emphasis during mentions, and contextual relevance. Use the following scale as a guideline: Critical → 1.00, High → 0.75, Medium → 0.50, Low → 0.25, Optional → 0.10. Important: Do not confuse weight with proficiency_level. If a specific weight cannot be determined, default to 0.50.

    Note: If you don't have information about any of the mentioned sections, omit it!	
	Ensure that the response is a valid JSON object and contains no other text.`;
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
            content: "You are a helpful assistant that processes job descriptions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
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
    return {
      parsed_response: parsedResult
    };
  } catch (error) {
    console.error(`Error in generateJobDescription: ${error.message}`);
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
    console.log("Function process-job-description started");
    console.log("*** NEW CODE VERSION WITH CULTURE SUPPORT IS RUNNING ***");
    // Parse request body
    const requestData = await req.json();
    // Validate input
    if (!requestData || !requestData.content || !requestData.company_name || !requestData.industry) {
      console.error("Invalid input received");
      return new Response(JSON.stringify({
        error: "Invalid input. Please provide 'content', 'company_name', and 'industry' fields."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { content, company_name: companyName, industry, culture = '' } = requestData;
    console.log(`Company Name: ${companyName}`);
    console.log(`Industry: ${industry}`);
    // Process the job description
    const result = await generateJobDescription(content, companyName, industry, culture);
    console.log("Generated result");
    // Return successful response
    return new Response(JSON.stringify(result.parsed_response), {
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

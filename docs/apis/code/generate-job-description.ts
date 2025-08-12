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
async function generateJobDescription(initialNotes, companyName, industry, attributes, requirements) {
  console.log("Function generateJobDescription started");
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error("OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key not found in environment variables");
  }
  // Helper function to format requirements by mandatory status
  const formatRequirementsForPrompt = (requirements)=>{
    const mandatory = requirements.filter((req)=>req.is_mandatory);
    const optional = requirements.filter((req)=>!req.is_mandatory);
    let formatted = "Mandatory Requirements:\n";
    mandatory.forEach((req)=>{
      const proficiencyText = req.proficiency_level ? ` (${req.proficiency_level} level)` : '';
      formatted += `- ${req.requirement}${proficiencyText} [${req.type}]\n`;
    });
    if (optional.length > 0) {
      formatted += "\nOptional/Nice to Have:\n";
      optional.forEach((req)=>{
        const proficiencyText = req.proficiency_level ? ` (${req.proficiency_level} level)` : '';
        formatted += `- ${req.requirement}${proficiencyText} [${req.type}]\n`;
      });
    }
    return formatted;
  };
  // Helper function to format attributes for prompt
  const formatAttributesForPrompt = (attributes)=>{
    let formatted = "Job Attributes:\n";
    formatted += `- Title: ${attributes.title || 'Not specified'}\n`;
    if (attributes.rate && attributes.rate.value) {
      formatted += `- Rate: ${attributes.rate.value} ${attributes.rate.freq}\n`;
    }
    if (attributes.commitment) {
      formatted += `- Commitment: ${attributes.commitment}\n`;
    }
    if (attributes.duration) {
      formatted += `- Duration: ${attributes.duration}\n`;
    }
    if (attributes.location) {
      formatted += `- Location: ${attributes.location.category}`;
      if (attributes.location.regions && attributes.location.regions.length > 0) {
        formatted += ` (Regions: ${attributes.location.regions.join(', ')})`;
      }
      if (attributes.location.countries && attributes.location.countries.length > 0) {
        formatted += ` (Countries: ${attributes.location.countries.join(', ')})`;
      }
      formatted += "\n";
    }
    return formatted;
  };
  const prompt = `
    You are tasked with generating a professional job description based on structured data and additional notes.

    STRUCTURED DATA (Primary Source):
    Company: ${companyName}
    Industry: ${industry}
    
    ${formatAttributesForPrompt(attributes)}
    
    ${formatRequirementsForPrompt(requirements)}

    ADDITIONAL NOTES (Secondary Source - for extra context about tasks/responsibilities):
    ${initialNotes || 'No additional notes provided'}

    Please generate a job description that follows this exact structure:

    About the company:
    \\n\\n
    [General information about ${companyName} and its ${industry} industry/sector. Do not mention the company name directly.]
    \\n\\n
    About the role:
    \\n\\n
    [General description including Position Title from attributes, Key Responsibilities (use initial_notes for additional context), and role summary]
    \\n\\n
    Requirements:
    \\n\\n
    [Organize requirements into two sections based on the is_mandatory field:
    
    Mandatory:
    - List mandatory requirements with their proficiency levels where applicable
    
    Nice to have:
    - List optional requirements with their proficiency levels where applicable
    
    Format: 'Mandatory:\\n- Requirement 1\\n- Requirement 2\\n\\nNice to Have:\\n- Requirement 3\\n- Requirement 4']
    \\n\\n
    Position Highlights:
    \\n\\n
    [Include relevant job attributes like commitment, duration, location, and rate if available. Write this in a natural, flowing manner. Format: 'Position Highlights:\\n- Item 1\\n- Item 2\\n...']

    IMPORTANT INSTRUCTIONS:
    1. Use the structured attributes and requirements as your PRIMARY source
    2. Use initial_notes only for additional context about tasks or responsibilities
    3. Write in third person
    4. When referring to the hiring party, use "Our client is..." or "We are looking for..."
    5. Return ONLY a JSON object with this format: {"job_description": "your generated description here"}
    6. Ensure the JSON is valid and contains no other text
    7. Include \\n\\n for paragraph breaks in the job description text
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
            content: "You are a professional recruiter assistant that generates well-structured job descriptions. Always return valid JSON in the exact format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
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
    // Validate that the response has the expected structure
    if (!parsedResult.job_description) {
      throw new Error("Invalid response structure: missing job_description field");
    }
    return parsedResult;
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
    // Parse request body
    const requestData = await req.json();
    // Validate input
    if (!requestData || !requestData.company_name || !requestData.industry || !requestData.attributes || !requestData.requirements) {
      console.error("Invalid input received");
      return new Response(JSON.stringify({
        error: "Invalid input. Please provide 'company_name', 'industry', 'attributes', and 'requirements' fields."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { initial_notes: initialNotes = '', company_name: companyName, industry, attributes, requirements } = requestData;
    console.log(`Company Name: ${companyName}`);
    console.log(`Industry: ${industry}`);
    console.log(`Requirements count: ${requirements?.length || 0}`);
    // Validate requirements structure
    if (!requirements || !Array.isArray(requirements)) {
      return new Response(JSON.stringify({
        error: "Invalid requirements structure. Expected 'requirements' to be an array."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Process the job description
    const result = await generateJobDescription(initialNotes, companyName, industry, attributes, requirements);
    console.log("Generated job description successfully");
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

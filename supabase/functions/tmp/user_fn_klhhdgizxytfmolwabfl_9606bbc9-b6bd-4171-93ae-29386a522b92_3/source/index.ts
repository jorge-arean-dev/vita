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
// Generate email using OpenAI
async function generateEmail(jobInformation, candidateInformation, emailType, userPrompt, senderInformation) {
  console.log("Function generateEmail started");
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error("OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key not found in environment variables");
  }
  // Helper function to format job information for prompt
  const formatJobForPrompt = (jobInfo)=>{
    let formatted = "Job Information:\n";
    formatted += `- Company: ${jobInfo.company_name}\n`;
    formatted += `- Industry: ${jobInfo.industry}\n`;
    formatted += `- Position: ${jobInfo.attributes?.title || 'Not specified'}\n`;
    if (jobInfo.attributes?.rate?.value) {
      formatted += `- Rate: ${jobInfo.attributes.rate.value} ${jobInfo.attributes.rate.freq}\n`;
    }
    if (jobInfo.attributes?.commitment) {
      formatted += `- Commitment: ${jobInfo.attributes.commitment}\n`;
    }
    if (jobInfo.attributes?.duration) {
      formatted += `- Duration: ${jobInfo.attributes.duration}\n`;
    }
    if (jobInfo.attributes?.location) {
      formatted += `- Location: ${jobInfo.attributes.location.category}`;
      if (jobInfo.attributes.location.countries && jobInfo.attributes.location.countries.length > 0) {
        formatted += ` (Countries: ${jobInfo.attributes.location.countries.join(', ')})`;
      }
      formatted += "\n";
    }
    if (jobInfo.requirements && jobInfo.requirements.length > 0) {
      const mandatory = jobInfo.requirements.filter((req)=>req.is_mandatory);
      const optional = jobInfo.requirements.filter((req)=>!req.is_mandatory);
      if (mandatory.length > 0) {
        formatted += "\nKey Requirements:\n";
        mandatory.slice(0, 5).forEach((req)=>{
          const proficiencyText = req.proficiency_level ? ` (${req.proficiency_level} level)` : '';
          formatted += `- ${req.requirement}${proficiencyText}\n`;
        });
      }
      if (optional.length > 0) {
        formatted += "\nNice to Have:\n";
        optional.slice(0, 3).forEach((req)=>{
          const proficiencyText = req.proficiency_level ? ` (${req.proficiency_level} level)` : '';
          formatted += `- ${req.requirement}${proficiencyText}\n`;
        });
      }
    }
    if (jobInfo.initial_notes) {
      formatted += `\nAdditional Context: ${jobInfo.initial_notes}\n`;
    }
    return formatted;
  };
  // Helper function to format sender information for prompt
  const formatSenderForPrompt = (senderInfo)=>{
    if (!senderInfo) {
      return "Sender Information: Not provided (use generic signature)";
    }
    let formatted = "Sender Information:\n";
    if (senderInfo.first_name || senderInfo.last_name) {
      const fullName = [
        senderInfo.first_name,
        senderInfo.last_name
      ].filter(Boolean).join(' ');
      formatted += `- Name: ${fullName}\n`;
    }
    if (senderInfo.position) {
      formatted += `- Position: ${senderInfo.position}\n`;
    }
    if (senderInfo.company) {
      formatted += `- Company: ${senderInfo.company}\n`;
    }
    return formatted;
  };
  // Helper function to format candidate information for prompt
  const formatCandidateForPrompt = (candidateInfo)=>{
    if (!candidateInfo || !candidateInfo.first_name && !candidateInfo.last_name) {
      return "Candidate Information: Not provided (use placeholders like [Candidate Name] in greetings)";
    }
    let formatted = "Candidate Information:\n";
    if (candidateInfo.first_name || candidateInfo.last_name) {
      const fullName = [
        candidateInfo.first_name,
        candidateInfo.last_name
      ].filter(Boolean).join(' ');
      formatted += `- Name: ${fullName}\n`;
    }
    if (candidateInfo.country) {
      formatted += `- Country: ${candidateInfo.country}\n`;
    }
    return formatted;
  };
  // Define tone and structure guidelines based on email type
  const getToneGuidelines = (emailType)=>{
    if (emailType === 'client') {
      return `
TONE & STYLE GUIDELINES FOR CLIENT EMAILS:
- Use formal, professional business language
- Focus on candidate value propositions and business benefits
- Highlight relevant skills and experience that match job requirements
- Include specific details that demonstrate candidate quality
- Use confident, persuasive language to present the candidate favorably
- Structure: Professional greeting, clear purpose, candidate highlights, next steps, professional closing

SUBJECT LINE PATTERNS (be creative within these frameworks):
- "Candidate Presentation - [Job Title] Position"
- "Qualified Candidate for [Job Title] - [Company Name]"
- "[Job Title] Candidate Submission - [Brief Highlight]"
- "Presenting: [Candidate Quality] for [Job Title] Role"`;
    } else {
      return `
TONE & STYLE GUIDELINES FOR CANDIDATE EMAILS:
- Use engaging, friendly, and encouraging language
- Focus on the opportunity and career growth potential
- Make the role sound exciting and appealing
- Include specific details about the company and position benefits
- Use warm, inviting language that encourages response
- Structure: Friendly greeting, opportunity introduction, role highlights, company benefits, call to action

SUBJECT LINE PATTERNS (be creative within these frameworks):
- "Exciting Opportunity - [Job Title] at [Company Name]"
- "[Company Name] - [Job Title] Position Available"
- "New [Job Title] Opportunity - [Key Benefit/Highlight]"
- "[Job Title] Role at [Company Name] - [Appeal Factor]"`;
    }
  };
  const systemPrompt = `You are a professional recruiter assistant that generates personalized emails for recruitment workflows. You must create both engaging subject lines and well-structured email bodies based on the provided context.

${getToneGuidelines(emailType)}

IMPORTANT FORMATTING INSTRUCTIONS:
1. Return ONLY a JSON object with this exact format: {"subject": "your subject here", "body": "your email body here"}
2. Use \\n\\n for paragraph breaks in the email body
3. When candidate information is not provided, use placeholders like [Candidate Name] in greetings
4. Include appropriate email signature based on sender information
5. Create clear paragraph structure: greeting, main content, closing, signature
6. Ensure the JSON is valid and contains no other text`;
  const userMessage = `
${formatJobForPrompt(jobInformation)}

${formatCandidateForPrompt(candidateInformation)}

${formatSenderForPrompt(senderInformation)}

EMAIL TYPE: ${emailType}

USER INSTRUCTION: ${userPrompt}

Generate an appropriate email with subject and body that fulfills the user's request while following the tone guidelines for ${emailType} emails. Include a professional signature based on the sender information.`;
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
            content: systemPrompt
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
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
    if (!parsedResult.subject || !parsedResult.body) {
      throw new Error("Invalid response structure: missing subject or body field");
    }
    return parsedResult;
  } catch (error) {
    console.error(`Error in generateEmail: ${error.message}`);
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
    console.log("Function generate-email started");
    // Parse request body
    const requestData = await req.json();
    // Validate input
    if (!requestData || !requestData.job_information || !requestData.email_type || !requestData.prompt || !requestData.sender_information) {
      console.error("Invalid input received");
      return new Response(JSON.stringify({
        error: "Invalid input. Please provide 'job_information', 'email_type', 'prompt', and 'sender_information' fields."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { job_information: jobInformation, candidate_information: candidateInformation = null, email_type: emailType, prompt: userPrompt, sender_information: senderInformation } = requestData;
    // Validate email_type
    if (emailType !== 'client' && emailType !== 'candidate') {
      return new Response(JSON.stringify({
        error: "Invalid email_type. Must be either 'client' or 'candidate'."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate job_information structure
    if (!jobInformation.company_name || !jobInformation.industry || !jobInformation.attributes) {
      return new Response(JSON.stringify({
        error: "Invalid job_information structure. Missing required fields: company_name, industry, or attributes."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate sender_information structure
    if (!senderInformation || !senderInformation.first_name) {
      return new Response(JSON.stringify({
        error: "Invalid sender_information structure. Missing required field: first_name. Fields last_name, position and company are optional."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Email Type: ${emailType}`);
    console.log(`Company: ${jobInformation.company_name}`);
    console.log(`Position: ${jobInformation.attributes?.title || 'Not specified'}`);
    console.log(`Sender: ${senderInformation.first_name}${senderInformation.last_name ? ' ' + senderInformation.last_name : ''}`);
    // Generate the email
    const result = await generateEmail(jobInformation, candidateInformation, emailType, userPrompt, senderInformation);
    console.log("Generated email successfully");
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

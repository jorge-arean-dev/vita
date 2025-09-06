// supabase/functions/generate-interview-questions/index.ts
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
// Generate interview questions using OpenAI
async function generateInterviewQuestions(jobData) {
  console.log("Function generateInterviewQuestions started");
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error("OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key not found in environment variables");
  }
  const systemPrompt = `You are an AI assistant that helps non-technical recruiters generate initial screening questions for job candidates. 
Your task:
- Read an input JSON object with the following fields:
  • "title": string — the job title
  • "job_requirements": array of objects — each containing requirement, type, is_mandatory, and proficiency_level
  • "company_culture": string — description of company values or culture (may be empty)
  • "job_description": string — full job description

- Understanding proficiency levels:
  Each requirement includes a "proficiency_level" value. This value can be one of three options: "beginner," "advanced," or "expert." Each level is explained below:
  "beginner":
    - Less than 2 years of hands-on experience with the skill
    - Just starting to learn and apply the skill in real-world situations
  "advanced":
    - 2 to less than 5 years of consistent, practical experience
    - Has contributed to multiple projects and is able to work independently
  "expert":
    - 5 or more years of in-depth, specialized experience
    - May include responsibilities such as mentoring, providing architectural guidance, or leading initiatives

  Note: For requirements of type "soft_skill" or "certification", the proficiency_level may be empty, as these don't always require specific experience levels.

- Produce exactly 12 questions in a JSON object, with this structure:
{
  "questions": [
    {
      "type": "<type>",
      "question": "<question text>"
    },
    … (12 total items)
  ]
}
- Valid "type" values (each must appear exactly twice):
  • technical
  • problem_solving
  • communication
  • leadership
  • learning
  • cultural
- In questions of type = technical, they must be suitable for a non-technical interviewer (e.g., a recruiter) during an initial 20–30 minute screening. They should help determine basic fit before referring candidates on to hiring managers.
- In questions of type = technical, they must be specifically tailored to the skill, tool, or technology being evaluated. Avoid fully generic or interchangeable questions; instead, ensure each one is accurate and meaningful for the specific subject it addresses.
- Questions—especially where type = technical—should be concrete and concise to minimize the need for clarification by the candidate and to help non-technical interviewers feel confident in delivering them.
- If "company_culture" is empty or blank, generate two generic cultural-fit questions (e.g., about values, teamwork, motivation).
- Do NOT include any other fields or explanatory text in your output—return only the JSON object with the "questions" array.
Example output format (with made-up questions):
{
  "questions": [
    {
      "type": "technical",
      "question": "Can you describe your experience with [skill from job_requirements]?"
    },
    {
      "type": "technical",
      "question": "How have you applied [another requirement] in a past role?"
    },
    {
      "type": "problem_solving",
      "question": "Tell me about a time you faced an unexpected challenge and how you solved it."
    },
    {
      "type": "problem_solving",
      "question": "Can you walk me through how you approach solving unfamiliar problems?"
    },
    {
      "type": "communication",
      "question": "How do you ensure your ideas are clearly communicated when working with others?"
    },
    {
      "type": "communication",
      "question": "Tell me about a time you had to explain something complex to someone without your background."
    },
    {
      "type": "leadership",
      "question": "Describe a situation where you took initiative on a project."
    },
    {
      "type": "leadership",
      "question": "Have you ever helped mentor or support a teammate? What was your approach?"
    },
    {
      "type": "learning",
      "question": "Tell me about a time you had to quickly learn a new skill or tool."
    },
    {
      "type": "learning",
      "question": "How do you stay up to date with changes in your industry or area of expertise?"
    },
    {
      "type": "cultural",
      "question": "What kind of work environment helps you do your best work?"
    },
    {
      "type": "cultural",
      "question": "How do you make sure your personal values align with a company's mission?"
    }
  ]
}
Now generate the JSON of 12 questions following these rules.`;
  const userPrompt = `Based on the following job data, generate 12 interview questions:

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
    // Validate the response structure
    if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
      throw new Error("Invalid response structure: missing questions array");
    }
    if (parsedResult.questions.length !== 12) {
      throw new Error(`Expected 12 questions, got ${parsedResult.questions.length}`);
    }
    // Validate question types
    const validTypes = [
      'technical',
      'problem_solving',
      'communication',
      'leadership',
      'learning',
      'cultural'
    ];
    const typeCounts = {};
    for (const question of parsedResult.questions){
      if (!question.type || !question.question) {
        throw new Error("Each question must have 'type' and 'question' fields");
      }
      if (!validTypes.includes(question.type)) {
        throw new Error(`Invalid question type: ${question.type}`);
      }
      typeCounts[question.type] = (typeCounts[question.type] || 0) + 1;
    }
    // Check that each type appears exactly twice
    for (const type of validTypes){
      if (typeCounts[type] !== 2) {
        throw new Error(`Type '${type}' must appear exactly twice, got ${typeCounts[type] || 0}`);
      }
    }
    return parsedResult;
  } catch (error) {
    console.error(`Error in generateInterviewQuestions: ${error.message}`);
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
  // Check for required fields
  if (!data.title || typeof data.title !== 'string') {
    throw new Error("Missing or invalid 'title' field - must be a string");
  }
  if (!data.job_requirements || !Array.isArray(data.job_requirements)) {
    throw new Error("Missing or invalid 'job_requirements' field - must be an array");
  }
  if (!data.job_description || typeof data.job_description !== 'string') {
    throw new Error("Missing or invalid 'job_description' field - must be a string");
  }
  // company_culture can be empty string, but must be a string if present
  if (data.company_culture !== undefined && typeof data.company_culture !== 'string') {
    throw new Error("Invalid 'company_culture' field - must be a string");
  }
  // Validate job_requirements array structure
  for(let i = 0; i < data.job_requirements.length; i++){
    const req = data.job_requirements[i];
    if (!req || typeof req !== 'object') {
      throw new Error(`Job requirement at index ${i} must be an object`);
    }
    if (!req.requirement || typeof req.requirement !== 'string') {
      throw new Error(`Job requirement at index ${i} must have a 'requirement' field with a string value`);
    }
    if (!req.type || typeof req.type !== 'string') {
      throw new Error(`Job requirement at index ${i} must have a 'type' field with a string value`);
    }
    if (typeof req.is_mandatory !== 'boolean') {
      throw new Error(`Job requirement at index ${i} must have an 'is_mandatory' field with a boolean value`);
    }
    // Validate requirement types first
    const validTypes = [
      'technical_skill',
      'technology_domain',
      'soft_skill',
      'role',
      'certification',
      'industry'
    ];
    if (!validTypes.includes(req.type)) {
      throw new Error(`Requirement type at index ${i} must be one of: ${validTypes.join(', ')}`);
    }
    // Validate proficiency_level based on requirement type
    const allowsEmptyProficiency = req.type === 'soft_skill' || req.type === 'certification';
    if (allowsEmptyProficiency) {
      // For soft_skill and certification, proficiency_level can be empty string, null, undefined, or valid value
      if (req.proficiency_level !== undefined && req.proficiency_level !== null && typeof req.proficiency_level !== 'string') {
        throw new Error(`Job requirement at index ${i} must have a 'proficiency_level' field with a string value, null, or undefined`);
      }
      // If proficiency_level is provided and not empty/null, validate it
      if (req.proficiency_level && typeof req.proficiency_level === 'string' && req.proficiency_level.trim() !== '') {
        const validProficiencyLevels = [
          'beginner',
          'advanced',
          'expert'
        ];
        if (!validProficiencyLevels.includes(req.proficiency_level)) {
          throw new Error(`Proficiency level at index ${i} must be one of: ${validProficiencyLevels.join(', ')}, empty, or null for soft_skill/certification types`);
        }
      }
    } else {
      // For other types, proficiency_level is required and must be valid
      if (!req.proficiency_level || typeof req.proficiency_level !== 'string') {
        throw new Error(`Job requirement at index ${i} must have a 'proficiency_level' field with a string value`);
      }
      const validProficiencyLevels = [
        'beginner',
        'advanced',
        'expert'
      ];
      if (!validProficiencyLevels.includes(req.proficiency_level)) {
        throw new Error(`Proficiency level at index ${i} must be one of: ${validProficiencyLevels.join(', ')}`);
      }
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
    console.log("Function generate-interview-questions started");
    // Parse request body
    const requestData = await req.json();
    // Validate input
    validateInput(requestData);
    console.log("Input validated successfully");
    // Generate interview questions
    const result = await generateInterviewQuestions(requestData);
    console.log("Generated interview questions successfully");
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

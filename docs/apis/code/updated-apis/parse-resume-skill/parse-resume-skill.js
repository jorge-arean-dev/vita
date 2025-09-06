const functions = require('@google-cloud/functions-framework');
const { OpenAI } = require('openai');
const axios = require('axios');

// Import shared definitions
const { 
  SOFT_SKILLS_KEYWORDS,
  PROFICIENCY_LEVEL_CRITERIA,
  SKILL_TYPE_CATEGORIES
} = require('./_shared/skill-definitions.js');

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Download PDF from URL and return as ArrayBuffer
async function downloadPdf(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max file size
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResumeParser/1.0)'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
}

// Extract text from PDF using pdf-parse (better alternative)
async function extractTextFromPdf(pdfData) {
  try {
    // Use pdf-parse instead of pdf.js for server-side parsing
    const pdf = require('pdf-parse');
    const data = await pdf(pdfData);
    
    console.log(`PDF processed, pages: ${data.numpages}`);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Parse resume text with OpenAI
async function parseResumeText(resumeText) {
  // Using shared skill extraction criteria from shared definitions
  const skillExtractionCriteria = `Analyze the full resume and identify every skill mentioned in the work experience section, education section, summary/objective section, and certifications section. Each skill must be captured with the following parameters:

	1) Years of Experience – The exact number of years the individual has used that specific skill, rounded to 1 decimal place.

	2) Proficiency Level  
	Based on the number of years of experience you provided, please assign a Proficiency Level using the criteria below:

	${PROFICIENCY_LEVEL_CRITERIA}

	3) Category – Assign one of the following categories based on the nature of the skill:
	${SKILL_TYPE_CATEGORIES}

	Formatting Requirement:
	Each skill must be written in Title Case, with the first letter of each word capitalized (e.g., React, Amazon Web Services, Cloud Engineer). Avoid using all caps or all lowercase letters, except for established acronyms or brand-specific stylizations (e.g., AWS, GCP, iOS).

	NULL VALUE RULES:
	- soft_skill type: yoe = null, proficiency_level = null
	- certification type: yoe = null, proficiency_level = null
	- All other types: calculate yoe (rounded to 1 decimal) and proficiency_level based on experience`;
  
  const prompt = `
    Please process, analyze and extract relevant information from the following resume and generate an output in json format.
    **Important:** Output only the JSON object without any additional text or markdown formatting.

    The JSON structure should include the following parent groups: main, skills, and years_of_experience. 

    "main" contains the fields:  
    1. first_name (candidate's first name), 
    2. last_name (candidate's last name), 
    3. country (candidate's country of residence as provided by the client. When returning the country, the value to return here must correspond to the country ISO code. For example, for United States the value returned must be "US"),  
    4. email (candidate's email address),  
    5. phone (candidate's phone number if provided with no spacing between numbers),  
    6. linkedin (candidate's LinkedIn profile URL if provided. In some occasions the linkedin profile might be displayed by only indicating the username, in that case, please add the full URL to the field. Leave this field empty if not available)
    7. github (candidate's Github profile URL if provided. In some occasions the github profile might be displayed by only indicating the username, in that case, please add the full URL to the field. Leave this field empty if not available),  

    
    "skills" contains a list, where each item represents a skill with detailed information. Follow this process to extract skill information: ${skillExtractionCriteria}
	Each skill item includes the following fields:
	1. name – The name of the skill.
	2. type – The skill category, which must be one of: "technical_skill", "technology_domain", "soft_skill", "role", "certification", or "industry".
	3. yoe – The number of years of experience with the skill (rounded to 1 decimal place), or null for soft_skill and certification types.
	4. proficiency_level – The proficiency level with valid values: "beginner", "advanced", "expert", or null for soft_skill and certification types.
 
        
    "years_of_experience" represents total years of experience, calculated as the career span from earliest job start to most recent job end (or current date if still employed), rounded to 1 decimal place.

    CRITICAL REQUIREMENTS:
    - Round all numeric yoe values to exactly 1 decimal place (e.g., 2.5, 1.0, 10.3)
    - For soft_skill and certification types: yoe = null, proficiency_level = null
    - For all other skill types: calculate yoe and proficiency_level based on experience
    - Proficiency boundaries: beginner (0 < yoe <= 2.0), advanced (2.0 < yoe <= 5.0), expert (yoe > 5.0)
    - Round years_of_experience to 1 decimal place
    
    Resume:
    ${resumeText}
  `;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Keep consistent with original
      messages: [
        { role: "system", content: "You are a resume parser that extracts structured resume data. Always return valid JSON without markdown formatting. CRITICAL: For soft_skill and certification types, always set yoe and proficiency_level to null. MANDATORY: All numeric yoe values MUST be formatted with exactly 1 decimal place (e.g., 5.0, 3.0, 1.0, NOT 5, 3, 1). The years_of_experience field MUST also use 1 decimal place (e.g., 18.0, NOT 18)." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1, // Lower temperature for more consistent outputs
      max_tokens: 4000
    });
    
    const structuredData = response.choices[0].message.content;
    
    // Clean up response if it contains markdown code blocks
    let cleanData = structuredData.trim();
    if (cleanData.startsWith("```")) {
      cleanData = cleanData.replace(/```json\n?|```\n?/g, "").trim();
    }
    
    // Validate JSON before returning
    const parsedData = JSON.parse(cleanData);
    
    // Basic validation of expected structure
    if (!parsedData.main || !parsedData.skills || typeof parsedData.years_of_experience === 'undefined') {
      throw new Error('Invalid response structure from OpenAI');
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error parsing resume with OpenAI:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

// Main function to process resume PDF
async function parseResume(pdfUrl) {
  try {
    console.log(`Processing PDF from URL: ${pdfUrl}`);
    
    // Validate URL format
    if (!pdfUrl.match(/^https?:\/\/.+\.pdf$/i)) {
      throw new Error('Invalid PDF URL format');
    }
    
    // Step 1: Download the PDF
    const pdfData = await downloadPdf(pdfUrl);
    
    // Step 2: Extract text from the PDF
    const resumeText = await extractTextFromPdf(pdfData);
    console.log(`Extracted ${resumeText.length} characters of text`);
    
    // Check if we got meaningful text
    if (resumeText.length < 100) {
      throw new Error('PDF appears to be empty or contains insufficient text');
    }
    
    // Step 3: Parse the resume text with OpenAI
    const parsedData = await parseResumeText(resumeText);
    
    // Step 4: Ensure decimal formatting consistency (1 decimal place)
    if (parsedData.skills && Array.isArray(parsedData.skills)) {
      parsedData.skills.forEach(skill => {
        // Force yoe to 1 decimal place for non-null values
        if (skill.yoe !== null && (typeof skill.yoe === 'number' || typeof skill.yoe === 'string')) {
          const numValue = parseFloat(skill.yoe);
          if (!isNaN(numValue)) {
            skill.yoe = parseFloat(numValue.toFixed(1));
          }
        }
      });
    }
    
    // Force years_of_experience to 1 decimal place
    if (parsedData.years_of_experience !== null && parsedData.years_of_experience !== undefined) {
      const numValue = parseFloat(parsedData.years_of_experience);
      if (!isNaN(numValue)) {
        parsedData.years_of_experience = parseFloat(numValue.toFixed(1));
      }
    }
    
    console.log('Post-processing applied. Sample yoe values:', 
      parsedData.skills?.slice(0, 3)?.map(s => ({ name: s.name, yoe: s.yoe })));
    console.log('Years of experience:', parsedData.years_of_experience);
    
    // Step 5: Add raw PDF text to the response for enhanced match analysis
    parsedData.raw_pdf_profile_text = resumeText;
    
    return parsedData;
  } catch (error) {
    console.error('Error in parseResume:', error);
    return { error: error.message };
  }
}

// Cloud Function HTTP handler
functions.http('parseResumeHandler', async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    // Handle CORS preflight requests
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  // Validate input
  const requestData = req.body;
  if (!requestData || !requestData.pdf_url) {
    res.status(400).json({ error: 'Invalid input. Please provide "pdf_url" field.' });
    return;
  }
  
  try {
    console.log("Function parse-resume-skill started");
    console.log("*** UPDATED VERSION WITH SHARED DEFINITIONS IS RUNNING ***");
    
    // Process the resume
    const result = await parseResume(requestData.pdf_url);
    
    // Return error if encountered
    if (result.error) {
      res.status(500).json({ error: result.error });
      return;
    }
    
    // Return successful response
    res.status(200).json(result);
  } catch (error) {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
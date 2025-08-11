# Generate Job Description API Integration Documentation

## Overview
This API endpoint generates professional, formatted job descriptions using AI based on structured job data including attributes, requirements, and initial notes. It transforms structured hiring information into polished, recruiter-ready job postings with consistent formatting and professional language.

## API Details

### Endpoint Information
- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/generate-job-description`
- **Platform**: Supabase Edge Function
- **Method**: `POST`
- **Content-Type**: `application/json`
- **CORS**: Enabled for all origins

### Authentication
- **Method**: Supabase Authentication
- **Header**: `Authorization: Bearer {supabase_anon_key}`
- Requires OpenAI API key in environment variables

## Request Format

### Input Schema
```json
{
  "initial_notes": "string (optional - additional context about tasks/responsibilities)",
  "company_name": "string (required)",
  "industry": "string (required)",
  "attributes": {
    "title": "string",
    "rate": {
      "value": "number",
      "freq": "string"
    },
    "commitment": "string",
    "duration": "string",
    "location": {
      "category": "string",
      "regions": ["string"],
      "countries": ["string"]
    }
  },
  "requirements": [
    {
      "requirement": "string",
      "type": "string",
      "is_mandatory": "boolean",
      "proficiency_level": "string | null",
      "weight": "number (0.00-1.00)"
    }
  ]
}
```

### Input Example
```json
{
  "initial_notes": "We need a senior Python developer who will be responsible for building and maintaining our trading platform APIs. The candidate should be comfortable working with real-time data processing and have experience with financial regulations compliance. They will also mentor junior developers and collaborate closely with our quantitative research team.",
  "company_name": "FinTech Solutions Inc",
  "industry": "Financial Technology",
  "attributes": {
    "title": "Senior Python Developer",
    "rate": {
      "value": 12000,
      "freq": "monthly"
    },
    "commitment": "full_time",
    "duration": "permanent",
    "location": {
      "category": "hybrid",
      "regions": [],
      "countries": ["US", "CA"]
    }
  },
  "requirements": [
    {
      "requirement": "Python",
      "type": "technical_skill",
      "is_mandatory": true,
      "proficiency_level": "expert",
      "weight": 1.0
    },
    {
      "requirement": "Django",
      "type": "technical_skill",
      "is_mandatory": true,
      "proficiency_level": "advanced",
      "weight": 0.75
    },
    {
      "requirement": "Leadership",
      "type": "soft_skill",
      "is_mandatory": true,
      "proficiency_level": null,
      "weight": 0.75
    },
    {
      "requirement": "Redis",
      "type": "technical_skill",
      "is_mandatory": false,
      "proficiency_level": "advanced",
      "weight": 0.50
    }
  ]
}
```

### Input Validation Requirements
- `company_name`: Required, name of the hiring company
- `industry`: Required, company industry
- `attributes`: Required, job attributes object
- `requirements`: Required, array of requirement objects
- `initial_notes`: Optional, additional context for tasks/responsibilities

## Response Format

### Success Response (200)
```json
{
  "job_description": "string (formatted job description with \\n\\n for paragraph breaks)"
}
```

### Success Response Example
```json
{
  "job_description": "About the company:\n\nOur client is a leading entity in the Financial Technology sector, known for its innovative solutions that drive efficiency and security in financial transactions. They specialize in developing cutting-edge technology to enhance the financial services industry.\n\nAbout the role:\n\nWe are looking for a Senior Python Developer who will play a crucial role in building and maintaining our client's trading platform APIs. The successful candidate will be responsible for ensuring the seamless processing of real-time data and ensuring compliance with financial regulations. Additionally, they will mentor junior developers and work closely with the quantitative research team to drive innovation and excellence.\n\nRequirements:\n\nMandatory:\n- Python (expert level)\n- Django (advanced level)\n- PostgreSQL (advanced level)\n- Financial Services (advanced level)\n- Leadership\n- Communication\n\nNice to Have:\n- Redis (advanced level)\n- Docker (beginner level)\n- AWS Solutions Architect\n- Machine Learning (beginner level)\n\nPosition Highlights:\n\n- Full-time commitment\n- Permanent duration\n- Hybrid work model available in the US and CA\n- Competitive monthly rate of 12000"
}
```

### Error Response (400/405/500)
```json
{
  "error": "string (error description)",
  "details": "string (optional detailed error info)"
}
```

### Error Response Examples
```json
{
  "error": "Method not allowed"
}
```

```json
{
  "error": "Invalid input. Please provide 'company_name', 'industry', 'attributes', and 'requirements' fields."
}
```

```json
{
  "error": "Invalid requirements structure. Expected 'requirements' to be an array."
}
```

```json
{
  "error": "Invalid response structure: missing job_description field"
}
```

```json
{
  "error": "Internal server error",
  "details": "Failed to parse AI response: Unexpected token"
}
```

## Job Description Structure

### Generated Format (Based on Code Implementation)
The API generates job descriptions with this exact structure:

1. **About the company:** - General information about the company and industry (does not mention company name directly)
2. **About the role:** - Position title, key responsibilities from initial_notes, and role summary  
3. **Requirements:** - Organized into two sections:
   - **Mandatory:** - Lists all requirements where `is_mandatory: true`
   - **Nice to Have:** - Lists all requirements where `is_mandatory: false`
4. **Position Highlights:** - Job attributes formatted as bullet points

### Content Guidelines (Based on Code Implementation)
- **Third Person Writing**: Uses "Our client is..." and "We are looking for..."
- **Company Anonymity**: Does not mention the actual company name in the description
- **Structured Data Priority**: Uses attributes and requirements as PRIMARY source
- **Initial Notes Context**: Uses initial_notes only for additional context about tasks/responsibilities
- **Professional Tone**: Formal, engaging, and comprehensive

### Formatting Details (As Implemented)
- **Paragraph Breaks**: Uses `\\n\\n` (escaped newlines) for proper formatting in JSON
- **Requirements Format**: 
  - Mandatory: `- Requirement (proficiency level)` for technical skills
  - Mandatory: `- Requirement` for soft skills (no proficiency level shown)
  - Same format for Nice to Have section
- **Proficiency Levels**: Shown in parentheses only when `proficiency_level` is not null

### Internal Processing Details (Based on Code)
The API uses these helper functions for formatting:

**Requirements Processing:**
- Groups requirements by `is_mandatory` field
- Formats as: `- Requirement (proficiency_level) [type]` during processing
- Removes type brackets from final output
- Shows proficiency only when not null

**Attributes Processing:**
- Maps all provided attributes to readable format
- Handles null/missing values gracefully
- Formats location with regions/countries when available
- Includes rate information when provided

**AI Model Configuration:**
- **Model**: GPT-4o for high-quality generation
- **Temperature**: 0.1 for consistent output
- **Max Tokens**: 1500 for comprehensive descriptions
- **Response Validation**: Ensures `job_description` field exists in response

## Integration Guide for Vita App

### Supabase Edge Function Call
```javascript
// Using Supabase client with authentication
async function generateJobDescription(jobData) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-job-description', {
      body: {
        initial_notes: jobData.initialNotes || '',
        company_name: jobData.companyName,
        industry: jobData.industry,
        attributes: jobData.attributes,
        requirements: jobData.requirements
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating job description:', error);
    throw error;
  }
}
```

### Direct HTTP Call
```javascript
// Direct fetch with Supabase authentication
async function generateJobDescription(jobData, supabaseUrl, anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-job-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        initial_notes: jobData.initialNotes || '',
        company_name: jobData.companyName,
        industry: jobData.industry,
        attributes: jobData.attributes,
        requirements: jobData.requirements
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate job description');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating job description:', error);
    throw error;
  }
}
```

### Frontend Usage Example
```javascript
// In your React component for job description generation
async function handleJobDescriptionGeneration(jobData) {
  setLoading(true);
  setGeneratedDescription('');
  
  try {
    // Generate formatted job description
    const result = await generateJobDescription({
      initialNotes: jobData.notes,
      companyName: jobData.company,
      industry: jobData.industry,
      attributes: jobData.attributes,
      requirements: jobData.requirements
    });
    
    // Display generated description
    setGeneratedDescription(result.job_description);
    
    // Enable copy functionality
    setCopyableContent(result.job_description);
    
  } catch (error) {
    setError(`Failed to generate job description: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Complete Workflow Integration
```javascript
// Full job creation workflow: Extract → Generate → Save
async function createJobWithDescription(jobInput) {
  try {
    // Step 1: Extract job details from raw input
    const extractedDetails = await extractJobDetails({
      content: jobInput.rawDescription,
      companyName: jobInput.company,
      industry: jobInput.industry,
      culture: jobInput.culture
    });
    
    // Step 2: Generate formatted job description
    const generatedJD = await generateJobDescription({
      initialNotes: jobInput.notes,
      companyName: jobInput.company,
      industry: jobInput.industry,
      attributes: extractedDetails.attributes,
      requirements: extractedDetails.requirements
    });
    
    // Step 3: Save job with generated description
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: extractedDetails.attributes.title,
        company_name: jobInput.company,
        industry: jobInput.industry,
        job_description: generatedJD.job_description,
        attributes: extractedDetails.attributes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (jobError) throw jobError;
    
    // Step 4: Save requirements
    const { error: reqError } = await supabase
      .from('job_requirements')
      .insert(
        extractedDetails.requirements.map(req => ({
          job_id: job.id,
          requirement: req.requirement,
          type: req.type,
          is_mandatory: req.is_mandatory,
          proficiency_level: req.proficiency_level,
          weight: req.weight
        }))
      );
      
    if (reqError) throw reqError;
    
    return { job, jobDescription: generatedJD.job_description };
  } catch (error) {
    throw new Error(`Job creation with description failed: ${error.message}`);
  }
}
```

### Copy Functionality Integration
```javascript
// Enable easy copying of generated job descriptions (handle escaped newlines)
function JobDescriptionDisplay({ generatedDescription }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      // The API returns \\n\\n (escaped), so we need to convert to actual line breaks
      const formattedText = generatedDescription.replace(/\\n\\n/g, '\n\n');
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  // For display, also convert escaped newlines to JSX elements
  const formatForDisplay = (text) => {
    return text.split('\\n\\n').map((paragraph, index) => (
      <p key={index} className="mb-4">{paragraph}</p>
    ));
  };
  
  return (
    <div className="job-description-container">
      <div className="job-description-header flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Generated Job Description</h3>
        <button 
          onClick={handleCopy} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {copied ? 'Copied!' : 'Copy Description'}
        </button>
      </div>
      <div className="job-description-content bg-gray-50 p-4 rounded">
        {formatForDisplay(generatedDescription)}
      </div>
    </div>
  );
}
```

## Error Handling

### Common Error Scenarios
1. **Method Not Allowed**: Non-POST requests
2. **Invalid Input**: Missing required fields (company_name, industry, attributes, requirements)
3. **Invalid Requirements Structure**: Requirements not provided as array
4. **OpenAI API Errors**: Rate limiting, authentication, model errors
5. **JSON Parsing Errors**: Malformed AI response
6. **Supabase Auth Errors**: Invalid authentication token
7. **Processing Errors**: Internal AI processing failures
8. **Response Validation Errors**: Missing job_description field in response

### Recommended Error Handling
```javascript
function getJobDescriptionErrorMessage(error) {
  if (error.includes('Method not allowed')) {
    return 'Invalid request method. Please use POST.';
  }
  if (error.includes('Please provide')) {
    return 'Missing required information. Please provide all job details including company, industry, attributes, and requirements.';
  }
  if (error.includes('Invalid requirements structure')) {
    return 'Invalid requirements format. Please ensure requirements are provided as an array.';
  }
  if (error.includes('missing job_description field')) {
    return 'AI response validation error. Please try again.';
  }
  if (error.includes('OpenAI API error: 429')) {
    return 'AI service is busy. Please try again in a moment.';
  }
  if (error.includes('OpenAI API')) {
    return 'AI generation service is temporarily unavailable. Please try again.';
  }
  if (error.includes('parse AI response')) {
    return 'AI response format error. Please try again.';
  }
  if (error.includes('Authorization')) {
    return 'Authentication failed. Please refresh and try again.';
  }
  return 'Failed to generate job description. Please try again or contact support.';
}
```

## Usage in Vita App Context

### Integration Points
1. **Job Description Generation**: Convert structured job data into professional postings
2. **Copy Functionality**: Enable easy copying of generated descriptions for external use
3. **Client Presentation**: Create polished job descriptions for client review
4. **Multi-format Output**: Generate descriptions suitable for various job boards
5. **Template Consistency**: Ensure consistent formatting across all job postings

### User Experience Flow
1. User completes job creation with attributes and requirements
2. User optionally adds initial notes for additional context
3. App calls generate-job-description API
4. Display loading state during generation (5-15 seconds)
5. Show formatted job description with copy functionality
6. Allow user to edit generated content before finalizing
7. Save final job description for posting and client communications

### Data Processing Features
- **Structured Input Processing**: Uses extracted job details as primary source
- **Context Integration**: Incorporates initial notes for additional responsibilities
- **Professional Formatting**: Ensures consistent, recruiter-ready output
- **Requirement Organization**: Separates mandatory and optional requirements clearly
- **Highlight Generation**: Creates compelling position highlights from attributes
- **Industry Awareness**: Tailors company descriptions to industry context

## Performance Considerations
- AI processing typically takes 5-15 seconds with GPT-4o model
- Optimized for professional job description generation
- Uses temperature 0.1 for consistent, focused output
- Maximum 1500 tokens for comprehensive descriptions
- Implements robust JSON cleaning and validation
- Supabase authentication required for secure access
- Memory efficient with structured prompt engineering
- Handles various job types and industries effectively
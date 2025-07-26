# Job Details Extractor API Integration Documentation

## Overview
This API endpoint extracts and structures job details from job descriptions and hiring requirements using AI. It analyzes job content to identify role attributes, compensation details, location requirements, and comprehensive skill requirements with proficiency levels and importance weights.

## API Details

### Endpoint Information
- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/job-details-extractor`
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
  "content": "string (required - job description or client call notes)",
  "company_name": "string (required)",
  "industry": "string (required)",
  "culture": "string (optional - company culture information)"
}
```

### Input Example
```json
{
  "content": "We need a Senior Full Stack Developer with 4+ years experience in React and Node.js. Must have AWS experience and strong problem-solving skills. The position offers $110,000-130,000 annually with remote work flexibility within Europe. Looking for someone who can mentor junior developers and work in agile teams.",
  "company_name": "InnovaTech Solutions",
  "industry": "Technology",
  "culture": "Collaborative environment that values innovation, continuous learning, and work-life balance. We encourage mentorship and team collaboration in a fast-paced agile setting."
}
```

### Input Validation Requirements
- `content`: Required, contains job description or hiring notes
- `company_name`: Required, name of the hiring company
- `industry`: Required, company industry
- `culture`: Optional, company culture information (enhances soft skills extraction)

## Response Format

### Success Response (200)
```json
{
  "attributes": {
    "title": "string",
    "rate": {
      "value": "number | string (may be empty)",
      "freq": "hourly | weekly | monthly | string (may be empty)"
    },
    "commitment": "full_time | part_time | hourly | string (may be empty)",
    "duration": "2_4_weeks | 4_8_weeks | 3_6_months | 6_12_months | 12_plus_months | permanent",
    "location": {
      "category": "remote_global | remote_region_specific | remote_country_specific | hybrid | on_site",
      "regions": ["string (region codes)"],
      "countries": ["string (ISO country codes)"]
    }
  },
  "requirements": {
    "requirements": [
      {
        "requirement": "string",
        "type": "technical_skill | technology_domain | soft_skill | role | certification | industry",
        "is_mandatory": "boolean",
        "proficiency_level": "beginner | advanced | expert | null",
        "weight": "number (0.00-1.00)"
      }
    ]
  }
}
```

### Success Response Example
```json
{
  "attributes": {
    "title": "Senior Full Stack Developer",
    "rate": {
      "value": 120000,
      "freq": "monthly"
    },
    "commitment": "full_time",
    "duration": "permanent",
    "location": {
      "category": "remote_region_specific",
      "regions": ["europe"],
      "countries": []
    }
  },
  "requirements": {
    "requirements": [
      {
        "requirement": "React",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 1.00
      },
      {
        "requirement": "Node.js",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 1.00
      },
      {
        "requirement": "AWS",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 0.75
      },
      {
        "requirement": "Problem Solving",
        "type": "soft_skill",
        "is_mandatory": true,
        "proficiency_level": null,
        "weight": 0.50
      },
      {
        "requirement": "Mentoring",
        "type": "soft_skill",
        "is_mandatory": true,
        "proficiency_level": null,
        "weight": 0.75
      },
      {
        "requirement": "Teamwork",
        "type": "soft_skill",
        "is_mandatory": true,
        "proficiency_level": null,
        "weight": 0.75
      }
    ]
  }
}
```

### Response Example with Empty Values
```json
{
  "attributes": {
    "title": "eCommerce Developer",
    "rate": {
      "value": "",
      "freq": ""
    },
    "commitment": "",
    "duration": "4_8_weeks",
    "location": {
      "category": "remote_global",
      "regions": [],
      "countries": []
    }
  },
  "requirements": {
    "requirements": [
      {
        "requirement": "React",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 1
      },
      {
        "requirement": "Teamwork",
        "type": "soft_skill",
        "is_mandatory": true,
        "proficiency_level": null,
        "weight": 0.75
      }
    ]
  }
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
  "error": "Invalid input. Please provide 'content', 'company_name', and 'industry' fields."
}
```

```json
{
  "error": "Internal server error",
  "details": "OpenAI API error: 500 Internal Server Error"
}
```

## Data Structure Details

### Job Attributes Object
- **title**: Job position title (AI-generated if not provided)
- **rate**: Compensation information with value and payment frequency
- **commitment**: Employment type classification
- **duration**: Project/contract duration or permanent position
- **location**: Work arrangement with geographic specifications

### Rate Object
- **value**: Numerical salary/hourly rate amount (may be empty string if not determinable)
- **freq**: Payment frequency (hourly, weekly, monthly) (may be empty string if not determinable)
- May contain empty values when compensation information cannot be extracted from input

### Location Object
- **category**: Work arrangement type
- **regions**: Allowed geographic regions (array)
- **countries**: Allowed countries as ISO codes (array)

### Location Categories
- **remote_global**: 100% remote, worldwide
- **remote_region_specific**: Remote within specific regions
- **remote_country_specific**: Remote within specific countries
- **hybrid**: Mix of remote and office work
- **on_site**: Office-based work only

### Available Region Codes
- north_america, south_america, central_america
- west_europe, east_europe
- africa, middle_east, oceania
- americas, asia, europe

### Requirements Object Structure
The requirements are returned as a nested object:
```json
{
  "requirements": {
    "requirements": [
      // Array of requirement objects
    ]
  }
}
```

Each requirement object contains:
- **requirement**: Skill or qualification name (Title Case)
- **type**: Skill category classification
- **is_mandatory**: Required vs. preferred (boolean)
- **proficiency_level**: Expected skill level (may be null for soft skills)
- **weight**: Importance score (0.00-1.00)

### Skill Type Classifications
- **technical_skill**: Programming languages, frameworks, tools (React, AWS, JavaScript)
- **technology_domain**: Broad technical areas (Machine Learning, Data Engineering, DevOps)
- **soft_skill**: Interpersonal skills (Communication, Leadership, Problem Solving)
- **role**: Job titles/functions (Software Architect, Team Lead)
- **certification**: Official credentials (AWS Solutions Architect, PMP)
- **industry**: Sector experience (Banking, Healthcare, Finance)

### Proficiency Level Guidelines
- **beginner**: 0-2 years experience (0 < yoe ≤ 2.0)
- **advanced**: 2-5 years experience (2.0 < yoe ≤ 5.0)
- **expert**: 5+ years experience (yoe > 5.0)
- **Note**: Soft skills and certifications use contextual proficiency assessment

### Weight Scale System
- **1.00**: Critical/Must-have requirement
- **0.75**: High importance
- **0.50**: Medium importance (default)
- **0.25**: Low importance
- **0.10**: Optional/Nice-to-have

## Integration Guide for Vita App

### Supabase Edge Function Call
```javascript
// Using Supabase client with authentication
async function extractJobDetails(jobData) {
  try {
    const { data, error } = await supabase.functions.invoke('job-details-extractor', {
      body: {
        content: jobData.content,
        company_name: jobData.companyName,
        industry: jobData.industry,
        culture: jobData.culture || ''
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error extracting job details:', error);
    throw error;
  }
}
```

### Direct HTTP Call
```javascript
// Direct fetch with Supabase authentication
async function extractJobDetails(jobData, supabaseUrl, anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/job-details-extractor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        content: jobData.content,
        company_name: jobData.companyName,
        industry: jobData.industry,
        culture: jobData.culture || ''
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to extract job details');
    }
    
    return data;
  } catch (error) {
    console.error('Error extracting job details:', error);
    throw error;
  }
}
```

### Frontend Usage Example
```javascript
// In your React component for job creation workflow
async function handleJobDetailsExtraction(jobInput) {
  setLoading(true);
  setExtractedData(null);
  
  try {
    // Extract job details using AI
    const extractedDetails = await extractJobDetails({
      content: jobInput.description,
      companyName: jobInput.company,
      industry: jobInput.industry,
      culture: jobInput.companyCulture
    });
    
    // Update form with extracted information
    setJobTitle(extractedDetails.attributes.title);
    setSalaryInfo(extractedDetails.attributes.rate);
    setLocationRequirements(extractedDetails.attributes.location);
    setSkillRequirements(extractedDetails.requirements.requirements || []);
    
    // Store extracted data for review
    setExtractedData(extractedDetails);
    
  } catch (error) {
    setError(`Failed to extract job details: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Integration with Job Creation Flow
```javascript
// Complete job creation workflow
async function createJobWithExtraction(jobInput) {
  try {
    // Step 1: Extract job details
    const extractedDetails = await extractJobDetails(jobInput);
    
    // Step 2: Save job with extracted attributes
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: extractedDetails.attributes.title,
        company_id: jobInput.companyId,
        rate_value: extractedDetails.attributes.rate?.value,
        rate_frequency: extractedDetails.attributes.rate?.freq,
        commitment: extractedDetails.attributes.commitment,
        duration: extractedDetails.attributes.duration,
        location_category: extractedDetails.attributes.location?.category,
        location_regions: extractedDetails.attributes.location?.regions,
        location_countries: extractedDetails.attributes.location?.countries,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (jobError) throw jobError;
    
    // Step 3: Save extracted requirements
    const requirements = extractedDetails.requirements.requirements || []
    const { error: reqError } = await supabase
      .from('job_requirements')
      .insert(
        requirements.map(req => ({
          job_id: job.id,
          requirement: req.requirement,
          type: req.type,
          is_mandatory: req.is_mandatory,
          proficiency_level: req.proficiency_level,
          weight: req.weight
        }))
      );
      
    if (reqError) throw reqError;
    
    return job;
  } catch (error) {
    throw new Error(`Job creation failed: ${error.message}`);
  }
}
```

### Culture-Enhanced Extraction
```javascript
// Leverage company culture for better soft skills extraction
async function extractJobDetailsWithCulture(jobDescription, companyInfo) {
  const culturePrompts = {
    startup: "Fast-paced, innovative environment with emphasis on adaptability and initiative",
    enterprise: "Structured environment focusing on collaboration, process adherence, and stakeholder management",
    consulting: "Client-focused culture emphasizing communication, problem-solving, and relationship building"
  };
  
  return await extractJobDetails({
    content: jobDescription,
    companyName: companyInfo.name,
    industry: companyInfo.industry,
    culture: companyInfo.culture || culturePrompts[companyInfo.type] || ''
  });
}
```

## Error Handling

### Common Error Scenarios
1. **Method Not Allowed**: Non-POST requests
2. **Invalid Input**: Missing required fields (content, company_name, industry)
3. **OpenAI API Errors**: Rate limiting, authentication, model errors
4. **JSON Parsing Errors**: Malformed AI response
5. **Supabase Auth Errors**: Invalid authentication token
6. **Processing Errors**: Internal AI processing failures

### Recommended Error Handling
```javascript
function getJobExtractionErrorMessage(error) {
  if (error.includes('Method not allowed')) {
    return 'Invalid request method. Please use POST.';
  }
  if (error.includes('Please provide')) {
    return 'Missing required information. Please provide job content, company name, and industry.';
  }
  if (error.includes('OpenAI API error: 429')) {
    return 'AI service is busy. Please try again in a moment.';
  }
  if (error.includes('OpenAI API')) {
    return 'AI extraction service is temporarily unavailable. Please try again.';
  }
  if (error.includes('parse AI response')) {
    return 'AI response format error. Please try again.';
  }
  if (error.includes('Authorization')) {
    return 'Authentication failed. Please refresh and try again.';
  }
  return 'Failed to extract job details. Please try again or contact support.';
}
```

## Usage in Vita App Context

### Integration Points
1. **Job Creation Workflow**: Extract structured data from raw job descriptions
2. **Client Notes Processing**: Convert unstructured hiring requirements into actionable data
3. **Requirement Analysis**: Identify and categorize all job requirements automatically
4. **Compensation Intelligence**: Parse salary/rate information with frequency detection
5. **Location Processing**: Understand remote work policies and geographic constraints
6. **Culture Integration**: Enhance soft skills detection using company culture context

### User Experience Flow
1. User enters job description or client call notes
2. User provides company information and optional culture details
3. App calls job-details-extractor API for AI analysis
4. Display loading state during processing (10-30 seconds)
5. Show extracted job attributes and requirements for review and editing
6. Allow user to modify AI-extracted information before saving
7. Save structured job data for candidate matching and analysis

### Data Processing Features
- **Intelligent Content Analysis**: Understands various job description formats
- **Culture-Aware Extraction**: Uses company culture to identify relevant soft skills
- **Compensation Parsing**: Extracts salary ranges with frequency detection
- **Location Intelligence**: Handles complex remote work arrangements
- **Requirement Prioritization**: Assigns importance weights based on content emphasis
- **Skill Classification**: Categorizes requirements into 6 distinct types
- **Proficiency Assessment**: Determines expected skill levels from context

## Performance Considerations
- AI processing typically takes 10-30 seconds for complex job descriptions
- Uses GPT-4 model for high-quality, nuanced analysis
- Requires OpenAI API key configuration in Supabase environment
- Temperature set to 0.2 for consistent, focused extraction results
- Implements robust JSON cleaning and validation for reliable parsing
- Supabase authentication required for secure access
- Memory efficient with optimized prompt engineering
- Handles various input formats and job description styles
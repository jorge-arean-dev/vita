# Job Details Extractor API Integration Documentation

## Overview
This API endpoint extracts and structures job details from job descriptions and hiring requirements using AI. It analyzes job content to identify role attributes, compensation details, location requirements, and comprehensive skill requirements with proficiency levels and importance weights. This enhanced version uses GPT-4o for improved accuracy and cultural awareness.

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
  "content": "python developer.",
  "company_name": "Lower",
  "industry": "Financial Services",
  "culture": "fast paced environment, resilience, incluison"
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
      "value": "number | null",
      "freq": "string (hourly | weekly | monthly)"
    },
    "commitment": "string (full_time | part_time | hourly)",
    "duration": "string (2_4_weeks | 4_8_weeks | 3_6_months | 6_12_months | 12_plus_months | permanent)",
    "location": {
      "category": "string (remote_global | remote_region_specific | remote_country_specific | hybrid | on_site)",
      "regions": ["string (region codes)"],
      "countries": ["string (ISO country codes)"]
    }
  },
  "requirements": [
    {
      "requirement": "string",
      "type": "string (technical_skill | technology_domain | soft_skill | role | certification | industry)",
      "is_mandatory": "boolean",
      "proficiency_level": "string (beginner | advanced | expert) | null",
      "weight": "number (0.00-1.00)"
    }
  ]
}
```

### Success Response Example
```json
{
  "attributes": {
    "title": "Python Developer",
    "rate": {
      "value": null,
      "freq": ""
    },
    "commitment": "",
    "duration": "",
    "location": {
      "category": "remote_global",
      "regions": [],
      "countries": []
    }
  },
  "requirements": [
    {
      "requirement": "Python",
      "type": "technical_skill",
      "is_mandatory": true,
      "proficiency_level": "advanced",
      "weight": 0.75
    },
    {
      "requirement": "Financial Services",
      "type": "industry",
      "is_mandatory": true,
      "proficiency_level": "advanced",
      "weight": 0.5
    },
    {
      "requirement": "Adaptability",
      "type": "soft_skill",
      "is_mandatory": true,
      "proficiency_level": null,
      "weight": 0.75
    },
    {
      "requirement": "Time Management",
      "type": "soft_skill",
      "is_mandatory": true,
      "proficiency_level": null,
      "weight": 0.75
    },
    {
      "requirement": "Resilience",
      "type": "soft_skill",
      "is_mandatory": true,
      "proficiency_level": null,
      "weight": 1.0
    },
    {
      "requirement": "Inclusion",
      "type": "soft_skill",
      "is_mandatory": true,
      "proficiency_level": null,
      "weight": 0.5
    }
  ]
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
- **title**: Job position title (AI-generated from content)
- **rate**: Compensation information with value and payment frequency
- **commitment**: Employment type classification
- **duration**: Project/contract duration or permanent position
- **location**: Work arrangement with geographic specifications

### Rate Object
- **value**: Numerical salary/hourly rate amount (null if not specified)
- **freq**: Payment frequency (empty string if not specified)

### Location Object
- **category**: Work arrangement type (defaults to "remote_global" if not specified)
- **regions**: Allowed geographic regions (empty array for global/country-specific)
- **countries**: Allowed countries as ISO codes (empty array for global/region-specific)

### Location Categories
- **remote_global**: 100% remote, worldwide access
- **remote_region_specific**: Remote within specific regions
- **remote_country_specific**: Remote within specific countries
- **hybrid**: Mix of remote and office work
- **on_site**: Office-based work only

### Available Region Codes
- north_america, south_america, central_america
- west_europe, east_europe
- africa, middle_east, oceania
- americas, asia, europe

### Requirements Array Structure
Each requirement object contains:
- **requirement**: Skill or qualification name (Title Case)
- **type**: Skill category classification
- **is_mandatory**: Required vs. preferred (boolean)
- **proficiency_level**: Expected skill level (null for soft_skill and certification types)
- **weight**: Importance score (0.00-1.00)

### Skill Type Classifications
- **technical_skill**: Programming languages, frameworks, tools (Python, React, AWS)
- **technology_domain**: Broad technical areas (Machine Learning, Data Engineering)
- **soft_skill**: Interpersonal skills (Adaptability, Time Management, Resilience)
- **role**: Job titles/functions (Software Architect, Team Lead)
- **certification**: Official credentials (AWS Solutions Architect, PMP)
- **industry**: Sector experience (Financial Services, Healthcare, Banking)

### Proficiency Level Guidelines
- **beginner**: 0-2 years experience (0 < yoe ≤ 2.0)
- **advanced**: 2-5 years experience (2.0 < yoe ≤ 5.0)
- **expert**: 5+ years experience (yoe > 5.0)
- **null**: Always used for soft_skill and certification types

### Weight Scale System
- **1.00**: Critical/Must-have requirement
- **0.75**: High importance
- **0.50**: Medium importance (default)
- **0.25**: Low importance
- **0.10**: Optional/Nice-to-have

## Cultural Intelligence Features

### Culture-Driven Soft Skills Detection
The API analyzes company culture descriptions to extract relevant soft skills:

**Culture Keywords → Soft Skills Mapping:**
- "fast paced" → Adaptability, Time Management
- "resilience" → Resilience
- "team work" → Teamwork, Collaboration
- "low ego" → Collaboration, Teamwork
- "innovation" → Creative Thinking, Innovation
- "inclusion" → Inclusion (custom soft skill)
- "continuous learning" → Continuous Learning

### Enhanced Analysis
- **Contextual Understanding**: Interprets culture descriptions beyond exact keyword matching
- **Priority Weighting**: Assigns higher weights to culture-emphasized skills
- **Comprehensive Coverage**: Extracts both explicit and implicit cultural requirements

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
    setSkillRequirements(extractedDetails.requirements);
    
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
// Complete job creation workflow with culture analysis
async function createJobWithCulturalAnalysis(jobInput) {
  try {
    // Step 1: Extract job details with cultural intelligence
    const extractedDetails = await extractJobDetails({
      content: jobInput.description,
      companyName: jobInput.company,
      industry: jobInput.industry,
      culture: jobInput.culture
    });
    
    // Step 2: Save job with extracted attributes
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: extractedDetails.attributes.title,
        company_id: jobInput.companyId,
        rate_value: extractedDetails.attributes.rate?.value,
        rate_frequency: extractedDetails.attributes.rate?.freq || null,
        commitment: extractedDetails.attributes.commitment || null,
        duration: extractedDetails.attributes.duration || null,
        location_category: extractedDetails.attributes.location?.category,
        location_regions: extractedDetails.attributes.location?.regions,
        location_countries: extractedDetails.attributes.location?.countries,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (jobError) throw jobError;
    
    // Step 3: Save extracted requirements
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
    
    return job;
  } catch (error) {
    throw new Error(`Job creation failed: ${error.message}`);
  }
}
```

### Culture-Enhanced Extraction Patterns
```javascript
// Leverage different culture types for enhanced extraction
const culturePatterns = {
  startup: "Fast-paced, innovative, adaptable, resilient, low ego, collaborative environment",
  enterprise: "Structured, process-oriented, stakeholder management, cross-functional collaboration",
  consulting: "Client-focused, communication, problem-solving, relationship building, analytical thinking",
  financial: "Risk management, attention to detail, compliance, analytical thinking, time management"
};

async function extractWithIndustryContext(jobDescription, companyInfo) {
  const enhancedCulture = companyInfo.culture || culturePatterns[companyInfo.sector] || '';
  
  return await extractJobDetails({
    content: jobDescription,
    companyName: companyInfo.name,
    industry: companyInfo.industry,
    culture: enhancedCulture
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
1. **Job Creation Workflow**: Extract structured data from minimal job descriptions
2. **Client Notes Processing**: Convert brief hiring requirements into comprehensive data
3. **Cultural Requirement Analysis**: Identify culture-specific soft skill requirements
4. **Industry Intelligence**: Apply industry context to requirement extraction
5. **Requirement Prioritization**: Assign importance weights based on content emphasis
6. **Default Value Handling**: Provide sensible defaults for missing information

### User Experience Flow
1. User enters basic job description and company information
2. User optionally provides company culture details
3. App calls job-details-extractor API for AI analysis
4. Display loading state during processing (5-15 seconds for GPT-4o)
5. Show extracted job attributes and requirements for review and editing
6. Allow user to modify AI-extracted information before saving
7. Save structured job data for candidate matching and analysis

### Advanced Features
- **Minimal Input Processing**: Works effectively with brief job descriptions
- **Cultural Intelligence**: Extracts soft skills from culture descriptions
- **Industry Awareness**: Applies industry context to requirement analysis
- **Smart Defaults**: Provides logical defaults for missing attributes
- **Flexible Output**: Handles varying levels of input detail gracefully

## Performance Considerations
- AI processing typically takes 5-15 seconds with GPT-4o model
- Enhanced accuracy and cultural understanding compared to GPT-4
- Requires OpenAI API key configuration in Supabase environment
- Temperature set to 0.2 for consistent, focused extraction results
- Maximum 1500 tokens for optimal response speed and cost efficiency
- Implements robust JSON cleaning and validation for reliable parsing
- Supabase authentication required for secure access
- Memory efficient with optimized prompt engineering
- Handles minimal input gracefully while providing comprehensive output
# Parse LinkedIn Skill API Integration Documentation

## Overview
This API endpoint processes LinkedIn profile data using AI to extract structured candidate information including skills, experience analysis, and proficiency levels. It transforms raw LinkedIn profile data into standardized candidate profiles with intelligent skill classification and experience calculation.

## API Details

### Endpoint Information
- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/parse-linkedin-skill`
- **Platform**: Supabase Edge Function
- **Method**: `POST`
- **Content-Type**: `application/json`
- **CORS**: Enabled for all origins

### Authentication
- Supabase Auth required
- Requires OpenAI API key in environment variables

## Request Format

### Input Schema
Expects a LinkedIn profile object (as returned from scraper or adapter APIs):

```json
{
  "firstName": "string",
  "lastName": "string",
  "addressCountryOnly": "string (optional)",
  "email": "string | null",
  "mobileNumber": "string | null",
  "linkedinUrl": "string (optional)",
  "publicIdentifier": "string (optional)",
  "about": "string (optional)",
  "experiences": [
    {
      "title": "string",
      "subtitle": "string",
      "caption": "string (duration)",
      "description": "string"
    }
  ],
  "courses": ["array (optional)"],
  "licenseAndCertificates": ["array (optional)"],
  "recommendations": ["array (optional)"]
}
```

### Input Example
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "addressCountryOnly": "United States",
  "email": "john.smith@email.com",
  "mobileNumber": "1234567890",
  "linkedinUrl": "https://linkedin.com/in/johnsmith",
  "about": "Experienced software engineer with strong leadership skills...",
  "experiences": [
    {
      "title": "Senior Software Engineer",
      "subtitle": "Tech Corp",
      "caption": "Jan 2020 - Present · 4 yrs",
      "description": "Led React development team and implemented microservices architecture using AWS..."
    }
  ],
  "courses": [],
  "licenseAndCertificates": [
    {
      "title": "AWS Solutions Architect",
      "subtitle": "Amazon Web Services"
    }
  ],
  "recommendations": []
}
```

### Input Validation Requirements
- Must contain at least `firstName` OR `lastName`
- Must contain non-empty `experiences` array
- Profile data must be a valid object

## Response Format

### Success Response (200)
```json
{
  "main": {
    "first_name": "string",
    "last_name": "string",
    "country": "string (ISO 3166-1 alpha-2 code)",
    "email": "string",
    "phone": "string (no spaces)",
    "linkedin": "string",
    "github": "string"
  },
  "skills": [
    {
      "name": "string (Title Case)",
      "type": "technical_skill | technology_domain | soft_skill | role | certification | industry",
      "yoe": "number (1 decimal place) | null",
      "proficiency_level": "beginner | advanced | expert | null"
    }
  ],
  "years_of_experience": "number (1 decimal place, total career span)"
}
```

### Success Response Example
```json
{
  "main": {
    "first_name": "John",
    "last_name": "Smith",
    "country": "US",
    "email": "john.smith@email.com",
    "phone": "1234567890",
    "linkedin": "https://linkedin.com/in/johnsmith",
    "github": ""
  },
  "skills": [
    {
      "name": "React",
      "type": "technical_skill",
      "yoe": 4.0,
      "proficiency_level": "advanced"
    },
    {
      "name": "Leadership",
      "type": "soft_skill",
      "yoe": null,
      "proficiency_level": null
    },
    {
      "name": "AWS Solutions Architect",
      "type": "certification",
      "yoe": null,
      "proficiency_level": null
    },
    {
      "name": "Software Engineering",
      "type": "technology_domain",
      "yoe": 8.5,
      "proficiency_level": "expert"
    }
  ],
  "years_of_experience": 8.5
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
  "error": "Invalid input. Expected LinkedIn profile object."
}
```

```json
{
  "error": "Profile must contain at least firstName or lastName."
}
```

```json
{
  "error": "Profile must contain non-empty experiences array."
}
```

## AI Processing Pipeline

### 8-Step Extraction Process
1. **Input Validation**: Verify required fields and data structure
2. **Main Profile Extraction**: Map personal information and contact details
3. **Experience Parsing**: Extract skills from job descriptions and calculate durations
4. **Soft Skills Detection**: Scan about/recommendations for interpersonal skills
5. **Certification Extraction**: Process courses and certifications
6. **Skill Deduplication**: Merge and deduplicate all extracted skills
7. **Experience/Proficiency Calculation**: Compute years of experience and proficiency levels
8. **Total Experience Calculation**: Calculate overall career span

### Skill Classification System
- **technical_skill**: Programming languages, frameworks, tools (React, AWS, JavaScript)
- **technology_domain**: Broad tech areas (Machine Learning, Data Engineering, DevOps)
- **soft_skill**: Interpersonal skills (Communication, Leadership, Teamwork)
- **role**: Job titles/functions (Software Engineer, Product Manager)
- **certification**: Official credentials (AWS Solutions Architect, PMP)
- **industry**: Sector experience (Banking, Healthcare, Insurance)

### Proficiency Level Calculation
- **beginner**: 0-2 years experience (0 < yoe ≤ 2.0)
- **advanced**: 2-5 years experience (2.0 < yoe ≤ 5.0)
- **expert**: 5+ years experience (yoe > 5.0)
- **null**: For soft_skill and certification types

## Integration Guide for Vita App

### Supabase Edge Function Call
```javascript
// Using Supabase client
async function processLinkedInProfile(profileData) {
  try {
    const { data, error } = await supabase.functions.invoke('process-linkedin-profile', {
      body: profileData
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error processing LinkedIn profile:', error);
    throw error;
  }
}
```

### Direct HTTP Call
```javascript
// Direct fetch to Supabase Edge Function
async function processLinkedInProfile(profileData, supabaseUrl, anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-linkedin-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to process profile');
    }
    
    return data;
  } catch (error) {
    console.error('Error processing LinkedIn profile:', error);
    throw error;
  }
}
```

### Complete Workflow Integration
```javascript
// Full pipeline: Scrape → Adapt → Process → Save
async function analyzeLinkedInCandidate(linkedinUrl) {
  setLoading(true);
  
  try {
    // Step 1: Scrape LinkedIn profile
    const rawProfile = await scrapeLinkedInProfile(linkedinUrl);
    
    // Step 2: Adapt profile structure
    const adaptedProfile = await adaptLinkedInProfile(rawProfile);
    
    // Step 3: Process with AI for skills extraction
    const processedProfile = await processLinkedInProfile(adaptedProfile);
    
    // Step 4: Save structured candidate data
    await saveCandidateProfile(processedProfile, currentJobId);
    
    // Step 5: Display results
    setCandidateAnalysis(processedProfile);
    
  } catch (error) {
    setError(`Failed to analyze LinkedIn candidate: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Supabase Database Integration
```javascript
// Save AI-processed candidate data
async function saveCandidateProfile(processedProfile, jobId) {
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      job_id: jobId,
      first_name: processedProfile.main.first_name,
      last_name: processedProfile.main.last_name,
      email: processedProfile.main.email,
      phone: processedProfile.main.phone,
      linkedin_url: processedProfile.main.linkedin,
      github_url: processedProfile.main.github,
      country: processedProfile.main.country,
      skills: processedProfile.skills,
      years_of_experience: processedProfile.years_of_experience,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    
  if (error) throw error;
  return data;
}
```

## Error Handling

### Common Error Scenarios
1. **Method Not Allowed**: Non-POST requests
2. **Invalid Input**: Malformed profile data or missing object
3. **Missing Required Fields**: No firstName/lastName provided
4. **Missing Experiences**: Empty or missing experiences array
5. **OpenAI API Errors**: API key issues or rate limiting
6. **JSON Parsing Errors**: Malformed AI response
7. **Processing Errors**: Internal AI processing failures

### Recommended Error Handling
```javascript
function getErrorMessage(error) {
  if (error.includes('Method not allowed')) {
    return 'Invalid request method. Please use POST.';
  }
  if (error.includes('firstName or lastName')) {
    return 'Profile must include at least a first name or last name.';
  }
  if (error.includes('experiences array')) {
    return 'Profile must include work experience information.';
  }
  if (error.includes('OpenAI API')) {
    return 'AI processing service is temporarily unavailable. Please try again.';
  }
  if (error.includes('parse AI response')) {
    return 'AI response format error. Please try again.';
  }
  return 'Failed to process LinkedIn profile. Please try again or contact support.';
}
```

## Usage in Vita App Context

### Integration Points
1. **AI-Powered Skills Extraction**: Intelligent parsing of job descriptions for skills
2. **Experience Calculation**: Automatic computation of years of experience per skill
3. **Proficiency Assessment**: AI-driven proficiency level determination
4. **Comprehensive Analysis**: Processing of all profile sections (experience, about, certifications)
5. **Standardized Output**: Consistent data format for database storage and analysis

### User Experience Flow
1. User provides LinkedIn profile data (from scraper/manual input)
2. App calls process-linkedin-profile API for AI analysis
3. Display loading state during AI processing (10-30 seconds)
4. Show detailed skills breakdown with experience levels
5. Allow user to review and edit AI-extracted information
6. Save comprehensive candidate profile with structured skills data

### Data Processing Features
- **Intelligent Skill Detection**: Beyond keyword matching, understands context
- **Duration Parsing**: Extracts precise experience durations from captions
- **Soft Skills Recognition**: Identifies interpersonal skills from descriptions
- **Certification Processing**: Handles courses and certifications separately
- **Country Code Standardization**: Converts country names to ISO codes
- **GitHub Detection**: Finds GitHub profiles in about sections

## Performance Considerations
- AI processing takes 10-30 seconds depending on profile complexity
- Requires OpenAI API key in environment configuration
- Uses GPT-4o-mini model for cost-effective processing
- Implements JSON cleaning and validation for robust parsing
- Memory efficient with structured processing pipeline
- Temperature set to 0.1 for consistent, deterministic results
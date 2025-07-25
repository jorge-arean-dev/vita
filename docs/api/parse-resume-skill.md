# Parse Resume Skill API Integration Documentation

## Overview
This API endpoint parses PDF resumes and extracts structured candidate data using AI. It enables recruiters to analyze candidate profiles by automatically extracting personal information, skills, and experience from PDF resumes.

## API Details

### Endpoint Information
- **URL**: `https://parse-resume-skill-709637652952.europe-west1.run.app`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **CORS**: Enabled for all origins

### Authentication
- No authentication required (public endpoint)

## Request Format

### Input Schema
```json
{
  "pdf_url": "string (required)"
}
```

### Input Example
```json
{
  "pdf_url": "https://example.com/resume.pdf"
}
```

### Input Validation
- `pdf_url` must be a valid HTTPS URL ending with `.pdf`
- PDF file size limit: 50MB
- Request timeout: 30 seconds

## Response Format

### Success Response (200)
```json
{
  "main": {
    "first_name": "string",
    "last_name": "string", 
    "country": "string (ISO country code, e.g., 'US')",
    "email": "string",
    "phone": "string (no spaces)",
    "linkedin": "string (full URL or empty)",
    "github": "string (full URL or empty)"
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
    "github": "https://github.com/johnsmith"
  },
  "skills": [
    {
      "name": "React",
      "type": "technical_skill",
      "yoe": 3.5,
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
    }
  ],
  "years_of_experience": 8.5
}
```

### Error Response (400/500)
```json
{
  "error": "string (error description)"
}
```

### Error Response Examples
```json
{
  "error": "Invalid input. Please provide \"pdf_url\" field."
}
```

```json
{
  "error": "Invalid PDF URL format"
}
```

```json
{
  "error": "Failed to download PDF: timeout"
}
```

## Skill Classification System

### Skill Types
1. **technical_skill**: Programming languages, frameworks, tools (React, AWS, JavaScript)
2. **technology_domain**: Broad tech areas (Machine Learning, Data Engineering, DevOps)
3. **soft_skill**: Interpersonal skills (Communication, Leadership, Teamwork)
4. **role**: Job titles/functions (Software Engineer, Product Manager)
5. **certification**: Official credentials (AWS Solutions Architect, PMP)
6. **industry**: Sector experience (Banking, Healthcare, Insurance)

### Proficiency Levels
- **beginner**: 0-2 years experience
- **advanced**: 2-5 years experience  
- **expert**: 5+ years experience
- **null**: For soft_skill and certification types

### Years of Experience (YOE)
- Calculated based on resume content analysis
- Rounded to 1 decimal place
- Set to `null` for soft_skill and certification types

## Integration Guide for Vita App

### Next.js API Route Example
```javascript
// pages/api/parse-resume.js or app/api/parse-resume/route.js
export async function POST(request) {
  const { pdf_url } = await request.json();
  
  try {
    const response = await fetch('https://parse-resume-skill-709637652952.europe-west1.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdf_url })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to parse resume');
    }
    
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Frontend Usage Example
```javascript
// In your React component
async function handleResumeUpload(pdfUrl) {
  setLoading(true);
  
  try {
    const response = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdf_url: pdfUrl })
    });
    
    const candidateData = await response.json();
    
    if (candidateData.error) {
      throw new Error(candidateData.error);
    }
    
    // Process the structured candidate data
    setCandidateProfile(candidateData);
    
    // Save to Supabase if needed
    await saveCandidateToJob(candidateData, currentJobId);
    
  } catch (error) {
    setError(`Failed to parse resume: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Supabase Integration
```javascript
// Save parsed candidate data to Supabase
async function saveCandidateToJob(candidateData, jobId) {
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      job_id: jobId,
      first_name: candidateData.main.first_name,
      last_name: candidateData.main.last_name,
      email: candidateData.main.email,
      phone: candidateData.main.phone,
      linkedin_url: candidateData.main.linkedin,
      github_url: candidateData.main.github,
      country: candidateData.main.country,
      skills: candidateData.skills,
      years_of_experience: candidateData.years_of_experience,
      created_at: new Date().toISOString()
    });
    
  if (error) throw error;
  return data;
}
```

## Error Handling

### Common Error Scenarios
1. **Invalid PDF URL**: URL format validation fails
2. **Download Timeout**: PDF download exceeds 30 seconds
3. **File Size Limit**: PDF exceeds 50MB
4. **Empty/Corrupted PDF**: Text extraction fails or returns insufficient content
5. **AI Parsing Error**: OpenAI API fails or returns invalid JSON
6. **Network Issues**: Connection failures or timeouts

### Recommended Error Handling
```javascript
function getErrorMessage(error) {
  if (error.includes('Invalid PDF URL')) {
    return 'Please provide a valid PDF URL ending with .pdf';
  }
  if (error.includes('timeout')) {
    return 'The PDF file took too long to process. Please try a smaller file.';
  }
  if (error.includes('insufficient text')) {
    return 'The PDF appears to be empty or contains unreadable text.';
  }
  return 'Failed to parse resume. Please try again or contact support.';
}
```

## Usage in Vita App Context

### Integration Points
1. **Candidate Analysis**: Primary usage for analyzing uploaded candidate resumes
2. **Candidate Database**: Store parsed data for future reference
3. **Job Matching**: Use skills data for candidate-job compatibility analysis
4. **Copy Functionality**: Enable copying of profile summaries and insights

### User Experience Flow
1. User uploads/provides PDF resume URL
2. App calls parse-resume API
3. Display loading state during processing
4. Show structured candidate profile with skills breakdown
5. Allow user to save candidate to current job
6. Provide copy functionality for insights and summaries

### Data Persistence
- Store complete API response in `candidates` table
- Link candidate to current job via `job_id`
- Enable reuse of candidate data across different jobs
- Maintain audit trail of when candidate was added

## Performance Considerations
- API processes files up to 50MB
- Average processing time: 10-30 seconds depending on PDF size
- Implement proper loading states and timeout handling
- Consider implementing file size validation on frontend before API call
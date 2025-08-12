# Generate LinkedIn Queries API Integration Documentation

## Overview
This API endpoint generates optimized Boolean search queries for LinkedIn Recruiter and Sales Navigator based on structured job requirements and attributes. It creates multiple query variations and provides filter recommendations to help recruiters efficiently find qualified candidates on LinkedIn.

## API Details

### Endpoint Information
- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/generate-linkedin-queries`
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
  "attributes": {
    "title": "string",
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
      "proficiency_level": "string | null"
    }
  ]
}
```

### Input Example
```json
{
  "attributes": {
    "title": "Senior Full-Stack Developer",
    "location": {
      "category": "remote_region_specific",
      "regions": ["south_america"],
      "countries": [""]
    }
  },
  "requirements": [
    {
      "requirement": "TypeScript",
      "type": "technical_skill",
      "is_mandatory": true,
      "proficiency_level": "expert"
    },
    {
      "requirement": "React",
      "type": "technical_skill",
      "is_mandatory": true,
      "proficiency_level": "expert"
    },
    {
      "requirement": "Node",
      "type": "technical_skill",
      "is_mandatory": true,
      "proficiency_level": "expert"
    },
    {
      "requirement": "AWS",
      "type": "technical_skill",
      "is_mandatory": false,
      "proficiency_level": "advanced"
    },
    {
      "requirement": "Financial Services",
      "type": "industry",
      "is_mandatory": false,
      "proficiency_level": "advanced"
    }
  ]
}
```

### Input Validation Requirements
- `attributes`: Required, job attributes object with title and location
- `requirements`: Required, array of requirement objects
- Both mandatory and optional requirements supported

## Response Format

### Success Response (200)
```json
{
  "boolean_queries": {
    "complete_query_all": "string (job titles AND all skills)",
    "complete_query_skills_only": "string (all skills only)",
    "complete_query_job_titles_only": "string (job titles only)",
    "mandatory_only_query_all": "string (job titles AND mandatory skills)",
    "mandatory_only_query_skills_only": "string (mandatory skills only)",
    "mandatory_only_query_job_titles_only": "string (job titles only)"
  },
  "recommendations": [
    {
      "type": "string",
      "display_name_type": "string",
      "recommendation": "string"
    }
  ]
}
```

### Success Response Example
```json
{
  "boolean_queries": {
    "complete_query_all": "(\"Senior Full-Stack Developer\" OR \"Senior Fullstack Developer\" OR \"Fullstack Engineer\" OR \"Full Stack Engineer\" OR \"Senior Software Engineer\") AND (TypeScript AND React AND Node AND Postgres AND Mongo AND AWS OR \"Financial Services\")",
    "complete_query_skills_only": "(TypeScript AND React AND Node AND Postgres AND Mongo AND AWS OR \"Financial Services\")",
    "complete_query_job_titles_only": "(\"Senior Full-Stack Developer\" OR \"Senior Fullstack Developer\" OR \"Fullstack Engineer\" OR \"Full Stack Engineer\" OR \"Senior Software Engineer\")",
    "mandatory_only_query_all": "(\"Senior Full-Stack Developer\" OR \"Senior Fullstack Developer\" OR \"Fullstack Engineer\" OR \"Full Stack Engineer\" OR \"Senior Software Engineer\") AND (TypeScript AND React AND Node AND Postgres AND Mongo)",
    "mandatory_only_query_skills_only": "(TypeScript AND React AND Node AND Postgres AND Mongo)",
    "mandatory_only_query_job_titles_only": "(\"Senior Full-Stack Developer\" OR \"Senior Fullstack Developer\" OR \"Fullstack Engineer\" OR \"Full Stack Engineer\" OR \"Senior Software Engineer\")"
  },
  "recommendations": [
    {
      "type": "location",
      "display_name_type": "Location",
      "recommendation": "Use the 'Location' filter to select 'South America' as the region. Since the job is remote, you can select all countries within this region."
    },
    {
      "type": "industry",
      "display_name_type": "Industry",
      "recommendation": "Use the 'Industry' filter to select 'Financial Services'. This is not a mandatory requirement, but it can help to find candidates with relevant industry experience."
    },
    {
      "type": "experience",
      "display_name_type": "Experience",
      "recommendation": "Use the 'Experience' filter to select '5+ years' for TypeScript, React, and Node skills, and '2-5 years' for Postgres and Mongo skills. This aligns with the proficiency levels specified in the job requirements."
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

## Boolean Query Structure

### Query Variations Explained
The API generates 6 different Boolean query variations to provide flexibility in LinkedIn searches:

**Complete Queries (All Requirements):**
- `complete_query_all`: Job titles AND all skills (mandatory + optional)
- `complete_query_skills_only`: All skills without job title filtering
- `complete_query_job_titles_only`: Only job title variations

**Mandatory Only Queries:**
- `mandatory_only_query_all`: Job titles AND only mandatory skills
- `mandatory_only_query_skills_only`: Only mandatory skills
- `mandatory_only_query_job_titles_only`: Only job title variations (same as complete)

### Boolean Logic Patterns
- **Job Titles**: Connected with OR operators for variations
- **Mandatory Skills**: Connected with AND operators (all required)
- **Optional Skills**: Added with OR operators (any preferred)
- **Quoted Terms**: Multi-word terms enclosed in quotes for exact matching
- **Parentheses**: Used for proper grouping and precedence

### Job Title Generation
The API intelligently generates job title variations based on the input:
- Handles spacing variations (Full-Stack vs Fullstack vs Full Stack)
- Includes common synonyms (Engineer vs Developer)
- Maintains seniority levels (Senior, Lead, Principal)
- Accounts for industry-specific titles

## Filter Recommendations

### Recommendation Types
The API provides actionable filter recommendations for LinkedIn Recruiter:

**Location Recommendations:**
- Geographic targeting based on location attributes
- Region-specific guidance for remote positions
- Country-specific filtering when applicable

**Industry Recommendations:**
- Industry filter suggestions based on industry-type requirements
- Prioritization guidance (mandatory vs optional)
- Context for industry relevance

**Experience Recommendations:**
- Years of experience mapping from proficiency levels
- Skill-specific experience recommendations
- Alignment with job requirements

### Proficiency to Experience Mapping
- **Expert**: 5+ years experience
- **Advanced**: 2-5 years experience  
- **Beginner**: 0-2 years experience

## Integration Guide for Vita App

### Supabase Edge Function Call
```javascript
// Using Supabase client with authentication
async function generateLinkedInQueries(jobData) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-linkedin-queries', {
      body: {
        attributes: jobData.attributes,
        requirements: jobData.requirements
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating LinkedIn queries:', error);
    throw error;
  }
}
```

### Direct HTTP Call
```javascript
// Direct fetch with Supabase authentication
async function generateLinkedInQueries(jobData, supabaseUrl, anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-linkedin-queries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        attributes: jobData.attributes,
        requirements: jobData.requirements
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate LinkedIn queries');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating LinkedIn queries:', error);
    throw error;
  }
}
```

### Frontend Usage Example
```javascript
// In your React component for sourcing workflow
async function handleQueryGeneration(jobData) {
  setLoading(true);
  setGeneratedQueries(null);
  
  try {
    // Generate LinkedIn Boolean queries
    const queryData = await generateLinkedInQueries({
      attributes: jobData.attributes,
      requirements: jobData.requirements
    });
    
    // Store generated queries for display
    setGeneratedQueries(queryData.boolean_queries);
    setFilterRecommendations(queryData.recommendations);
    
    // Enable copy functionality for queries
    setCopyableQueries(queryData.boolean_queries);
    
  } catch (error) {
    setError(`Failed to generate LinkedIn queries: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Query Display Component
```javascript
// Component to display and copy LinkedIn queries
function LinkedInQueriesDisplay({ queries, recommendations }) {
  const [copiedQuery, setCopiedQuery] = useState('');
  
  const handleCopyQuery = async (queryType, queryText) => {
    try {
      await navigator.clipboard.writeText(queryText);
      setCopiedQuery(queryType);
      setTimeout(() => setCopiedQuery(''), 2000);
    } catch (error) {
      console.error('Failed to copy query:', error);
    }
  };
  
  const queryDescriptions = {
    complete_query_all: 'Complete Query (Titles + All Skills)',
    complete_query_skills_only: 'Skills Only (All Requirements)',
    complete_query_job_titles_only: 'Job Titles Only',
    mandatory_only_query_all: 'Mandatory Query (Titles + Required Skills)',
    mandatory_only_query_skills_only: 'Mandatory Skills Only',
    mandatory_only_query_job_titles_only: 'Job Titles Only'
  };
  
  return (
    <div className="linkedin-queries-container">
      <div className="queries-section mb-6">
        <h3 className="text-lg font-semibold mb-4">Boolean Search Queries</h3>
        {Object.entries(queries).map(([queryType, queryText]) => (
          <div key={queryType} className="query-item mb-4 p-4 border rounded">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{queryDescriptions[queryType]}</h4>
              <button
                onClick={() => handleCopyQuery(queryType, queryText)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                {copiedQuery === queryType ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="block bg-gray-100 p-2 rounded text-sm break-all">
              {queryText}
            </code>
          </div>
        ))}
      </div>
      
      <div className="recommendations-section">
        <h3 className="text-lg font-semibold mb-4">Filter Recommendations</h3>
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-item mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h4 className="font-medium text-yellow-800">{rec.display_name_type}</h4>
            <p className="text-yellow-700 text-sm mt-1">{rec.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Integration with Job Workflow
```javascript
// Complete sourcing workflow integration
async function startSourcingProcess(jobId) {
  try {
    // Step 1: Get job data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        job_requirements (*)
      `)
      .eq('id', jobId)
      .single();
      
    if (jobError) throw jobError;
    
    // Step 2: Generate LinkedIn queries
    const queryData = await generateLinkedInQueries({
      attributes: {
        title: job.title,
        location: {
          category: job.location_category,
          regions: job.location_regions,
          countries: job.location_countries
        }
      },
      requirements: job.job_requirements
    });
    
    // Step 3: Save queries for future reference
    const { error: saveError } = await supabase
      .from('linkedin_queries')
      .insert({
        job_id: jobId,
        queries: queryData.boolean_queries,
        recommendations: queryData.recommendations,
        created_at: new Date().toISOString()
      });
      
    if (saveError) throw saveError;
    
    // Step 4: Display sourcing interface
    setQueriesData(queryData);
    setShowSourcingInterface(true);
    
  } catch (error) {
    setError(`Failed to start sourcing process: ${error.message}`);
  }
}
```

## Error Handling

### Common Error Scenarios
1. **Method Not Allowed**: Non-POST requests
2. **Invalid Input**: Missing required fields (attributes, requirements)
3. **OpenAI API Errors**: Rate limiting, authentication, model errors
4. **JSON Parsing Errors**: Malformed AI response
5. **Supabase Auth Errors**: Invalid authentication token
6. **Processing Errors**: Internal AI processing failures

### Recommended Error Handling
```javascript
function getLinkedInQueryErrorMessage(error) {
  if (error.includes('Method not allowed')) {
    return 'Invalid request method. Please use POST.';
  }
  if (error.includes('Please provide')) {
    return 'Missing required job information. Please provide job attributes and requirements.';
  }
  if (error.includes('OpenAI API error: 429')) {
    return 'AI service is busy. Please try again in a moment.';
  }
  if (error.includes('OpenAI API')) {
    return 'AI query generation service is temporarily unavailable. Please try again.';
  }
  if (error.includes('parse AI response')) {
    return 'AI response format error. Please try again.';
  }
  if (error.includes('Authorization')) {
    return 'Authentication failed. Please refresh and try again.';
  }
  return 'Failed to generate LinkedIn queries. Please try again or contact support.';
}
```

## Usage in Vita App Context

### Integration Points
1. **Sourcing Workflow**: Generate Boolean queries for LinkedIn candidate searches
2. **Copy Functionality**: Enable easy copying of queries for LinkedIn Recruiter
3. **Filter Guidance**: Provide actionable recommendations for LinkedIn filters
4. **Query Variations**: Offer multiple search strategies for different scenarios
5. **Sourcing Efficiency**: Streamline the transition from job requirements to candidate search

### User Experience Flow
1. User completes job creation with requirements and attributes
2. User initiates sourcing process for the job
3. App calls generate-linkedin-queries API
4. Display loading state during query generation (5-10 seconds)
5. Show multiple Boolean query variations with copy buttons
6. Display filter recommendations for LinkedIn Recruiter
7. Allow user to copy queries and apply recommendations in LinkedIn
8. Save queries for future reference and team sharing

### Data Processing Features
- **Intelligent Title Expansion**: Generates relevant job title variations
- **Boolean Logic Optimization**: Creates efficient search queries
- **Mandatory vs Optional Handling**: Separates required and preferred skills
- **Geographic Intelligence**: Handles various location configurations
- **Experience Mapping**: Converts proficiency levels to years of experience
- **Filter Recommendations**: Provides actionable LinkedIn filter guidance

## Performance Considerations
- AI processing typically takes 5-10 seconds for query generation
- Optimized for LinkedIn Boolean search syntax
- Uses structured prompt engineering for consistent output
- Implements robust validation for query syntax
- Supabase authentication required for secure access
- Memory efficient with focused AI processing
- Handles various job types and skill combinations effectively
- Generates multiple query variations in single API call
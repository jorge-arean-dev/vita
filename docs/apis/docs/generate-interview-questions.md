# Generate Interview Questions API Integration Documentation

## Overview
This API endpoint generates 12 tailored interview questions for job positions using AI. It creates questions suitable for non-technical recruiters to conduct initial screening interviews, with questions categorized into 6 types (technical, problem_solving, communication, leadership, learning, cultural) and specifically tailored to job requirements and company culture.

## API Details

### Endpoint Information
- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/generate-interview-questions`
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
  "title": "string (required)",
  "job_requirements": [
    {
      "requirement": "string (required)",
      "type": "string (required)",
      "is_mandatory": "boolean (required)",
      "proficiency_level": "string (required)"
    }
  ],
  "company_culture": "string (optional)",
  "job_description": "string (required)"
}
```

### Input Validation Rules
- **title**: Required string (job title)
- **job_requirements**: Required array with validated structure
- **job_description**: Required string (full job description)
- **company_culture**: Optional string (can be empty)

**Job Requirements Validation:**
- `requirement`: Required string (skill/requirement name)
- `type`: Required string, must be one of: `technical_skill`, `technology_domain`, `soft_skill`, `role`, `certification`, `industry`
- `is_mandatory`: Required boolean
- `proficiency_level`: Required string, must be one of: `beginner`, `advanced`, `expert`

### Input Example
```json
{
  "title": "Senior Backend Engineer",
  "job_requirements": [
    {
      "requirement": "Node.js",
      "type": "technical_skill",
      "is_mandatory": true,
      "proficiency_level": "expert"
    },
    {
      "requirement": "PostgreSQL",
      "type": "technology_domain",
      "is_mandatory": true,
      "proficiency_level": "advanced"
    },
    {
      "requirement": "REST API design",
      "type": "technical_skill",
      "is_mandatory": true,
      "proficiency_level": "advanced"
    },
    {
      "requirement": "Team collaboration",
      "type": "soft_skill",
      "is_mandatory": true,
      "proficiency_level": "expert"
    },
    {
      "requirement": "Scrum/Agile",
      "type": "role",
      "is_mandatory": false,
      "proficiency_level": "beginner"
    },
    {
      "requirement": "AWS Certification",
      "type": "certification",
      "is_mandatory": false,
      "proficiency_level": "beginner"
    }
  ],
  "company_culture": "We foster a collaborative and transparent environment where learning and curiosity are highly valued. Our team thrives on feedback and continuous improvement.",
  "job_description": "We're looking for a Senior Backend Engineer to join our distributed team. You will work on scalable systems using Node.js and PostgreSQL, and help improve our REST APIs. You'll collaborate with front-end teams, DevOps, and product managers in a fast-paced agile environment."
}
```

## Response Format

### Success Response (200)
```json
{
  "questions": [
    {
      "type": "string",
      "question": "string"
    }
  ]
}
```

**Response Structure:**
- Returns exactly 12 questions
- Each type appears exactly twice: `technical`, `problem_solving`, `communication`, `leadership`, `learning`, `cultural`
- Questions are tailored to job requirements and company culture

### Success Response Example
```json
{
  "questions": [
    {
      "type": "technical",
      "question": "Can you share an example of a complex system you've built using Node.js, and the challenges you faced during the process?"
    },
    {
      "type": "technical",
      "question": "Can you describe a scenario where you used PostgreSQL to solve a significant data-related problem?"
    },
    {
      "type": "problem_solving",
      "question": "Tell me about a time when you had to troubleshoot a critical issue in a REST API you designed."
    },
    {
      "type": "problem_solving",
      "question": "Can you describe a situation where you had to solve a problem under tight deadlines?"
    },
    {
      "type": "communication",
      "question": "How do you ensure effective communication when collaborating with team members who are not backend engineers?"
    },
    {
      "type": "communication",
      "question": "Can you tell me about a time when you had to explain a complex backend issue to a non-technical stakeholder?"
    },
    {
      "type": "leadership",
      "question": "Describe a situation where you took the lead in a team to solve a complex technical problem."
    },
    {
      "type": "leadership",
      "question": "Have you ever mentored a junior backend engineer? If so, can you share your approach and its impact?"
    },
    {
      "type": "learning",
      "question": "How did you go about learning Scrum/Agile methodologies and how have you applied them in your work?"
    },
    {
      "type": "learning",
      "question": "What steps are you taking to prepare for the AWS Certification?"
    },
    {
      "type": "cultural",
      "question": "Our company values learning and continuous improvement. Can you share an example of how you've embraced these values in your career?"
    },
    {
      "type": "cultural",
      "question": "We foster a collaborative and transparent work environment. Can you describe a time when you contributed to such a culture?"
    }
  ]
}
```

### Error Response (400/405/500)
```json
{
  "error": "string (error description)",
  "details": "string (detailed error info)"
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
  "error": "Internal server error",
  "details": "Missing or invalid 'title' field - must be a string"
}
```

```json
{
  "error": "Internal server error",
  "details": "Proficiency level at index 0 must be one of: beginner, advanced, expert"
}
```

```json
{
  "error": "Internal server error",
  "details": "Expected 12 questions, got 10"
}
```

## AI Processing Details

### Model Configuration
- **Model**: GPT-4 for high-quality question generation
- **Temperature**: 0.3 for focused, consistent outputs
- **Max Tokens**: 2000 for comprehensive question sets

### Proficiency Level Understanding
The AI understands proficiency levels as:
- **Beginner**: Less than 2 years experience, learning fundamentals
- **Advanced**: 2-5 years experience, working independently
- **Expert**: 5+ years experience, mentoring/architectural guidance capabilities

### Question Generation Logic
- **Technical Questions**: Specific to job requirements, suitable for non-technical interviewers
- **Cultural Questions**: Tailored to company culture if provided, generic if culture is empty
- **Non-Technical Questions**: Cover problem-solving, communication, leadership, and learning abilities
- **Validation**: Ensures exactly 2 questions per type and proper structure

## Integration Examples

### Basic API Call
```javascript
// Using Supabase client
async function generateInterviewQuestions(jobData) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
      body: jobData
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating interview questions:', error);
    throw error;
  }
}
```

### Direct HTTP Call
```javascript
// Direct fetch with authentication
async function generateInterviewQuestions(jobData, supabaseUrl, anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-interview-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(jobData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate interview questions');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating interview questions:', error);
    throw error;
  }
}
```

### Frontend Usage
```javascript
// React component example
async function handleGenerateQuestions(jobId) {
  setLoading(true);
  
  try {
    // Get job data
    const { data: job } = await supabase
      .from('jobs')
      .select('*, job_requirements(*)')
      .eq('id', jobId)
      .single();
    
    // Format for API
    const jobData = {
      title: job.title,
      job_requirements: job.job_requirements.map(req => ({
        requirement: req.requirement,
        type: req.type,
        is_mandatory: req.is_mandatory,
        proficiency_level: req.proficiency_level
      })),
      company_culture: job.company_culture || '',
      job_description: job.job_description
    };
    
    // Generate questions
    const result = await generateInterviewQuestions(jobData);
    setQuestions(result.questions);
    
  } catch (error) {
    setError(`Failed to generate questions: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Response Processing
```javascript
// Group questions by type for display
function organizeQuestionsByType(questions) {
  const organized = {};
  
  questions.forEach(q => {
    if (!organized[q.type]) {
      organized[q.type] = [];
    }
    organized[q.type].push(q.question);
  });
  
  return organized;
}

// Usage
const organizedQuestions = organizeQuestionsByType(response.questions);
```

## Error Handling

### Input Validation Errors
- **Missing Required Fields**: Title, job_requirements, job_description
- **Invalid Data Types**: Non-string titles, non-array requirements
- **Invalid Proficiency Levels**: Values other than beginner/advanced/expert
- **Invalid Requirement Types**: Values outside allowed type list

### Processing Errors
- **OpenAI API Errors**: Rate limiting, authentication failures
- **Response Validation**: Wrong number of questions, missing question types
- **JSON Parsing**: Malformed AI responses

### Recommended Error Handling
```javascript
function getInterviewQuestionsErrorMessage(error) {
  if (error.includes('Method not allowed')) {
    return 'Invalid request method. Please use POST.';
  }
  if (error.includes('Missing or invalid')) {
    return 'Invalid job data format. Please check required fields.';
  }
  if (error.includes('must be one of')) {
    return 'Invalid proficiency level or requirement type provided.';
  }
  if (error.includes('Expected 12 questions')) {
    return 'AI generated incorrect number of questions. Please try again.';
  }
  if (error.includes('OpenAI API')) {
    return 'AI service temporarily unavailable. Please try again.';
  }
  return 'Failed to generate interview questions. Please try again.';
}
```

## Performance Considerations
- AI processing typically takes 10-20 seconds
- Uses GPT-4 for high-quality, context-aware question generation
- Implements comprehensive input validation before AI processing
- Response validation ensures consistent output structure
- Optimized prompts for non-technical recruiter use cases
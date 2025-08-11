# Email Builder API Integration Documentation

## Overview
This API endpoint generates personalized recruitment emails using AI. It creates both subject lines and email bodies tailored for either candidate outreach or client communication, incorporating job details, candidate information, and sender details to produce professional, contextually appropriate emails.

## API Details

### Endpoint Information
- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/email-builder`
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
  "job_information": {
    "initial_notes": "string (optional)",
    "company_name": "string (required)",
    "industry": "string (required)",
    "attributes": {
      "title": "string (optional)",
      "rate": {
        "value": "number (optional)",
        "freq": "string (optional)"
      },
      "commitment": "string (optional)",
      "duration": "string (optional)",
      "location": {
        "category": "string (optional)",
        "regions": ["string (optional)"],
        "countries": ["string (optional)"]
      }
    },
    "requirements": [
      {
        "requirement": "string",
        "type": "string",
        "is_mandatory": "boolean",
        "proficiency_level": "string",
        "weight": "number"
      }
    ]
  },
  "candidate_information": {
    "first_name": "string (optional)",
    "last_name": "string (optional)",
    "country": "string (optional)"
  },
  "sender_information": {
    "first_name": "string (required)",
    "last_name": "string (optional)",
    "position": "string (optional)",
    "company": "string (optional)"
  },
  "email_type": "string (required: 'candidate' | 'client')",
  "prompt": "string (required)"
}
```

### Input Validation Rules
- **job_information**: Required object with `company_name`, `industry`, `attributes` fields
- **sender_information**: Required object with `first_name` field minimum
- **email_type**: Required string, must be either "candidate" or "client"
- **prompt**: Required string with user instructions
- **candidate_information**: Optional object (uses placeholders if not provided)

### Input Example
```json
{
  "job_information": {
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
        "requirement": "PostgreSQL",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 0.75
      }
    ]
  },
  "candidate_information": {
    "first_name": "Enmanuel",
    "last_name": "Veras",
    "country": "DO"
  },
  "sender_information": {
    "first_name": "Sarah",
    "last_name": "Mitchell",
    "position": null,
    "company": null
  },
  "email_type": "candidate",
  "prompt": "generate an email to share details to candidate about the role and gauge interest."
}
```

## Response Format

### Success Response (200)
```json
{
  "subject": "string",
  "body": "string (with \\n\\n for paragraph breaks)"
}
```

### Success Response Example
```json
{
  "subject": "Exciting Opportunity - Senior Python Developer at FinTech Solutions Inc",
  "body": "Hi Enmanuel Veras,\n\nI hope this message finds you well! I'm Sarah Mitchell, and I'm thrilled to share an exciting opportunity with you at FinTech Solutions Inc. We are currently seeking a talented Senior Python Developer to join our dynamic team.\n\nIn this role, you'll have the chance to build and maintain our cutting-edge trading platform APIs, working with real-time data processing and ensuring compliance with financial regulations. Your expertise in Python, Django, and PostgreSQL will be invaluable as you mentor junior developers and collaborate closely with our quantitative research team.\n\nFinTech Solutions Inc is at the forefront of the Financial Technology industry, offering a hybrid work environment across the US and CA. We provide a competitive monthly rate of $12,000, along with the opportunity for permanent, full-time engagement. You'll be part of a company that values innovation, growth, and collaboration.\n\nIf you're ready to take the next step in your career and make a significant impact in the fintech world, I'd love to discuss this opportunity with you further. Please let me know a convenient time for us to connect.\n\nLooking forward to hearing from you soon!\n\nBest regards,\n\nSarah Mitchell"
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
  "error": "Invalid input. Please provide 'job_information', 'email_type', 'prompt', and 'sender_information' fields."
}
```

```json
{
  "error": "Invalid email_type. Must be either 'client' or 'candidate'."
}
```

```json
{
  "error": "Invalid job_information structure. Missing required fields: company_name, industry, or attributes."
}
```

```json
{
  "error": "Invalid sender_information structure. Missing required field: first_name. Fields last_name, position and company are optional."
}
```

## AI Processing Details

### Model Configuration
- **Model**: GPT-4o for high-quality email generation
- **Temperature**: 0.3 for consistent, professional tone
- **Max Tokens**: 1000 for comprehensive emails

### Email Type Guidelines

**Candidate Emails:**
- Engaging, friendly, and encouraging language
- Focus on opportunity and career growth potential
- Make the role sound exciting and appealing
- Include specific company and position benefits
- Warm, inviting language that encourages response
- Structure: Friendly greeting, opportunity introduction, role highlights, company benefits, call to action

**Client Emails:**
- Formal, professional business language
- Focus on candidate value propositions and business benefits
- Highlight relevant skills and experience matching job requirements
- Include specific details demonstrating candidate quality
- Confident, persuasive language presenting candidates favorably
- Structure: Professional greeting, clear purpose, candidate highlights, next steps, professional closing

### Subject Line Patterns

**Candidate Email Subjects:**
- "Exciting Opportunity - [Job Title] at [Company Name]"
- "[Company Name] - [Job Title] Position Available"
- "New [Job Title] Opportunity - [Key Benefit/Highlight]"
- "[Job Title] Role at [Company Name] - [Appeal Factor]"

**Client Email Subjects:**
- "Candidate Presentation - [Job Title] Position"
- "Qualified Candidate for [Job Title] - [Company Name]"
- "[Job Title] Candidate Submission - [Brief Highlight]"
- "Presenting: [Candidate Quality] for [Job Title] Role"

### Content Processing Logic
- **Job Information**: Formats company, position, requirements, and benefits
- **Candidate Information**: Uses provided details or placeholders like [Candidate Name]
- **Sender Information**: Creates professional signature from provided details
- **Paragraph Structure**: Uses `\\n\\n` for proper email formatting

## Integration Examples

### Basic API Call
```javascript
// Using Supabase client
async function generateEmail(emailData) {
  try {
    const { data, error } = await supabase.functions.invoke('email-builder', {
      body: emailData
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating email:', error);
    throw error;
  }
}
```

### Direct HTTP Call
```javascript
// Direct fetch with authentication
async function generateEmail(emailData, supabaseUrl, anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/email-builder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(emailData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate email');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating email:', error);
    throw error;
  }
}
```

### Frontend Usage
```javascript
// React component example
async function handleGenerateEmail(jobId, candidateId, emailType, prompt) {
  setLoading(true);
  
  try {
    // Get job and candidate data
    const [jobResponse, candidateResponse, userResponse] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', jobId).single(),
      candidateId ? supabase.from('candidates').select('*').eq('id', candidateId).single() : { data: null },
      supabase.from('users').select('*').eq('id', userId).single()
    ]);
    
    // Format for API
    const emailData = {
      job_information: {
        company_name: jobResponse.data.company_name,
        industry: jobResponse.data.industry,
        attributes: jobResponse.data.attributes,
        requirements: jobResponse.data.requirements,
        initial_notes: jobResponse.data.initial_notes
      },
      candidate_information: candidateResponse.data ? {
        first_name: candidateResponse.data.first_name,
        last_name: candidateResponse.data.last_name,
        country: candidateResponse.data.country
      } : null,
      sender_information: {
        first_name: userResponse.data.first_name,
        last_name: userResponse.data.last_name,
        position: userResponse.data.position,
        company: userResponse.data.company
      },
      email_type: emailType,
      prompt: prompt
    };
    
    // Generate email
    const result = await generateEmail(emailData);
    setGeneratedEmail(result);
    
  } catch (error) {
    setError(`Failed to generate email: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Email Display and Copy Component
```javascript
// Component for displaying generated email with copy functionality
function EmailDisplay({ generatedEmail }) {
  const [copied, setCopied] = useState({ subject: false, body: false });
  
  const handleCopy = async (field, content) => {
    try {
      // Convert \\n\\n to actual line breaks for copying
      const formattedContent = content.replace(/\\n\\n/g, '\n\n');
      await navigator.clipboard.writeText(formattedContent);
      setCopied(prev => ({ ...prev, [field]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [field]: false })), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  return (
    <div className="email-container space-y-4">
      {/* Subject Line */}
      <div className="subject-section">
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium text-gray-700">Subject Line</label>
          <button
            onClick={() => handleCopy('subject', generatedEmail.subject)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            {copied.subject ? 'Copied!' : 'Copy Subject'}
          </button>
        </div>
        <div className="p-3 bg-gray-50 border rounded">
          {generatedEmail.subject}
        </div>
      </div>
      
      {/* Email Body */}
      <div className="body-section">
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium text-gray-700">Email Body</label>
          <button
            onClick={() => handleCopy('body', generatedEmail.body)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            {copied.body ? 'Copied!' : 'Copy Body'}
          </button>
        </div>
        <div className="p-4 bg-gray-50 border rounded whitespace-pre-line">
          {generatedEmail.body.replace(/\\n\\n/g, '\n\n')}
        </div>
      </div>
    </div>
  );
}
```

## Error Handling

### Input Validation Errors
- **Missing Required Fields**: job_information, email_type, prompt, sender_information
- **Invalid Email Type**: Values other than "candidate" or "client"
- **Invalid Job Structure**: Missing company_name, industry, or attributes
- **Invalid Sender Structure**: Missing first_name field

### Processing Errors
- **OpenAI API Errors**: Rate limiting, authentication failures
- **Response Validation**: Missing subject or body fields
- **JSON Parsing**: Malformed AI responses

### Recommended Error Handling
```javascript
function getEmailBuilderErrorMessage(error) {
  if (error.includes('Method not allowed')) {
    return 'Invalid request method. Please use POST.';
  }
  if (error.includes('Please provide')) {
    return 'Missing required fields. Please provide all job, sender, and email type information.';
  }
  if (error.includes('Invalid email_type')) {
    return 'Email type must be either "candidate" or "client".';
  }
  if (error.includes('Invalid job_information')) {
    return 'Job information is incomplete. Please provide company name, industry, and job attributes.';
  }
  if (error.includes('Invalid sender_information')) {
    return 'Sender information is incomplete. Please provide at least the sender\'s first name.';
  }
  if (error.includes('OpenAI API')) {
    return 'AI email generation service temporarily unavailable. Please try again.';
  }
  return 'Failed to generate email. Please try again.';
}
```

## Performance Considerations
- AI processing typically takes 8-15 seconds for email generation
- Uses GPT-4o for high-quality, contextually appropriate emails
- Implements comprehensive input validation before AI processing
- Response includes both subject line and formatted email body
- Optimized prompts for different email types (candidate vs client)
- Memory efficient with structured prompt formatting
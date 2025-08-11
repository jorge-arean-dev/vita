# Match Analysis API Integration Documentation

## Overview
This API endpoint performs comprehensive candidate-job matching analysis using AI. It compares a candidate's skills, experience, and qualifications against job requirements to provide detailed compatibility insights, gap analysis, matching scores, and actionable recruiter recommendations for informed recruitment decision-making.

## API Details

### Endpoint Information
- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis`
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
  "candidate": {
    "main": {
      "first_name": "string",
      "last_name": "string",
      "country": "string",
      "email": "string",
      "phone": "string",
      "linkedin": "string",
      "github": "string"
    },
    "skills": [
      {
        "name": "string",
        "type": "string",
        "yoe": "number | null",
        "proficiency_level": "string | null"
      }
    ],
    "years_of_experience": "number"
  },
  "job": {
    "attributes": {
      "title": "string",
      "rate": {
        "value": "string",
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
        "proficiency_level": "string",
        "weight": "number"
      }
    ],
    "job_description": "string"
  }
}
```

### Input Example
```json
{
  "candidate": {
    "main": {
      "first_name": "Enmanuel",
      "last_name": "Veras",
      "country": "DO",
      "email": "enmaveras07@gmail.com",
      "phone": "+18498683739",
      "linkedin": "https://www.linkedin.com/in/everas7/",
      "github": ""
    },
    "skills": [
      {
        "name": "JavaScript",
        "type": "technical_skill",
        "yoe": 5,
        "proficiency_level": "advanced"
      },
      {
        "name": "TypeScript",
        "type": "technical_skill",
        "yoe": 1,
        "proficiency_level": "beginner"
      },
      {
        "name": "React",
        "type": "technical_skill",
        "yoe": 3.5,
        "proficiency_level": "advanced"
      },
      {
        "name": "Node",
        "type": "technical_skill",
        "yoe": 3.5,
        "proficiency_level": "advanced"
      },
      {
        "name": "PostgreSQL",
        "type": "technical_skill",
        "yoe": 1,
        "proficiency_level": "beginner"
      },
      {
        "name": "MongoDB",
        "type": "technical_skill",
        "yoe": 1,
        "proficiency_level": "beginner"
      },
      {
        "name": "Communication",
        "type": "soft_skill",
        "yoe": null,
        "proficiency_level": null
      }
    ],
    "years_of_experience": 5
  },
  "job": {
    "attributes": {
      "title": "Senior Full-Stack Developer",
      "rate": {
        "value": "",
        "freq": ""
      },
      "commitment": "full_time",
      "duration": "permanent",
      "location": {
        "category": "remote_region_specific",
        "regions": ["south_america", "central_america"],
        "countries": [""]
      }
    },
    "requirements": [
      {
        "requirement": "TypeScript",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "expert",
        "weight": 1
      },
      {
        "requirement": "React",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "expert",
        "weight": 1
      },
      {
        "requirement": "Node",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "expert",
        "weight": 1
      },
      {
        "requirement": "Postgres",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 0.75
      },
      {
        "requirement": "Mongo",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 0.75
      },
      {
        "requirement": "AWS",
        "type": "technical_skill",
        "is_mandatory": false,
        "proficiency_level": "advanced",
        "weight": 0.5
      },
      {
        "requirement": "Financial Services",
        "type": "industry",
        "is_mandatory": false,
        "proficiency_level": "advanced",
        "weight": 0.5
      }
    ],
    "job_description": "Senior Full-Stack Developer role requiring expert TypeScript, React, and Node skills..."
  }
}
```

### Input Validation Requirements
- `candidate`: Required, complete candidate profile with main info, skills array, and experience
- `job`: Required, job details with attributes, requirements array, and description
- `candidate.skills`: Must be non-empty array
- `job.requirements`: Must be non-empty array

## Response Format

### Success Response (200)
```json
{
  "match_analysis": {
    "overall_score": "number (0-100)",
    "status": "string (strong | adequate | weak | missing)",
    "overall_feedback": "string",
    "matched_mandatory_requirements": "number",
    "total_mandatory_requirements": "number"
  },
  "requirement_evaluations": [
    {
      "requirement_name": "string",
      "score": "number (0-100)",
      "status": "string (strong | adequate | weak | missing)",
      "feedback": "string"
    }
  ],
  "summary": {
    "strengths": ["string"],
    "gaps": ["string"]
  },
  "recruiter_recommendations": {
    "interview_strategy": ["string"],
    "other_options": ["string"]
  },
  "metadata": {
    "analysis_timestamp": "string (ISO datetime)",
    "job_id": "string",
    "candidate_id": "string",
    "algorithm_version": "string",
    "total_processing_time_ms": "number"
  }
}
```

### Success Response Example
```json
{
  "match_analysis": {
    "overall_score": 18,
    "status": "missing",
    "overall_feedback": "This candidate is not a good fit; consider other options unless more information becomes available.",
    "matched_mandatory_requirements": 0,
    "total_mandatory_requirements": 5
  },
  "requirement_evaluations": [
    {
      "requirement_name": "TypeScript",
      "score": 6,
      "status": "missing",
      "feedback": "Candidate has beginner-level TypeScript (1 year) but expert level required (5+ years). Significant skill gap identified for senior role."
    },
    {
      "requirement_name": "React",
      "score": 39,
      "status": "weak",
      "feedback": "Candidate demonstrates advanced proficiency in React with 3.5 years of experience, but the expert level required indicates a need for deeper knowledge and experience in complex projects."
    },
    {
      "requirement_name": "Node",
      "score": 39,
      "status": "weak",
      "feedback": "Similar to React, the candidate has advanced Node.js skills with 3.5 years of experience, but the expert level required suggests a gap in handling more sophisticated backend challenges."
    },
    {
      "requirement_name": "Postgres",
      "score": 11,
      "status": "missing",
      "feedback": "Candidate has only beginner-level experience with Postgres (1 year) while the role requires advanced proficiency, indicating a significant gap in database management skills."
    },
    {
      "requirement_name": "Mongo",
      "score": 11,
      "status": "missing",
      "feedback": "The candidate's beginner-level experience with MongoDB (1 year) falls short of the advanced proficiency required for this position, highlighting a crucial area for development."
    },
    {
      "requirement_name": "AWS",
      "score": 0,
      "status": "missing",
      "feedback": "Candidate lacks AWS experience, which is not mandatory but would enhance their profile for the role, especially in cloud-based applications."
    },
    {
      "requirement_name": "Financial Services",
      "score": 0,
      "status": "missing",
      "feedback": "No experience in the financial services industry was noted, which is not mandatory but could be beneficial for understanding the domain-specific challenges."
    }
  ],
  "summary": {
    "strengths": [
      "Strong React and Node.js foundation with 3.5 years experience each",
      "Advanced proficiency in JavaScript and Python, both with 5 years of experience",
      "Solid background in Agile methodologies, Scrum, and Test Driven Development"
    ],
    "gaps": [
      "TypeScript proficiency significantly below senior level requirements",
      "Missing advanced skills in Postgres and MongoDB, both critical for the role",
      "Limited experience with AWS and financial services, which could enhance the candidate's fit"
    ]
  },
  "recruiter_recommendations": {
    "interview_strategy": [
      "Dig deeper into TypeScript projects during the technical interview to assess potential for growth.",
      "Explore the candidate's experience with complex React and Node.js applications to gauge depth of knowledge.",
      "Assess problem-solving skills through practical coding challenges that require database interactions."
    ],
    "other_options": [
      "Consider 'Mid-Level with Senior Potential' positioning instead, focusing on growth opportunities.",
      "Explore roles that emphasize JavaScript and Python skills while allowing for development in TypeScript and database technologies.",
      "Suggest a mentorship program or training in TypeScript and database management to bridge skill gaps."
    ]
  },
  "metadata": {
    "analysis_timestamp": "2025-08-01T02:55:13.407Z",
    "job_id": "placeholder_job_id",
    "candidate_id": "placeholder_candidate_id",
    "algorithm_version": "1.0",
    "total_processing_time_ms": 15278
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
  "error": "Invalid input. Expected object with 'candidate' and 'job' properties."
}
```

```json
{
  "error": "Invalid candidate data. Must contain 'main' and 'skills' array."
}
```

```json
{
  "error": "Invalid job data. Must contain non-empty 'requirements' array."
}
```

```json
{
  "error": "Internal server error",
  "details": "OpenAI API error: 429 Too Many Requests"
}
```

## Match Analysis Algorithm (Based on Code Implementation)

### Scoring System Architecture
The API uses a sophisticated multi-factor scoring algorithm with the following components:

**Individual Requirement Scoring Process:**
1. **Skill Matching**: Finds corresponding candidate skill using intelligent matching
2. **Proficiency Calculation**: Maps proficiency levels to numerical values
3. **Experience Factor**: Considers years of experience against thresholds
4. **Weight Application**: Applies requirement importance weight
5. **Score Capping**: Ensures maximum 100% score per requirement

### Proficiency Level Mapping (From Code)
```javascript
const proficiencyLevels = {
  'beginner': 1,    // 0-2 years
  'advanced': 2,    // 2-5 years  
  'expert': 3       // 5+ years
};
```

### Years of Experience Thresholds (From Code)
```javascript
function getYoeThreshold(proficiencyLevel) {
  switch(proficiencyLevel) {
    case 'beginner': return 1;      // 1 year threshold
    case 'advanced': return 3.5;    // 3.5 years (midpoint of 2-5)
    case 'expert': return 6;        // 6 years (conservative expert)
    default: return 1;
  }
}
```

### Score Calculation Formula (From Code)
```javascript
// Step 1: Proficiency multiplier
const proficiencyMultiplier = candidateLevel / requiredLevel;

// Step 2: Experience factor (with 20% bonus cap)
const experienceFactor = Math.min(candidateYoe / requiredYoeThreshold, 1.2);

// Step 3: Final score calculation
const finalScore = Math.min(
  1.0 * proficiencyMultiplier * experienceFactor, 
  1.0  // Cap at 100%
);

// Step 4: Apply weight and convert to percentage
return Math.round(finalScore * jobRequirement.weight * 100);
```

### Overall Score Calculation (80/20 Weighting)
```javascript
// Mandatory requirements: 80% weight
// Optional requirements: 20% weight
const overallScore = Math.round(mandatoryScore * 0.8 + optionalScore * 0.2);
```

### Status Classification System
Based on scores, all elements are classified into 4 status levels:

- **Strong** (75-100%): Excellent match, exceeds or meets expectations
- **Adequate** (50-74%): Good match, meets basic requirements  
- **Weak** (25-49%): Below expectations, potential concerns
- **Missing** (0-24%): Significant gap, major concern

### Skill Matching Intelligence (From Code)

**Direct Matching:**
- Case-insensitive name comparison
- Type consistency validation (technical_skill, soft_skill, etc.)

**Variation Handling:**
```javascript
const variations = {
  'postgres': ['postgresql'],
  'postgresql': ['postgres'],
  'mongo': ['mongodb'],
  'mongodb': ['mongo'],
  'js': ['javascript'],
  'javascript': ['js'],
  'ts': ['typescript'],
  'typescript': ['ts']
};
```

**Technology Domain Matching:**
- Broader partial matching for technology domains
- Includes/contains logic for domain-level skills

### Overall Feedback Messages (Auto-Generated)
```javascript
function getOverallFeedback(status) {
  switch(status) {
    case "strong":
      return "This candidate is well-suited for this position and should be presented.";
    case "adequate":
      return "Please consider reviewing and confirming some aspects before proceeding.";
    case "weak":
      return "This candidate may not be a strong fit; further review is recommended before proceeding.";
    case "missing":
      return "This candidate is not a good fit; consider other options unless more information becomes available.";
    default:
      return "Analysis incomplete - please review manually.";
  }
}
```

### AI-Powered Content Generation
The API uses **GPT-4o-mini** with the following configuration:
- **Model**: `gpt-4o-mini` for cost-effective, high-quality analysis
- **Temperature**: `0.3` for focused, consistent responses
- **Max Tokens**: `2000` for comprehensive feedback
- **System Role**: Expert recruiter with technical skills knowledge

**AI-Generated Content Includes:**
1. **Individual Requirement Feedback**: 1-2 sentence explanations for each score
2. **Strengths Summary**: 3-5 bullet points highlighting candidate advantages
3. **Gaps Analysis**: 3-5 bullet points identifying skill deficiencies
4. **Interview Strategy**: 3-4 specific interview focus areas
5. **Alternative Options**: 3-4 suggestions for different candidate positioning

## Integration Guide for Vita App

### Supabase Edge Function Call
```javascript
// Using Supabase client with authentication
async function analyzeMatch(candidateData, jobData) {
  try {
    const { data, error } = await supabase.functions.invoke('match-analysis', {
      body: {
        candidate: candidateData,
        job: jobData
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error analyzing match:', error);
    throw error;
  }
}
```

### Direct HTTP Call
```javascript
// Direct fetch with Supabase authentication
async function analyzeMatch(candidateData, jobData, supabaseUrl, anonKey) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/match-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        candidate: candidateData,
        job: jobData
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze match');
    }
    
    return data;
  } catch (error) {
    console.error('Error analyzing match:', error);
    throw error;
  }
}
```

### Frontend Usage Example
```javascript
// In your React component for candidate evaluation
async function handleMatchAnalysis(candidate, job) {
  setLoading(true);
  setAnalysisResults(null);
  
  try {
    // Perform comprehensive match analysis
    const analysisResults = await analyzeMatch(candidate, job);
    
    // Store results for display
    setAnalysisResults(analysisResults);
    
    // Update candidate status based on analysis
    await updateCandidateStatus(candidate.id, {
      match_score: analysisResults.match_analysis.overall_score,
      match_status: analysisResults.match_analysis.status,
      analyzed_at: new Date().toISOString()
    });
    
    // Show success notification
    showNotification(`Analysis complete: ${analysisResults.match_analysis.overall_score}% match`);
    
  } catch (error) {
    setError(`Failed to analyze candidate match: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

### Comprehensive Match Results Display Component
```javascript
// Component to display complete match analysis results
function MatchAnalysisDisplay({ analysisResults }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'strong': return 'text-green-600 bg-green-100 border-green-200';
      case 'adequate': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'weak': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'missing': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };
  
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreProgress = (score) => {
    return Math.max(score, 5); // Minimum 5% for visual purposes
  };
  
  return (
    <div className="match-analysis-container space-y-6">
      {/* Overall Match Score Header */}
      <div className="overall-match bg-white p-6 rounded-lg shadow-lg border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Overall Match Analysis</h3>
            <p className="text-gray-600 mt-1">Comprehensive candidate-job compatibility assessment</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(analysisResults.match_analysis.overall_score)} mb-2`}>
              {analysisResults.match_analysis.overall_score}%
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(analysisResults.match_analysis.status)}`}>
              {analysisResults.match_analysis.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              analysisResults.match_analysis.overall_score >= 75 ? 'bg-green-500' :
              analysisResults.match_analysis.overall_score >= 50 ? 'bg-blue-500' :
              analysisResults.match_analysis.overall_score >= 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${getScoreProgress(analysisResults.match_analysis.overall_score)}%` }}
          ></div>
        </div>
        
        <p className="text-gray-800 mb-4 text-lg">{analysisResults.match_analysis.overall_feedback}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="bg-gray-50 px-4 py-2 rounded-lg">
            <span className="text-gray-600">Mandatory Requirements: </span>
            <span className="font-semibold text-gray-900">
              {analysisResults.match_analysis.matched_mandatory_requirements} of {analysisResults.match_analysis.total_mandatory_requirements} matched
            </span>
          </div>
          <div className="text-gray-500">
            Analysis completed in {analysisResults.metadata.total_processing_time_ms}ms
          </div>
        </div>
      </div>
      
      {/* Detailed Requirement Evaluations */}
      <div className="requirements-analysis bg-white p-6 rounded-lg shadow-lg border">
        <h3 className="text-xl font-semibold mb-6 text-gray-900">Detailed Requirement Analysis</h3>
        <div className="space-y-4">
          {analysisResults.requirement_evaluations.map((req, index) => (
            <div key={index} className="requirement-item p-5 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-md text-sm">
                    {req.requirement_name}
                  </span>
                  <span className="text-gray-500 text-sm">Requirement {index + 1}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-xl font-bold ${getScoreColor(req.score)}`}>
                    {req.score}%
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Mini Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    req.score >= 75 ? 'bg-green-500' :
                    req.score >= 50 ? 'bg-blue-500' :
                    req.score >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${getScoreProgress(req.score)}%` }}
                ></div>
              </div>
              
              <p className="text-gray-700 text-sm leading-relaxed">{req.feedback}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary Section */}
      <div className="summary-section bg-white p-6 rounded-lg shadow-lg border">
        <h3 className="text-xl font-semibold mb-6 text-gray-900">Match Summary</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="strengths-section">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <h4 className="font-semibold text-green-700 text-lg">Key Strengths</h4>
            </div>
            <ul className="space-y-3">
              {analysisResults.summary.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-green-500 mr-3 mt-1 text-lg">✓</span>
                  <span className="leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="gaps-section">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <h4 className="font-semibold text-red-700 text-lg">Skill Gaps</h4>
            </div>
            <ul className="space-y-3">
              {analysisResults.summary.gaps.map((gap, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-red-500 mr-3 mt-1 text-lg">⚠</span>
                  <span className="leading-relaxed">{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Recruiter Recommendations */}
      <div className="recommendations-section bg-white p-6 rounded-lg shadow-lg border">
        <h3 className="text-xl font-semibold mb-6 text-gray-900">Recruiter Recommendations</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="interview-strategy">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <h4 className="font-semibold text-purple-700 text-lg">Interview Strategy</h4>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-800 text-sm mb-3 font-medium">Focus areas during interview:</p>
              <ul className="space-y-2">
                {analysisResults.recruiter_recommendations.interview_strategy.map((strategy, index) => (
                  <li key={index} className="text-sm text-purple-700 flex items-start">
                    <span className="text-purple-500 mr-3 mt-1">→</span>
                    <span className="leading-relaxed">{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="other-options">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h4 className="font-semibold text-blue-700 text-lg">Alternative Options</h4>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm mb-3 font-medium">Consider these alternatives:</p>
              <ul className="space-y-2">
                {analysisResults.recruiter_recommendations.other_options.map((option, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="text-blue-500 mr-3 mt-1">💡</span>
                    <span className="leading-relaxed">{option}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Metadata Footer */}
      <div className="metadata-section bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div>Analysis Version: {analysisResults.metadata.algorithm_version}</div>
          <div>Completed: {new Date(analysisResults.metadata.analysis_timestamp).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
```

### Complete Workflow Integration
```javascript
// Full candidate evaluation workflow with database persistence
async function evaluateCandidate(candidateId, jobId) {
  try {
    // Step 1: Get candidate and job data with related information
    const [candidateResponse, jobResponse] = await Promise.all([
      supabase
        .from('candidates')
        .select(`
          *,
          candidate_skills (*)
        `)
        .eq('id', candidateId)
        .single(),
      supabase
        .from('jobs')
        .select(`
          *,
          job_requirements (*)
        `)
        .eq('id', jobId)
        .single()
    ]);
    
    if (candidateResponse.error) throw candidateResponse.error;
    if (jobResponse.error) throw jobResponse.error;
    
    const candidate = candidateResponse.data;
    const job = jobResponse.data;
    
    // Step 2: Format data for analysis API
    const formattedCandidate = {
      main: {
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        country: candidate.country,
        email: candidate.email,
        phone: candidate.phone,
        linkedin: candidate.linkedin_url,
        github: candidate.github_url
      },
      skills: candidate.candidate_skills.map(skill => ({
        name: skill.skill_name,
        type: skill.skill_type,
        yoe: skill.years_of_experience,
        proficiency_level: skill.proficiency_level
      })),
      years_of_experience: candidate.years_of_experience
    };
    
    const formattedJob = {
      attributes: {
        title: job.title,
        rate: {
          value: job.rate_value || '',
          freq: job.rate_frequency || ''
        },
        commitment: job.commitment,
        duration: job.duration,
        location: {
          category: job.location_category,
          regions: job.location_regions || [],
          countries: job.location_countries || []
        }
      },
      requirements: job.job_requirements.map(req => ({
        requirement: req.requirement,
        type: req.type,
        is_mandatory: req.is_mandatory,
        proficiency_level: req.proficiency_level,
        weight: req.weight
      })),
      job_description: job.job_description
    };
    
    // Step 3: Run match analysis
    const analysisResults = await analyzeMatch(formattedCandidate, formattedJob);
    
    // Step 4: Save analysis results to database
    const { error: saveError } = await supabase
      .from('match_analyses')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        overall_score: analysisResults.match_analysis.overall_score,
        status: analysisResults.match_analysis.status,
        matched_mandatory: analysisResults.match_analysis.matched_mandatory_requirements,
        total_mandatory: analysisResults.match_analysis.total_mandatory_requirements,
        analysis_data: analysisResults,
        metadata: analysisResults.metadata,
        created_at: new Date().toISOString()
      });
      
    if (saveError) throw saveError;
    
    // Step 5: Update candidate status in job pipeline
    await supabase
      .from('candidate_job_status')
      .upsert({
        candidate_id: candidateId,
        job_id: jobId,
        status: analysisResults.match_analysis.status,
        match_score: analysisResults.match_analysis.overall_score,
        last_analyzed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    return analysisResults;
  } catch (error) {
    throw new Error(`Candidate evaluation failed: ${error.message}`);
  }
}
```

### Batch Analysis for Multiple Candidates
```javascript
// Analyze multiple candidates against a single job with progress tracking
async function batchAnalyzeCandidates(candidateIds, jobId, onProgress) {
  const results = [];
  const errors = [];
  let completed = 0;
  
  try {
    // Get job data once
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`*, job_requirements (*)`)
      .eq('id', jobId)
      .single();
      
    if (jobError) throw jobError;
    
    // Process candidates in smaller batches to avoid overwhelming the API
    const batchSize = 3; // Reduced batch size due to AI processing time
    
    for (let i = 0; i < candidateIds.length; i += batchSize) {
      const batch = candidateIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (candidateId) => {
        try {
          const analysis = await evaluateCandidate(candidateId, jobId);
          completed++;
          
          // Report progress
          if (onProgress) {
            onProgress({
              completed,
              total: candidateIds.length,
              currentCandidate: analysis.metadata.candidate_id,
              progress: (completed / candidateIds.length) * 100
            });
          }
          
          return { 
            candidateId, 
            analysis, 
            success: true,
            processingTime: analysis.metadata.total_processing_time_ms
          };
        } catch (error) {
          completed++;
          errors.push({ candidateId, error: error.message });
          
          if (onProgress) {
            onProgress({
              completed,
              total: candidateIds.length,
              error: error.message,
              progress: (completed / candidateIds.length) * 100
            });
          }
          
          return { candidateId, error: error.message, success: false };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r.success));
      
      // Brief pause between batches to prevent API rate limiting
      if (i + batchSize < candidateIds.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Sort results by match score (highest first)
    const sortedResults = results.sort((a, b) => 
      b.analysis.match_analysis.overall_score - a.analysis.match_analysis.overall_score
    );
    
    return { 
      results: sortedResults, 
      errors,
      summary: {
        total: candidateIds.length,
        successful: results.length,
        failed: errors.length,
        averageScore: results.length > 0 ? 
          results.reduce((sum, r) => sum + r.analysis.match_analysis.overall_score, 0) / results.length : 0,
        totalProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0)
      }
    };
  } catch (error) {
    throw new Error(`Batch analysis failed: ${error.message}`);
  }
}
```

## Error Handling

### Common Error Scenarios
1. **Method Not Allowed**: Non-POST requests
2. **Invalid Input Structure**: Missing candidate or job properties
3. **Invalid Candidate Data**: Missing main info or skills array
4. **Invalid Job Data**: Missing or empty requirements array
5. **OpenAI API Errors**: Rate limiting, authentication, model errors
6. **Skill Matching Errors**: No matching skills found for analysis
7. **Calculation Errors**: Issues with score computation or status determination
8. **Database Errors**: Problems saving analysis results
9. **Processing Timeout**: Analysis taking too long to complete

### Comprehensive Error Handling
```javascript
function getMatchAnalysisErrorMessage(error) {
  // API-specific errors
  if (error.includes('Method not allowed')) {
    return 'Invalid request method. Please use POST.';
  }
  if (error.includes('Expected object with')) {
    return 'Invalid data structure. Please provide both candidate and job information.';
  }
  if (error.includes('Invalid candidate data')) {
    return 'Candidate data is incomplete. Please ensure profile and skills are provided.';
  }
  if (error.includes('Invalid job data')) {
    return 'Job requirements are missing. Please provide complete job requirements.';
  }
  
  // OpenAI API errors
  if (error.includes('OpenAI API error: 429')) {
    return 'AI analysis service is busy. Please try again in a moment.';
  }
  if (error.includes('OpenAI API error: 401')) {
    return 'AI service authentication failed. Please contact support.';
  }
  if (error.includes('OpenAI API')) {
    return 'AI analysis service is temporarily unavailable. Please try again.';
  }
  
  // Processing errors
  if (error.includes('timeout')) {
    return 'Analysis timed out. Please try again with a simpler profile.';
  }
  if (error.includes('parse')) {
    return 'Error processing analysis results. Please try again.';
  }
  
  // Authentication errors
  if (error.includes('Authorization')) {
    return 'Authentication failed. Please refresh and try again.';
  }
  
  // Generic fallback
  return 'Failed to analyze candidate match. Please try again or contact support.';
}

// Enhanced error handling with retry logic
async function analyzeMatchWithRetry(candidateData, jobData, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await analyzeMatch(candidateData, jobData);
    } catch (error) {
      lastError = error;
      
      // Don't retry certain errors
      if (error.message.includes('Invalid') || 
          error.message.includes('Expected object') ||
          error.message.includes('Authorization')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying match analysis (attempt ${attempt + 1}/${maxRetries})...`);
      }
    }
  }
  
  throw new Error(`Match analysis failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

## Usage in Vita App Context

### Integration Points
1. **Candidate Pipeline Management**: Automated scoring and status updates for recruitment pipelines
2. **Interview Preparation**: AI-generated interview strategies and focus areas
3. **Recruiter Decision Support**: Comprehensive insights for hiring decisions
4. **Batch Processing**: Efficient analysis of multiple candidates against job requirements
5. **Skills Gap Analysis**: Detailed identification of candidate strengths and weaknesses
6. **Alternative Positioning**: Suggestions for different role levels or requirements

### User Experience Flow
1. **Selection**: User selects candidate and job for match analysis
2. **Processing**: App calls match-analysis API with loading indicator (10-15 seconds typical)
3. **Results Display**: Comprehensive match results with visual score indicators
4. **Detailed Review**: Requirement-by-requirement analysis with AI feedback
5. **Action Planning**: Interview strategies and alternative positioning options
6. **Status Updates**: Automatic candidate status updates based on match quality
7. **Historical Tracking**: Saved analyses for future reference and comparison

### Advanced Features
- **Real-time Progress**: Live updates during batch analysis processing
- **Comparative Analysis**: Side-by-side comparison of multiple candidate analyses
- **Export Capabilities**: PDF/Excel export of analysis results for stakeholder sharing
- **Integration Hooks**: Webhooks for downstream systems based on match scores
- **Analytics Dashboard**: Aggregate insights across all match analyses

### Data Processing Features
- **Intelligent Skill Matching**: Advanced algorithms handle skill name variations and synonyms
- **Multi-Factor Scoring**: Sophisticated scoring combining proficiency, experience, and importance weights
- **AI-Powered Insights**: Natural language feedback and recommendations from GPT-4o-mini
- **Status Classification**: Clear, actionable categorization of match quality
- **Weighted Analysis**: Proper prioritization of mandatory vs optional requirements
- **Comprehensive Metadata**: Complete audit trails with processing times and algorithm versions

## Performance Considerations
- **Processing Time**: AI analysis typically takes 10-15 seconds per candidate-job pair
- **Batch Optimization**: Recommended batch size of 3-5 candidates to balance speed and API limits
- **Rate Limiting**: Built-in delays between batch requests to prevent API throttling
- **Memory Efficiency**: Optimized data structures for large-scale candidate processing
- **Caching Strategy**: Consider caching job requirements for repeated analyses
- **Error Resilience**: Comprehensive retry logic with exponential backoff
- **Database Optimization**: Efficient storage and retrieval of analysis results
- **Scalability**: Designed for high-volume recruitment processing with proper resource management
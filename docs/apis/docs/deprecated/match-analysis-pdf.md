# Match Analysis PDF API

## Overview
The Match Analysis PDF API is designed to evaluate how well a candidate's resume (in PDF format) matches specific job requirements. This API uses OpenAI embeddings for semantic skill matching and implements a two-tier scoring system that differentiates between mandatory and optional requirements.

## Algorithm Version
**pdf-v1.0** - PDF Resume Analysis with Evidence Extraction

## Key Features

### 🎯 Two-Tier Scoring System
- **Mandatory Requirements**: 80% weight in overall score with stricter thresholds
- **Optional Requirements**: 20% weight with more lenient evaluation
- Prevents unqualified candidates from scoring high on optional skills alone

### 📄 PDF Resume Processing  
- Extracts text content from PDF resumes
- Identifies skills, technologies, and experience patterns
- Processes company names and job titles for context
- Handles unstructured resume formats

### 🔍 Enhanced Evidence Extraction
- **Company Attribution**: Links skills to specific companies and roles
- **Pattern Recognition**: Identifies leadership, technical implementation, scale, and achievements
- **Context Preservation**: Maintains relationship between skills and professional experience
- **Evidence Quality Assessment**: Differentiates between mentioned vs. demonstrated skills

### 🧠 Semantic Skill Matching
- **OpenAI Embeddings**: Uses `text-embedding-3-small` for skill similarity
- **Skill Hierarchy**: Understands parent-child relationships (e.g., Django → Python)
- **Alias Recognition**: Handles skill variations (React.js → React, K8s → Kubernetes)
- **Caching System**: Stores embeddings in Supabase for performance

### 💡 Intelligent Recruiter Feedback
- **Evidence-Based Insights**: Quotes specific resume text with company context
- **Experience Depth Analysis**: Evaluates years of experience and proficiency levels
- **Gap Analysis**: Identifies missing mandatory requirements with impact assessment
- **Role Inference**: Determines candidate's likely role and seniority level

## API Endpoint

```
POST https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-pdf
```

## Request Format

```json
{
  "candidate": {
    "main": {
      "first_name": "John",
      "last_name": "Doe"
    },
    "skills": [
      {
        "name": "JavaScript",
        "type": "technical_skill",
        "yoe": 5,
        "proficiency_level": "advanced"
      }
    ],
    "raw_pdf_profile_text": "Full resume text extracted from PDF..."
  },
  "job": {
    "attributes": {
      "title": "Senior Full Stack Developer"
    },
    "requirements": [
      {
        "requirement": "React",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 8
      }
    ]
  }
}
```

## Response Format

```json
{
  "match_analysis": {
    "overall_score": 85,
    "status": "strong",
    "overall_feedback": "Candidate shows excellent alignment with 8 out of 10 key requirements.",
    "matched_mandatory_requirements": 6,
    "total_mandatory_requirements": 7
  },
  "requirement_evaluations": [
    {
      "requirement_name": "React",
      "score": 90,
      "status": "strong",
      "feedback": "The candidate shows a substantial 5-year background in React, indicating they have direct hands-on experience with this specific skill. Their resume shows implementation work during their role as Senior Developer at TechCorp: 'Built responsive web applications using React and Redux, serving 100K+ users' (Technical implementation). This represents strong alignment with the job requirements."
    }
  ],
  "summary": {
    "strengths": [
      "Strong React and JavaScript foundation with 5+ years experience",
      "Proven track record in full-stack development across multiple companies"
    ],
    "gaps": [
      "Limited cloud infrastructure experience (AWS/Azure)",
      "No evidence of team leadership experience"
    ]
  },
  "recruiter_recommendations": {
    "interview_strategy": [
      "Deep dive into React architecture decisions and state management patterns",
      "Explore specific examples of handling performance optimization in large applications"
    ],
    "other_options": [
      "Consider for mid-level role if senior requirements not fully met",
      "Strong candidate for frontend-focused position"
    ]
  },
  "metadata": {
    "analysis_timestamp": "2024-01-15T10:30:00Z",
    "algorithm_version": "pdf-v1.0",
    "total_processing_time_ms": 3500
  }
}
```

## Scoring Logic

### Overall Score Calculation
```
Overall Score = (Mandatory Score × 0.8) + (Optional Score × 0.2)
```

### Status Thresholds

#### Mandatory Requirements
- **Strong**: ≥80%
- **Adequate**: ≥60%  
- **Weak**: ≥30%
- **Missing**: <30%

#### Optional Requirements  
- **Strong**: ≥70%
- **Adequate**: ≥40%
- **Weak**: ≥20%
- **Missing**: <20%

### Evidence Quality Scoring

#### Technical Skills
```
Base Score = (Proficiency Alignment × 70%) + (Match Quality × 30%)
Final Score = Base Score + Mandatory Bonus (if applicable)
```

#### Soft Skills
```
Score = 75-100% (exact match) or 50-75% (related match)
Based on evidence quality and professional context
```

## Evidence Extraction Patterns

### Leadership Evidence
- Pattern: `/(led|managed|supervised|directed)\s+(?:team|group)\s+of\s+(\d+)/i`
- Example: "Led team of 8 developers" → Team leadership with size context

### Technical Implementation  
- Pattern: `/(?:built|developed|implemented|created|designed|architected)\s+.*?(?:using|with|in)\s+([A-Z][a-zA-Z]+)/i`
- Example: "Built microservices using Docker" → Hands-on technical work

### Experience Duration
- Pattern: `/(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp)\s*(?:with|in|using)?/i`
- Example: "5 years experience with Python" → Quantified experience

### Scale & Impact
- Pattern: `/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s+(?:users|customers|transactions|requests|records)/i`
- Example: "Serving 100K+ users" → System scale context

### Performance Metrics
- Pattern: `/(?:increased|improved|reduced|achieved|delivered)\s+.*?(?:by\s+)?(\d+%|\$[\d,]+)/i`
- Example: "Reduced load time by 40%" → Quantified achievement

## Skill Relationship Hierarchy

### Parent-Child Relationships
```
Python → Django, Flask, FastAPI
JavaScript → React, Vue, Angular, Node.js
Cloud → AWS, Azure, GCP
```

### Confidence Scoring
- **Exact Match**: 1.0 confidence
- **Alias Match**: 0.95 confidence (React.js → React)
- **Child Skill**: 0.8 confidence (Django → Python knowledge)
- **Parent Skill**: 0.85 confidence (Python → Django capability)
- **Sibling Skills**: 0.7 confidence (React ↔ Vue)

## Enhanced Recruiter Feedback

### Evidence-Based Insights
The API provides specific quotes from the resume with company and role attribution:

```
"The candidate shows a substantial 5-year background in React. Their resume shows 
implementation work during their role as Senior Developer at TechCorp: 'Built 
responsive web applications using React and Redux, serving 100K+ users' (Technical 
implementation and scale context)."
```

### Gap Analysis
For missing requirements:
```
"No evidence of AWS experience was found across the candidate's resume, including 
their work history, listed skills, or project descriptions. This creates a 
significant gap since this skill is essential for the role."
```

### Role Inference
The API analyzes the candidate's background to infer:
- **Primary Role**: Frontend, Backend, Full-stack, DevOps, etc.
- **Seniority Level**: Junior, Mid-level, Senior, Staff/Principal
- **Career Focus**: Technical areas of specialization
- **Leadership Indicators**: Team management experience
- **Domain Expertise**: Industry experience (fintech, healthcare, etc.)

## Performance Characteristics

### Processing Time
- **Typical Range**: 2-5 seconds
- **PDF Text Extraction**: ~500ms
- **Skill Matching**: ~1-3 seconds  
- **AI Feedback Generation**: ~1-2 seconds

### Caching Strategy
- **Skill Embeddings**: Cached in Supabase `skill_embeddings` table
- **Cache Hit Rate**: ~80% for common skills
- **Performance Improvement**: 60-80% faster for cached skills

## Error Handling

### Common Error Responses

#### Invalid Input
```json
{
  "error": "Invalid candidate data. Must contain 'main' and 'skills' array.",
  "status": 400
}
```

#### Missing PDF Text
```json
{
  "error": "PDF text content is required for analysis.",
  "status": 400
}
```

#### OpenAI API Error
```json
{
  "error": "PDF analysis failed",
  "details": "OpenAI API error: 429",
  "status": 500
}
```

## Integration Notes

### Prerequisites
- OpenAI API key configured in Supabase Edge Function environment
- Supabase client with access to `skill_embeddings` table
- PDF text extraction pipeline (typically via `parse-resume-skill` API)

### Usage Flow
1. **PDF Upload** → Extract text via `parse-resume-skill` API
2. **Text Processing** → Send extracted text to match-analysis-pdf
3. **Analysis** → Receive detailed scoring and feedback
4. **UI Display** → Present results to recruiter with evidence

### Performance Optimization
- Use PDF text caching to avoid re-extraction
- Implement skill embedding pre-warming for common skills
- Consider batch processing for multiple candidates
- Monitor OpenAI API usage and implement rate limiting

## Security Considerations

### Data Privacy
- PDF text is processed in-memory only
- No permanent storage of candidate resume content  
- Skills embeddings are anonymized (no personal information)

### API Security
- CORS headers configured for web client access
- Supabase RLS policies control data access
- OpenAI API key secured in environment variables

## Monitoring & Analytics

### Key Metrics
- **Processing Time**: Monitor for performance degradation
- **Match Accuracy**: Track recruiter feedback on analysis quality
- **API Errors**: OpenAI rate limits and embedding failures
- **Cache Hit Rate**: Optimize for common skill combinations

### Logging
- Request/response times for performance analysis
- Skill matching confidence scores for accuracy tuning
- Error patterns for reliability improvements

## Version History

### pdf-v1.0 (Current)
- Initial PDF resume analysis implementation
- Two-tier scoring with mandatory/optional requirements
- Enhanced evidence extraction with company attribution
- Semantic skill matching with OpenAI embeddings
- Intelligent recruiter feedback generation
- Role inference and candidate profiling

## Related APIs

- **parse-resume-skill**: PDF text extraction and skill parsing
- **match-analysis-linkedin**: LinkedIn profile analysis (complementary)
- **job-details-extractor**: Job requirement extraction
- **email-builder**: Follow-up communication generation
# Match Analysis LinkedIn API

## Overview
The Match Analysis LinkedIn API evaluates how well a candidate's LinkedIn profile matches specific job requirements. This API specializes in processing structured LinkedIn data, extracting detailed professional experience, and providing evidence-based insights with company attribution.

## Algorithm Version
**linkedin-v1.0** - LinkedIn Profile Analysis with Enhanced Evidence Extraction

## Key Features

### 🎯 Two-Tier Scoring System
- **Mandatory Requirements**: 80% weight in overall score with stricter thresholds
- **Optional Requirements**: 20% weight with more lenient evaluation
- Ensures critical skills are prioritized over nice-to-have qualifications

### 💼 LinkedIn Profile Processing
- **Structured Data Extraction**: Processes LinkedIn's JSON format directly
- **Experience Analysis**: Detailed job history with company context
- **Skills Section Integration**: Combines explicit skills with experience evidence
- **Professional Summary**: Analyzes About section for additional insights

### 🔍 Enhanced Evidence Extraction with Company Attribution
- **Company-Specific Context**: Links skills to specific employers and roles
- **Role-Based Evidence**: Connects technical skills to job titles and responsibilities
- **Experience Depth**: Calculates years of experience per skill across roles
- **Professional Progression**: Tracks career advancement and skill development

### 🧠 Semantic Skill Matching
- **OpenAI Embeddings**: Uses `text-embedding-3-small` for skill similarity
- **Skill Hierarchy**: Understands technology relationships and frameworks
- **Professional Context**: Weighs skills based on professional usage vs. mentions
- **Evidence Quality**: Differentiates between listed skills and demonstrated experience

### 💡 Intelligent Recruiter Feedback
- **Evidence-Based Insights**: Provides specific LinkedIn quotes with company attribution
- **Professional Context**: Explains how skills were used in specific roles
- **Career Analysis**: Infers role fit, seniority level, and technical depth
- **Strategic Recommendations**: Suggests interview focus areas and role adjustments

## API Endpoint

```
POST https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-linkedin
```

## Request Format

```json
{
  "candidate": {
    "main": {
      "first_name": "Sarah",
      "last_name": "Johnson"
    },
    "skills": [
      {
        "name": "React",
        "type": "technical_skill", 
        "yoe": 4,
        "proficiency_level": "advanced"
      }
    ],
    "years_of_experience": 6,
    "raw_linkedin_profile": {
      "firstName": "Sarah",
      "lastName": "Johnson",
      "headline": "Senior Frontend Developer",
      "about": "Passionate frontend developer with 6 years of experience building scalable React applications...",
      "experiences": [
        {
          "title": "Senior Frontend Developer",
          "subtitle": "TechCorp · Full-time",
          "caption": "2 yrs 3 mos",
          "description": "Led frontend architecture for React-based dashboard serving 50K+ users. Implemented Redux state management and optimized performance resulting in 40% faster load times.",
          "subComponents": [
            {
              "description": [
                {
                  "type": "textComponent",
                  "text": "Led frontend architecture for React-based dashboard serving 50K+ users. Implemented Redux state management and optimized performance resulting in 40% faster load times."
                }
              ]
            }
          ]
        }
      ],
      "skills": [
        {
          "title": "React",
          "subComponents": [
            {
              "description": [
                {
                  "type": "insightComponent",
                  "text": "Frontend Developer at TechCorp"
                }
              ]
            }
          ]
        }
      ]
    }
  },
  "job": {
    "attributes": {
      "title": "Senior React Developer"
    },
    "requirements": [
      {
        "requirement": "React",
        "type": "technical_skill",
        "is_mandatory": true,
        "proficiency_level": "advanced",
        "weight": 9
      }
    ]
  }
}
```

## Response Format

```json
{
  "match_analysis": {
    "overall_score": 92,
    "status": "strong", 
    "overall_feedback": "Candidate demonstrates excellent React expertise with strong technical leadership background.",
    "matched_mandatory_requirements": 8,
    "total_mandatory_requirements": 9
  },
  "requirement_evaluations": [
    {
      "requirement_name": "React",
      "score": 95,
      "status": "strong",
      "feedback": "The candidate shows a substantial 4-year background in React, indicating they have direct hands-on experience with this specific skill. Their profile shows leadership responsibility during Senior Frontend Developer at TechCorp, specifically: 'Led frontend architecture for React-based dashboard serving 50K+ users. Implemented Redux state management and optimized performance...' This demonstrates practical application rather than just theoretical knowledge and shows Technical implementation and scale context."
    }
  ],
  "summary": {
    "strengths": [
      "Strong React expertise with team leadership experience",
      "Proven track record in performance optimization and scalable architecture",
      "Clear career progression in frontend development"
    ],
    "gaps": [
      "Limited backend technology exposure", 
      "No mention of testing frameworks or CI/CD experience"
    ]
  },
  "recruiter_recommendations": {
    "interview_strategy": [
      "Deep dive into React architecture decisions and state management patterns",
      "Explore specific performance optimization techniques and results",
      "Assess leadership style and team collaboration approaches"
    ],
    "other_options": [
      "Excellent fit for senior frontend role",
      "Consider for technical lead position given leadership experience",
      "Strong candidate for React specialist roles"
    ]
  },
  "metadata": {
    "analysis_timestamp": "2024-01-15T10:30:00Z",
    "algorithm_version": "linkedin-v1.0",
    "total_processing_time_ms": 2800
  }
}
```

## LinkedIn Data Processing

### Experience Extraction
The API processes LinkedIn experience data with enhanced context:

#### Job Duration Calculation
```javascript
// Extracts years from LinkedIn caption format
"2 yrs 3 mos" → 2.25 years
"1 yr" → 1 year
"6 mos" → 0.5 years
```

#### Company Context Extraction
```javascript
// Parses subtitle for company information
"Senior Developer · TechCorp · Full-time" → Company: "TechCorp"
"Frontend Engineer · Startup Inc" → Company: "Startup Inc"
```

#### Description Analysis
- **Structured Text**: Processes LinkedIn's `textComponent` descriptions
- **Skill Mentions**: Identifies technologies and methodologies
- **Impact Metrics**: Extracts quantifiable achievements
- **Technical Depth**: Assesses implementation vs. management work

### Skills Section Integration
```javascript
// Combines explicit skills with experience evidence
{
  "title": "React",
  "subComponents": [
    {
      "description": [
        {
          "type": "insightComponent", 
          "text": "Frontend Developer at TechCorp"  // Company attribution
        }
      ]
    }
  ]
}
```

### Professional Summary Analysis
- **About Section**: Scans for additional technical keywords
- **Career Focus**: Identifies specialization areas
- **Professional Goals**: Understands career direction
- **Technical Depth**: Supplements experience-based skill extraction

## Evidence Extraction Patterns

### Leadership Indicators
- **Pattern**: `/(led|managed|supervised|directed)\s+(?:team|group)\s+of\s+(\d+)/i`
- **Example**: "Led team of 5 frontend developers" → Leadership evidence with team size
- **Context**: Links to specific company and role

### Technical Implementation
- **Pattern**: `/(built|developed|implemented|created|designed|architected)/i`
- **Example**: "Built scalable React components" → Hands-on technical work
- **Attribution**: "during their role as Senior Developer at TechCorp"

### Scale & Impact
- **Pattern**: `/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s+(?:users|customers|transactions)/i`
- **Example**: "serving 50K+ users" → System scale context
- **Company Context**: Linked to specific employer and timeframe

### Performance Metrics
- **Pattern**: `/(increased|improved|reduced|achieved|delivered)\s+.*?(\d+%|\$[\d,]+)/i`
- **Example**: "reduced load time by 40%" → Quantified achievement
- **Professional Setting**: Attributed to specific role and company

## Skill Relationship Understanding

### Technology Hierarchies
```
Frontend Framework Relationships:
JavaScript → React, Vue, Angular
React → Next.js, Gatsby, React Native
TypeScript → Angular, React (with TS)

Backend Relationships:
Python → Django, Flask, FastAPI
Node.js → Express, NestJS, Fastify
Java → Spring, Hibernate

Cloud Relationships:
Cloud → AWS, Azure, GCP
AWS → S3, EC2, Lambda, RDS
```

### Confidence Scoring
- **Exact Match**: 1.0 (React experience for React requirement)
- **Framework/Parent**: 0.85 (JavaScript exp. for React req.)  
- **Child/Specialized**: 0.8 (Next.js exp. for React req.)
- **Related Technology**: 0.7 (Vue exp. for React req.)
- **Semantic Similarity**: 0.6-0.8 (based on embedding similarity)

## Enhanced Recruiter Feedback

### Evidence-Based Insights
```
"The candidate shows a substantial 4-year background in React. Their LinkedIn profile 
shows this during their role as Senior Frontend Developer at TechCorp: 'Led frontend 
architecture for React-based dashboard serving 50K+ users. Implemented Redux state 
management and optimized performance resulting in 40% faster load times' (Technical 
implementation and scale context)."
```

### Company Attribution Benefits
- **Credibility**: Specific company and role references increase trust
- **Context**: Understands how skills were applied professionally  
- **Depth**: Differentiates between mentioning vs. demonstrating skills
- **Progression**: Shows skill development across different roles

### Professional Role Inference
The API analyzes LinkedIn data to infer:

#### Primary Role Detection
```javascript
const roleSignals = {
  'frontend': ['react', 'javascript', 'vue', 'angular', 'html', 'css'],
  'backend': ['python', 'java', 'node.js', 'api', 'database', 'sql'],
  'fullstack': /* combination of frontend + backend */,
  'devops': ['aws', 'docker', 'kubernetes', 'ci/cd', 'azure'],
  'data': ['data science', 'machine learning', 'analytics', 'sql'],
  'mobile': ['react native', 'ios', 'android', 'mobile'],
  'management': ['leadership', 'team management', 'project management']
};
```

#### Seniority Assessment
- **Years of Experience**: Total career duration
- **Role Titles**: Senior, Lead, Principal, Architect indicators
- **Leadership Evidence**: Team management and technical leadership
- **Technical Depth**: Breadth and depth of technical skills

#### Career Progression Analysis
- **Individual Contributor**: Technical specialist track
- **Management Track**: Technical background with leadership responsibilities
- **Senior IC**: High-level technical contributor without direct management

## Scoring Logic

### Overall Score Calculation
```
Overall Score = (Mandatory Score × 0.8) + (Optional Score × 0.2)
```

### Status Thresholds

#### For Mandatory Requirements
- **Strong**: ≥80% (high confidence in capability)
- **Adequate**: ≥60% (meets basic requirement)
- **Weak**: ≥30% (some evidence but concerning gaps)
- **Missing**: <30% (insufficient evidence)

#### For Optional Requirements  
- **Strong**: ≥70% (valuable addition to profile)
- **Adequate**: ≥40% (nice-to-have present)
- **Weak**: ≥20% (minimal evidence)
- **Missing**: <20% (not present)

### Soft Skills Evaluation
```javascript
if (skillType === 'soft_skill') {
  if (matchType === 'exact') {
    score = 75 + (confidence × 25); // 75-100% range
  } else {
    score = 50 + (confidence × 25); // 50-75% range  
  }
}
```

### Technical Skills Evaluation
```javascript
// Proficiency alignment (0-70%) + Match quality (0-30%)
const proficiencyScore = (candidateLevel / requiredLevel) × 70;
const qualityBonus = bestMatch.confidence × 30;
const finalScore = proficiencyScore + qualityBonus;
```

## Performance Characteristics

### Processing Time
- **Typical Range**: 2-4 seconds
- **Profile Parsing**: ~300-500ms
- **Skill Extraction**: ~500ms-1s
- **Semantic Matching**: ~1-2s
- **AI Feedback**: ~1-2s

### Optimization Features
- **Skill Embedding Caching**: 60-80% performance improvement for common skills
- **Parallel Processing**: Concurrent requirement evaluation
- **Efficient Profile Parsing**: Optimized LinkedIn JSON traversal

## Error Handling

### Invalid LinkedIn Profile
```json
{
  "error": "Invalid candidate data. Must contain 'main' and 'skills' array.",
  "status": 400
}
```

### Missing LinkedIn Data
```json
{
  "error": "LinkedIn profile data is required for analysis.",
  "status": 400  
}
```

### API Errors
```json
{
  "error": "Enhanced analysis v3 failed",
  "details": "OpenAI API error: 429",
  "status": 500
}
```

## Integration Patterns

### Typical Usage Flow
1. **LinkedIn Data** → Obtained via Apify LinkedIn scraper
2. **Profile Processing** → Send to match-analysis-linkedin API
3. **Analysis Results** → Display with evidence and company attribution
4. **Recruiter Review** → Use insights for interview strategy

### Data Requirements
- **Structured LinkedIn JSON**: Complete profile with experiences and skills
- **Job Requirements**: Well-defined mandatory vs. optional requirements
- **Skills Classification**: Proper categorization of requirement types

## Security & Privacy

### Data Handling
- **In-Memory Processing**: LinkedIn data not permanently stored
- **Anonymized Caching**: Only skill embeddings cached (no personal data)
- **CORS Protection**: Configured for authorized client access

### Privacy Compliance
- **No Data Retention**: Profile data processed and discarded
- **Skill Anonymization**: Embeddings don't contain personal information
- **Secure API Keys**: OpenAI credentials secured in environment

## Monitoring & Analytics

### Key Performance Indicators
- **Analysis Accuracy**: Recruiter feedback on match quality
- **Processing Speed**: Response time optimization
- **Cache Efficiency**: Embedding cache hit rates
- **Error Rates**: API reliability metrics

### Quality Metrics
- **Evidence Quality**: Relevance of extracted LinkedIn quotes
- **Role Inference Accuracy**: Correctness of candidate profiling  
- **Feedback Usefulness**: Recruiter satisfaction with insights

## Version History

### linkedin-v1.0 (Current)
- Enhanced LinkedIn profile processing with company attribution
- Two-tier scoring system for mandatory vs. optional requirements
- Semantic skill matching with OpenAI embeddings
- Professional role inference and career progression analysis
- Evidence-based recruiter feedback with specific LinkedIn quotes
- Performance optimizations with skill embedding caching

## Related APIs

- **match-analysis-pdf**: PDF resume analysis (complementary)
- **parse-linkedin-skill**: LinkedIn skill extraction and normalization  
- **linkedin-profile-reducer**: Raw LinkedIn data preprocessing
- **job-details-extractor**: Job requirement structuring
- **email-builder**: Candidate outreach based on analysis results

## Best Practices

### For Optimal Results
- **Complete LinkedIn Profiles**: Ensure experiences and skills sections are populated
- **Detailed Job Descriptions**: Include specific technical requirements and proficiency levels
- **Requirement Classification**: Properly categorize mandatory vs. optional skills
- **Weight Assignment**: Use meaningful requirement weights (1-10 scale)

### Interview Strategy Integration
- **Evidence Validation**: Use specific LinkedIn quotes to probe experience depth
- **Gap Exploration**: Focus interviews on areas with weak evidence
- **Strength Amplification**: Deep dive into areas showing strong evidence
- **Role Fit Assessment**: Validate inferred role alignment during interviews
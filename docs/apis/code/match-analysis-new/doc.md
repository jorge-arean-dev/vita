# Match Analysis System Documentation

## Overview

The Match Analysis system evaluates how well a candidate fits a specific job by comparing their skills, experience, and qualifications against job requirements. The system has been redesigned with a unified architecture that provides consistent, fair, and intelligent matching across different data sources.

## Core Philosophy

### Fair Scoring Approach
The system uses an **additive scoring model** where candidates are never penalized for missing optional requirements. Your base score comes from mandatory requirements, and optional requirements can only boost your score higher - they never drag you down.

### Data Source Priority
The system prioritizes **structured data** (organized skill lists with clear proficiency levels) over **raw text analysis**. Raw data like resume text or LinkedIn profiles serves as a supplementary source to catch skills that might have been missed during initial parsing.

### Intelligent Skill Recognition
The system understands that skills exist in hierarchies and relationships. If you have Django experience, it knows you also have Python knowledge. If you're AWS certified, it understands you have cloud computing skills. This prevents unfair scoring when job requirements use different terminology than your resume.

## System Architecture

### Three API Endpoints

**LinkedIn Analysis API** - Processes LinkedIn profile JSON data to extract skills, work history, and experience. It analyzes job descriptions and career progression to estimate proficiency levels for different technologies.

**PDF Resume Analysis API** - Extracts information from resume text using language processing. It identifies technical skills, certifications, soft skills, and attempts to determine years of experience from job history.

**Fallback Analysis API** - Handles existing candidates already stored in the database. It can supplement database information with any stored raw data (LinkedIn profiles or resume text) to provide comprehensive analysis.

### Shared Intelligence Engine

All three APIs use the same underlying intelligence, ensuring consistent scoring regardless of which data source is used. This shared engine includes:

**Core Matching Engine** - Orchestrates the entire analysis process, from initial skill matching through final score calculation.

**Skill Registry** - Contains a comprehensive database of software engineering skills, their relationships, common aliases, and hierarchical connections.

**Skill Matcher** - Performs the actual comparison between job requirements and candidate skills, using different strategies based on skill type.

**Proficiency Calculator** - Converts years of experience into standardized proficiency levels (beginner, advanced, expert).

**Score Calculator** - Implements the fair scoring system with additive bonuses for optional requirements.

## How Matching Works

### Step 1: Data Processing
The system first converts incoming data (LinkedIn JSON, resume text, or database records) into a standardized format. This ensures all three APIs work with the same data structure internally.

### Step 2: Skill Identification
Skills are extracted and categorized into three types:
- **Technical Skills**: Programming languages, frameworks, tools (e.g., Python, React, Docker)
- **Certifications**: Official credentials and certifications (e.g., AWS Certified, PMP)
- **Soft Skills**: Interpersonal and management abilities (e.g., Leadership, Communication)

### Step 3: Skill Matching
For each job requirement, the system searches for matches using multiple strategies:

**Exact Matching** - Direct skill name matches or known aliases (React = ReactJS = React.js)

**Hierarchical Matching** - Understanding parent-child relationships (Django experience counts toward Python requirements, but not vice versa)

**Semantic Matching** - Using AI to find related skills when exact matches aren't found

### Step 4: Type-Specific Scoring

**Technical Skills** use proficiency-based scoring:
- Compares required experience level with candidate's experience
- Awards bonus points for overqualification
- Applies penalties for underqualification
- Considers skill hierarchy relationships

**Certifications** use binary scoring:
- 100 points if the candidate has the certification
- 0 points if they don't have it
- No partial credit, but handles certification variations and aliases

**Soft Skills** use evidence-based scoring:
- Looks for multiple pieces of evidence across resume and profiles
- Counts explicit mentions, action words, job titles, and context
- More evidence sources = higher confidence and score
- Scores based on strength of evidence (60-100 points)

### Step 5: Final Score Calculation

The final score calculation now includes both skills-based analysis and seniority level matching:

#### **Primary Skills-Based Score (0-100 points)**

**Mandatory Requirements** form the base score (0-100 points)
- These are must-have skills for the job
- Includes all skill types: technical skills, soft skills, certifications, and role-based skills
- Scored by averaging all mandatory requirement scores
- This becomes your foundation score

**Optional Requirements** provide bonus points (0-20 additional points)
- These are nice-to-have skills that make you stand out
- Can only add to your score, never subtract
- Based on how many optional requirements you meet well

**Skills-Based Score** = Mandatory Score + Optional Bonus (capped at 100)

#### **Seniority Level Adjustment**

**Seniority Analysis** (when job specifies seniority level):
- Candidate's seniority level is detected from job titles, experience, and career progression
- Compared against job's required seniority level (junior, mid, senior, lead, executive)
- Generates a seniority match score (0.0 - 1.0)

**Score Adjustment Formula** (applied when seniority score < 0.8):
```
finalScore = skillsScore × (1 - ((1 - seniorityScore) × 0.3))
```

**Seniority Match Scores:**
- **Perfect match or overqualified**: 1.0 (no penalty)
- **One level below**: 0.6 (e.g., Mid candidate for Senior role)
- **Two+ levels below**: 0.3 (e.g., Junior candidate for Senior role)

**Final Score** = Skills-Based Score (adjusted by seniority penalty if applicable)

### Step 6: Score Categorization
Final scores are categorized into four clear tiers:
- **Fit** (80-100): Meets requirements, ready for role
- **Developing** (60-79): Has skills but below required expert level
- **Weak** (30-59): Some relevant skills but significant gaps
- **Missing** (0-29): Poor fit with major skill gaps

**Note**: Updated 2025-08-27 - Changed from "Adequate" to "Developing" and "Strong" to "Fit" for clearer requirement assessment. Only "Fit" matches count as meeting mandatory requirements.

## Key Intelligence Features

### Skill Relationship Understanding
The system knows that:
- Django developers have Python skills
- React developers understand JavaScript
- AWS certified professionals know cloud computing
- Spring Boot experience implies Java knowledge
- Leadership roles demonstrate management capabilities

### Alias Recognition
The system recognizes that these are the same:
- JavaScript = JS = ECMAScript
- PostgreSQL = Postgres = PostGIS
- React = ReactJS = React.js
- AWS Solutions Architect = SAA-C03 = AWS SA

### Gap Filling from Raw Data
When structured skills data is incomplete, the system analyzes raw text to find:
- Skills mentioned in job descriptions but not listed separately
- Years of experience embedded in work history
- Soft skills demonstrated through action words and achievements
- Certifications mentioned in narrative form

### Multi-Source Evidence
For soft skills especially, the system looks for evidence from multiple sources:
- Explicit skill listings
- Job titles (Manager, Lead, Coordinator)
- Action verbs (led, managed, collaborated, presented)
- Project descriptions showing skill application
- Multiple mentions across different contexts

## Quality Assurance

### Consistency Across APIs
All three APIs use identical scoring logic, ensuring a candidate gets the same score regardless of whether their data comes from LinkedIn, a resume, or an existing database record.

### Confidence Tracking
Every match includes a confidence score indicating how certain the system is about the connection. This helps distinguish between definitive matches and educated guesses.

### Evidence Documentation
All scoring decisions include human-readable explanations and evidence trails, making it easy to understand why a candidate received their score.

### Fallback Protection
If AI-powered components fail or are unavailable, the system gracefully falls back to rule-based matching, ensuring analysis can always complete.

## Benefits for Recruiters

### Fair Candidate Evaluation
Candidates aren't penalized for missing nice-to-have skills, leading to more equitable comparisons.

### Comprehensive Skill Recognition
The system catches skills that might be missed by simple keyword matching, including related technologies and different terminology.

### Consistent Results
The same candidate evaluated against the same job will always receive the same score, regardless of data source.

### Clear Explanations
Every score comes with clear explanations of what matched, what didn't, and why, making it easy to understand and trust the results.

### Time Savings
Automated analysis handles the initial screening, allowing recruiters to focus on high-potential candidates rather than manual resume review.

## Technical Implementation Details

### Version Information
- LinkedIn API: v2.0-unified
- PDF API: v2.0-unified  
- Fallback API: v2.0-unified
- Core Engine: Shared across all APIs

### Performance Optimization
- Structured data processed first for speed
- Raw data analysis only when needed for gap-filling
- Skill registry optimized for fast lookups
- Confidence-based early termination for obvious matches

### Extensibility
- Easy to add new skill types beyond technical/certification/soft skills
- Skill registry can be expanded with new technologies and relationships
- Scoring algorithms can be tuned without affecting API interfaces
- Ready for multi-industry expansion with industry-specific skill databases

This unified approach ensures every candidate gets a fair, comprehensive, and consistent evaluation while providing recruiters with the insights they need to make informed hiring decisions.

## API Selection Logic

### User Flow → API Routing Decision Matrix

The system intelligently routes analysis requests to the appropriate API based on user flow and available data sources.

#### **New Candidate Flows:**
- **New candidate + LinkedIn profile option** → `match-analysis-linkedin-v2`
- **New candidate + PDF resume upload** → `match-analysis-pdf-v2`
- **New candidate + manual entry (no LinkedIn/PDF)** → `match-analysis-fallback-v2`

#### **Existing Candidate Flows:**
- **Existing candidate re-analysis** → `match-analysis-fallback-v2`
- **Bulk candidate processing** → `match-analysis-fallback-v2`
- **Candidate with stored LinkedIn data** → `match-analysis-fallback-v2`

### Detailed Routing Logic

| User Action | Data Available | API Endpoint | Processing Strategy |
|-------------|----------------|--------------|-------------------|
| Upload LinkedIn profile | `raw_linkedin_profile` + `linkedin_url` | **linkedin-v2** | GPT-4o parsing + skill extraction |
| Upload PDF resume | `raw_pdf_profile_text` | **pdf-v2** | Text parsing + skill extraction |
| Select existing candidate | `candidate_id` + stored skills | **fallback-v2** | Database query + stored data |
| Manual candidate entry | Basic info only | **fallback-v2** | Minimal data processing |
| Re-analyze candidate | Mixed/cached data | **fallback-v2** | Hybrid approach |

### Data Source Priority

**linkedin-v2**: Fresh LinkedIn data (highest fidelity)
- Rich social profile information
- Current employment details
- Endorsed skills and connections

**pdf-v2**: Resume document analysis
- Structured career history
- Detailed project descriptions
- Formatted skill presentations

**fallback-v2**: Database/legacy data (most flexible)
- Previously processed candidates
- Incomplete data scenarios
- Bulk operations
- **Existing candidates without raw LinkedIn or PDF data**

### Special Case: Existing Candidate with No Raw Data

For **existing candidates without LinkedIn or PDF raw data**, the system uses `match-analysis-fallback-v2`:

**Input Structure:**
```json
{
  "candidate": {
    "main": {
      "first_name": "John",
      "last_name": "Doe", 
      "email": "john@email.com"
    },
    "skills": [
      {"name": "JavaScript", "yoe": 3, "proficiency_level": "advanced"},
      {"name": "React", "yoe": 2, "proficiency_level": "beginner"}
    ],
    "years_of_experience": 5,
    "raw_linkedin_profile": null,    // ❌ No LinkedIn data
    "raw_pdf_profile_text": null     // ❌ No PDF data
  },
  "job": { ... }
}
```

**Processing Strategy:**
1. Uses structured skills data from database (previously entered/extracted)
2. Applies core matching engine with skill registry and proficiency calculations
3. Generates full narrative outputs despite limited raw data
4. Relies on stored candidate information (years of experience, skill levels)

The fallback API is designed to work with **minimal data requirements** and can generate comprehensive match analysis with just basic candidate info and structured skills list.

## Shared Module Architecture (`supabase/functions/_shared/`)

The unified match analysis system is built on six core TypeScript modules that provide consistent intelligence across all three APIs. Each module has a specific responsibility in the analysis pipeline:

### **core-matching-engine.ts**
**Primary Orchestrator** - Coordinates the entire analysis workflow from start to finish.

**Key Responsibilities:**
- Orchestrates multi-step matching process (structured skills → gap analysis → supplementary extraction)
- Processes different data sources (LinkedIn JSON, PDF text, database records) into unified format
- Manages raw data fallback when structured skills have gaps
- Combines results from all matching strategies into final analysis
- Exports main `analyzeCandidate()` function used by all APIs

**Data Flow:**
1. Converts incoming data to standard `Candidate` and `Job` interfaces
2. Runs primary matching with structured skills via `skill-matcher.ts`
3. Identifies gaps where scores < 70%
4. Extracts supplementary skills from raw text for gap-filling
5. Re-matches gap requirements with supplementary skills
6. Merges results and calculates final scores via `score-calculator.ts`

### **skill-matcher.ts**
**Core Matching Logic** - Performs the actual skill-to-requirement comparisons.

**Key Responsibilities:**
- Implements type-specific matching strategies (technical skills, certifications, soft skills)
- Handles skill relationships and hierarchies via `skill-registry.ts`
- Applies **proficiency-focused scoring** with 10% skill match + 90% proficiency match weighting
- Manages semantic fallback for unmatched requirements
- Extracts supplementary skills from raw text when needed

**Matching Strategies:**
- **Technical Skills**: Proficiency-based with hierarchy support (Django → Python)
- **Certifications**: Binary matching with alias recognition  
- **Soft Skills**: Evidence-based scoring from multiple text sources

**Updated 2025-08-27**: Changed from 70-30 to 10-90 weighting for proficiency-focused analysis.

### **proficiency-calculator.ts**
**Experience Level Assessment** - Converts years of experience to standardized proficiency levels.

**Key Responsibilities:**
- Maps years of experience to proficiency levels (Beginner/Advanced/Expert)
- Calculates proficiency match scores between candidate and job requirements
- Applies penalties for proficiency gaps with realistic scoring
- Handles explicit proficiency requirements vs. years-based requirements

**Proficiency Mapping:**
- **Beginner**: 0-2 years experience
- **Advanced**: 3-5 years experience  
- **Expert**: 6+ years experience

**Gap Penalties (Updated 2025-08-27):**
- One level below (Advanced vs Expert): 65% score
- Two levels below (Beginner vs Expert): 35% score
- Prevents inflated 100+ scores for unqualified candidates

### **score-calculator.ts**
**Final Score Computation** - Implements the additive scoring system and categorization.

**Key Responsibilities:**
- Calculates mandatory requirement scores (base 0-100)
- Calculates optional requirement bonus (0-20 points)
- Applies additive scoring where optional requirements only boost scores
- Categorizes final scores into 4-tier system
- Generates human-readable score explanations

**Score Categories (Updated 2025-08-27):**
- **Fit** (80-100%): Meets requirements, ready for role
- **Developing** (60-79%): Has skills but below required expert level
- **Weak** (30-59%): Limited skill present, significant development needed
- **Missing** (0-29%): No evidence of skill, critical gap

**Note**: Changed from "Adequate" to "Developing" and "Strong" to "Fit" for clearer requirement assessment.

### **narrative-generator.ts**
**Human-Readable Output** - Generates recruiter insights, feedback, and recommendations.

**Key Responsibilities:**
- Converts technical scores into professional recruiting language
- Generates strength/gap summaries with varied templates
- Creates interview strategies based on candidate profile
- Provides recruiter recommendations (hire/train/pass decisions)
- Focuses on proficiency-level comparisons for evidence-based feedback

**Output Structure:**
- **Summary**: Top strengths and critical gaps
- **Requirement Evaluations**: Individual feedback per requirement
- **Recruiter Recommendations**: Interview strategy and hiring advice
- **Overall Feedback**: Holistic candidate assessment

**Updated 2025-08-27**: Only "fit" matches count as strengths; "developing" skills are treated as gaps.

### **skill-registry.ts**
**Knowledge Database** - Contains comprehensive skill relationships and aliases.

**Key Responsibilities:**
- Maintains skill hierarchies (Django → Python, React → JavaScript)
- Handles skill aliases and variations (JS = JavaScript = ECMAScript)
- Provides parent-child skill relationships for intelligent matching
- Supports skill category classification (technical/certification/soft)
- Enables semantic understanding beyond keyword matching

**Relationship Examples:**
- Framework → Language: Django experience implies Python knowledge
- Certification → Domain: AWS Solutions Architect implies cloud computing skills
- Tool → Ecosystem: Docker experience suggests containerization knowledge

## Detailed Scoring Logic

### **Proficiency-Focused Scoring System**

The system prioritizes **proficiency match over skill match** with a **10% skill + 90% proficiency weighting** (updated 2025-08-27 from previous 70-30 split).

#### **Score Calculation Formula:**
```typescript
finalScore = (skillMatchScore * 0.1) + (proficiencyMatchScore * 0.9)
```

**Why This Weighting?**
- Ensures candidates must meet proficiency requirements, not just have the skill
- Prevents scenarios where "beginner React" gets 100% score for "expert React" requirement
- Aligns with expert-level job requirements in senior technical roles

#### **4-Tier Categorization System**

**Fit (80-100%): Requirements Met**
- Candidate meets or exceeds required proficiency level
- Only "Fit" matches count as "meeting" mandatory requirements
- Used for strength identification in narratives
- Indicates interview-ready competency

**Developing (60-79%): Below Required Level**  
- Candidate has the skill but below required proficiency level
- Previously called "Adequate" - changed for clearer assessment
- **Counts as gap/unmet requirement** for mandatory skills
- Suggests training/mentoring needed

**Weak (30-59%): Limited Proficiency**
- Some evidence of skill but significant development needed
- Counts as gap/unmet requirement
- Indicates substantial training investment required

**Missing (0-29%): No Evidence**
- No clear evidence of skill found
- Critical gap requiring attention
- May indicate need for different role or extensive training

#### **Mandatory vs Optional Requirements**

**Mandatory Requirements (Base Score 0-100%):**
- Must-have skills for the job
- Averaged to create foundation score
- **Only "Fit" (80%+) requirements count as "met"**
- Determines core competency assessment

**Optional Requirements (Bonus 0-20%):**
- Nice-to-have skills that differentiate candidates
- **Can only add to score, never subtract** (additive system)
- Based on percentage of optional requirements scored as "Fit"
- Maximum 20-point bonus to prevent score inflation

**Final Score Calculation:**
```typescript
finalScore = min(100, mandatoryScore + optionalBonus)
```

#### **Proficiency Gap Penalties**

When candidate proficiency is below job requirement:

**One Proficiency Level Gap** (e.g., Advanced vs Expert):
- Score: 65%
- Category: "Developing" 
- Interpretation: Has skill but needs advancement

**Two Proficiency Level Gap** (e.g., Beginner vs Expert):
- Score: 35%
- Category: "Weak"
- Interpretation: Significant skill development required

**Three+ Level Gap or Missing Skill**:
- Score: 0-29%
- Category: "Missing"
- Interpretation: Critical skill gap

#### **Evidence-Based Soft Skills Scoring**

For soft skills (leadership, communication, etc.):
- **Multiple Evidence Sources**: Job titles, action verbs, project descriptions
- **Context Analysis**: Looks for skill application in different scenarios  
- **Confidence Weighting**: More evidence = higher confidence = higher score
- **Range**: 60-100% based on evidence strength and frequency

This scoring system ensures realistic, proficiency-focused candidate assessment that aligns with expert-level job requirements while providing clear, actionable feedback for recruiters.

## Future Improvements

### Evidence Detailing Enhancement
**TODO**: Include detailed evidence justification for candidate skill scores. Currently, the system provides general feedback like "Good foundation in React with developing experience" but could be enhanced to show specific evidence that justifies the score, such as:
- Exact text snippets from resume/LinkedIn mentioning the skill
- Specific job titles or projects where the skill was applied
- Duration of skill usage extracted from work history
- Proficiency indicators found in raw data (e.g., "led team of 5", "architected system")

This would provide recruiters with concrete evidence to validate scoring decisions and make the matching process more transparent and trustworthy.

### Frontend Integration Points

**Component triggers:**
- `CandidateMatchAnalysis` → detects data type → calls appropriate API
- `JobMatchAnalyzer` → routes based on candidate source
- `BulkAnalysis` → defaults to fallback-v2 for efficiency

All APIs return the same rich narrative structure with `match_analysis`, `requirement_evaluations`, `summary`, and `recruiter_recommendations` for consistent frontend handling.
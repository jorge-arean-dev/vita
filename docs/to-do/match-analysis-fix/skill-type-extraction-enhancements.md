# Skill Type Extraction Enhancements

## Overview

Following the successful implementation of role-type skill extraction and matching, this document outlines opportunities to enhance extraction for other skill types to improve candidate-job matching accuracy.

## Current Status (January 2025)

### ✅ Recently Completed: Role Type Enhancement
- **What**: Added comprehensive role extraction from LinkedIn job titles and PDF work experience
- **Impact**: Candidates with "CTO" experience can now match "Tech Lead" requirements
- **Implementation**: Enhanced all 3 match analysis workflows (LinkedIn, PDF, Fallback)
- **Files Modified**: 
  - `skill-registry.ts` - Added role aliases and qualification mappings
  - `match-analysis-linkedin-v2/index.ts` - Added role extraction from experiences
  - All shared modules deployed with enhanced role matching

### Current Skill Type Status
1. **role** ✅ - Comprehensively enhanced with extraction & matching
2. **technical_skill** ✅ - Already well-handled with comprehensive extraction
3. **industry** 🟡 - Basic static matching, significant enhancement opportunity
4. **technology_domain** 🟡 - Uses aliases but no active extraction
5. **soft_skill** ⚪ - Evidence-based semantic matching (optimal approach)
6. **certification** ⚪ - Binary matching for explicit mentions (sufficient)

## Enhancement Priorities

### Priority 1: Industry Type Enhancement

#### Context: Why We Should Do This

**Current Limitation:**
- Industry matching relies only on static registry lookups
- Candidates working at "Goldman Sachs" won't match "Financial Services" requirements
- Rich company and industry context in profiles is unused
- Missing matches for requirements like "Healthcare experience" or "SaaS background"

**Business Impact:**
- **High matching accuracy improvement** for industry-specific roles
- **Reduced false negatives** for candidates with relevant industry experience
- **Better role targeting** for industry-focused positions (FinTech, HealthTech, etc.)

**Data Availability:**
- LinkedIn profiles include company industry classifications
- PDF resumes contain company names that can be mapped to industries
- Project descriptions often mention industry context

#### How We Should Do This

**Phase 1: LinkedIn Industry Extraction**
```typescript
// Extract from LinkedIn company data
const industrySkills: CandidateSkill[] = []

if (linkedInProfile.experiences) {
  for (const exp of linkedInProfile.experiences) {
    if (exp.company && exp.company.industry) {
      // Direct industry classification
      industrySkills.push({
        name: normalizeIndustryName(exp.company.industry),
        type: 'industry',
        yearsOfExperience: calculateYearsAtCompany(exp),
        proficiencyLevel: determineProficiencyFromTenure(exp),
        source: 'linkedin_company'
      })
    }
  }
}
```

**Phase 2: PDF Industry Inference**
```typescript
// Company name to industry mapping
const industryMappings = {
  'Goldman Sachs': 'Financial Services',
  'Google': 'Technology',
  'Kaiser Permanente': 'Healthcare',
  'Shopify': 'E-commerce',
  // Expandable mapping
}

// Extract and infer from company names in PDF
```

**Phase 3: Skill Registry Enhancement**
```typescript
// Add comprehensive industry registry
const industryRegistry = [
  {
    skill: 'Financial Services',
    aliases: ['Banking', 'Investment', 'Fintech', 'Finance'],
    companies: ['Goldman Sachs', 'JPMorgan', 'Stripe', 'Square'],
    keywords: ['trading', 'payments', 'banking', 'investment']
  },
  {
    skill: 'Healthcare',
    aliases: ['Medical', 'Pharmaceutical', 'Biotech', 'Health Tech'],
    companies: ['Kaiser Permanente', 'Pfizer', 'Johnson & Johnson'],
    keywords: ['medical', 'patient', 'clinical', 'healthcare']
  }
  // Continue building comprehensive mappings
]
```

**Implementation Files to Modify:**
1. **`skill-registry.ts`** - Add industry mappings and company-to-industry relationships
2. **`match-analysis-linkedin-v2/index.ts`** - Add industry extraction logic
3. **`match-analysis-pdf-v2/index.ts`** - Add company name to industry inference
4. **`skill-matcher.ts`** - Enhance `findIndustryMatch()` with new matching logic

### Priority 2: Technology Domain Enhancement

#### Context: Why We Should Do This

**Current Limitation:**
- Technology domain matching relies only on exact matches and basic aliases
- Missing broader categorizations like "Frontend Development", "DevOps", "Data Engineering"
- Project context that indicates domains is underutilized

**Potential Impact:**
- **Moderate improvement** in matching broad technical domains
- **Better categorization** of technical experience
- **Enhanced matching** for domain-specific requirements

#### How We Should Do This

**Phase 1: Project Context Analysis**
```typescript
// Extract domains from project descriptions
const domainKeywords = {
  'Frontend Development': ['react', 'vue', 'angular', 'ui', 'frontend', 'web development'],
  'Backend Development': ['api', 'backend', 'server', 'database', 'microservices'],
  'DevOps': ['docker', 'kubernetes', 'ci/cd', 'aws', 'deployment', 'infrastructure'],
  'Data Engineering': ['etl', 'data pipeline', 'analytics', 'big data', 'spark'],
  'Mobile Development': ['ios', 'android', 'mobile app', 'react native', 'flutter']
}

// Analyze project descriptions and tech stacks for domain indicators
```

**Phase 2: Skill Registry Domain Mappings**
```typescript
// Add technology domain relationships
const technologyDomains = [
  {
    domain: 'Frontend Development',
    indicators: ['React', 'Vue.js', 'Angular', 'CSS', 'HTML'],
    projects: ['web application', 'user interface', 'dashboard'],
    aliases: ['UI Development', 'Web Frontend', 'Client-side Development']
  }
]
```

**Implementation Complexity:**
- **Medium** - Requires semantic analysis of project descriptions
- **Context-dependent** - Domain inference requires understanding project context
- **Maintenance overhead** - Domain mappings need regular updates

## Technical Architecture: Code vs Knowledge Base

### Understanding the Two-Component System

The skill extraction and matching system consists of two complementary parts:

#### **1. Knowledge Base (skill-registry.ts) - Declarative Mappings**
- **Purpose**: Static lookup tables, aliases, and relationships
- **What it contains**: Skill mappings, synonyms, qualification rules
- **Role enhancement example**: `"CTO" → qualifies for "Tech Lead"`
- **Industry example**: `"Financial Services" → aliases: ["Banking", "Fintech"]`
- **Limitation**: Cannot create new skills, only maps existing ones

#### **2. Code Logic (match-analysis functions) - Active Extraction**  
- **Purpose**: Dynamically extract skills from profile data
- **What it does**: Parses LinkedIn experiences, PDF text, creates skill objects
- **Role enhancement example**: Extract job titles from experience sections
- **Industry example**: Read company industry fields, create industry-type skills
- **Requirement**: Must write code to extract data that doesn't currently exist

### Why Both Components Are Required

**Knowledge Base Alone is Insufficient:**
```typescript
// ❌ This won't work - no industry skills exist to map
// Knowledge base can only map skills that already exist in candidate data
{
  skill: 'Financial Services',
  aliases: ['Banking', 'Fintech']  // Useless if no industry skills extracted
}
```

**Code + Knowledge Base = Complete Solution:**
```typescript
// ✅ Step 1: CODE extracts industry from LinkedIn
if (linkedInProfile.experiences[0].company.industry === "Investment Banking") {
  industrySkills.push({
    name: "Investment Banking",
    type: 'industry'
  })
}

// ✅ Step 2: KNOWLEDGE BASE maps during matching
{
  skill: 'Financial Services',
  aliases: ['Investment Banking', 'Banking']  // Now this mapping is useful
}
```

### Implementation Pattern for Each Enhancement

**Every skill type enhancement requires BOTH:**

1. **Code Changes** (Data Creation):
   - Modify `match-analysis-linkedin-v2/index.ts`
   - Modify `match-analysis-pdf-v2/index.ts` 
   - Add extraction logic to create new skill-type objects

2. **Knowledge Base Changes** (Data Mapping):
   - Modify `skill-registry.ts`
   - Add aliases, relationships, company mappings
   - Enhance matching logic in `skill-matcher.ts`

### Analogy: Role Enhancement Success

**What we did for roles:**
- **Code**: Added extraction logic to read job titles from LinkedIn experiences
- **Knowledge Base**: Added role aliases and qualification mappings
- **Result**: Candidates with "CTO" experience can match "Tech Lead" requirements

**What's needed for industry:**
- **Code**: Add extraction logic to read company industry data  
- **Knowledge Base**: Add industry aliases and company-to-industry mappings
- **Result**: Candidates at "Goldman Sachs" can match "Financial Services" requirements

## Implementation Strategy

### Recommended Approach

1. **Start with Industry Enhancement (Priority 1)**
   - **Highest impact** with **moderate complexity**
   - **Clear data sources** (company information readily available)
   - **Immediate business value** for industry-specific matching

2. **Follow with Technology Domain (Priority 2)**
   - **After** industry enhancement is proven successful
   - **More complex** semantic analysis required
   - **Lower immediate impact** but good long-term value

### Technical Implementation Pattern

Following the successful role enhancement pattern:

1. **Enhance Skill Registry** - Add comprehensive mappings and aliases
2. **Update LinkedIn Flow** - Extract industry/domain from profile data  
3. **Update PDF Flow** - Infer industry/domain from text analysis
4. **Deploy Shared Modules** - All workflows benefit from enhancements
5. **Test and Validate** - Verify matching improvements

### Success Metrics

**For Industry Enhancement:**
- Candidates at "Goldman Sachs" should match "Financial Services" requirements
- Healthcare workers should match healthcare industry positions
- SaaS company employees should match technology industry roles

**For Technology Domain Enhancement:**
- React developers should match "Frontend Development" requirements
- AWS infrastructure work should match "DevOps" requirements
- Data pipeline experience should match "Data Engineering" roles

## Next Steps

When implementing these enhancements:

1. **Review this document** for context and technical approach
2. **Start with Industry Enhancement (Priority 1)** 
3. **Follow the established role enhancement pattern**
4. **Test with mock data** to validate extraction and matching
5. **Deploy incrementally** (LinkedIn → PDF → Fallback flows)

## References

- **Role Enhancement Implementation**: `docs/apis/code/parse-linkedin-skill.ts` and `parse-resume-skill.js`
- **Skill Registry Pattern**: `supabase/functions/_shared/skill-registry.ts`
- **Matching Logic**: `supabase/functions/_shared/skill-matcher.ts`
- **Deployment Pattern**: All three match analysis workflows enhanced simultaneously

---

*Document created: January 2025*  
*Context: Post role-type enhancement, preparing for next skill type improvements*
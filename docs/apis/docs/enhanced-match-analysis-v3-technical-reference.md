# Enhanced Match Analysis API v3 - Technical Reference

## Executive Summary

The Enhanced Match Analysis API v3 is a sophisticated candidate-job matching system that combines semantic similarity analysis using OpenAI embeddings with hierarchical skill relationship logic. This implementation maintains backward compatibility with the original match-analysis API while delivering significantly improved accuracy through advanced natural language processing and intelligent skill matching algorithms.

## Technical Overview

### High-Level Architecture

The v3 API introduces a **hybrid matching approach** that leverages:

1. **Semantic Embeddings**: OpenAI text-embedding-3-small for understanding skill relationships through vector similarity
2. **Hierarchical Logic**: Predefined skill relationship trees for technology domains
3. **LinkedIn Profile Analysis**: Deep extraction of skills and experience from unstructured profile data
4. **Intelligent Caching**: Embedding cache to minimize API costs and improve performance
5. **Evidence-Based Scoring**: Confidence scoring based on multiple evidence sources

### Key Innovations vs Previous Versions

#### **Semantic Similarity Engine**
- Utilizes OpenAI's text-embedding-3-small model (1536 dimensions)
- Cosine similarity calculations for skill matching with 0.6+ threshold
- Dynamic threshold adjustment based on skill relationships

#### **Skill Hierarchy Intelligence**
- Comprehensive skill relationship mapping (parent/child/sibling relationships)
- Technology domain awareness (programming, cloud, databases, web development)
- Alias and variation handling for common skill name differences

#### **LinkedIn Profile Enhancement**
- Deep text analysis of experience descriptions
- Years of experience extraction from profile narratives
- Technology keyword detection in unstructured content

#### **Cost Optimization Strategies**
- Embedding caching with PostgreSQL vector storage
- Fallback to rule-based matching when embeddings fail
- Optimized API call patterns to minimize OpenAI usage

## Core Algorithms

### Hybrid Skill Matching Methodology

The v3 algorithm employs a three-tier matching strategy:

```
1. Exact/Hierarchical Matching (Highest Priority)
   ├── Direct name matches
   ├── Alias resolution (js → javascript)
   ├── Parent-child relationships (React → JavaScript)
   └── Sibling relationships (Vue ↔ Angular)

2. Semantic Similarity Analysis (Medium Priority)
   ├── Generate embeddings for requirement and candidate skills
   ├── Calculate cosine similarity scores
   ├── Apply relationship-aware thresholds
   └── Evidence collection and confidence scoring

3. Profile Text Mining (Supplementary)
   ├── Extract skills from experience descriptions
   ├── Estimate years of experience from narratives
   └── Technology keyword detection
```

### Semantic Similarity Calculation

The cosine similarity implementation includes comprehensive error handling and validation:

```typescript
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Input validation
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  if (vecA.length !== vecB.length) return 0;
  if (!vecA.every(x => typeof x === 'number')) return 0;
  
  // Mathematical calculation
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  const similarity = dotProduct / (magnitudeA * magnitudeB);
  return Math.max(-1, Math.min(1, similarity)); // Clamp to [-1, 1]
}
```

### Skill Relationship Hierarchies

The system maintains domain-specific skill hierarchies for intelligent matching:

```typescript
const SKILL_RELATIONSHIPS = {
  'javascript': {
    children: ['react', 'vue', 'angular', 'node.js', 'express', 'next.js'],
    domain: 'programming'
  },
  'react': {
    parent: 'javascript',
    children: ['next.js', 'gatsby', 'react native'],
    domain: 'frontend'
  },
  'aws': {
    parent: 'cloud',
    children: ['s3', 'ec2', 'lambda', 'rds'],
    domain: 'cloud-platform'
  }
  // ... comprehensive hierarchy definitions
};
```

### Dynamic Threshold Adjustment

Semantic similarity thresholds are dynamically adjusted based on skill relationships:

```typescript
// Base threshold: 0.6
// Child skill → Parent requirement: 0.5 (more lenient)
// Parent skill → Child requirement: 0.8 (more restrictive)
// Sibling skills: 0.6 (standard)
// Unrelated skills: 0.6 (standard)
```

### Scoring and Evaluation Logic

#### Individual Requirement Scoring

```typescript
// Proficiency-based scoring for technical skills
const candidateProficiency = calculateProficiencyLevel(totalYears, skillType);
const baseScore = Math.min((candidateValue / requiredValue) * 70, 70);
const qualityBonus = bestMatch.confidence * 30;
const finalScore = Math.min(baseScore + qualityBonus, 100);

// Soft skill scoring (presence-based)
if (requirement.type === 'soft_skill') {
  finalScore = bestMatch.matchType === 'exact' 
    ? 75 + (confidence * 25)  // 75-100%
    : 50 + (confidence * 25); // 50-75%
}
```

#### Overall Score Calculation

```typescript
// Weighted average with 80/20 split
const mandatoryScore = calculateWeightedAverage(mandatoryReqs, evaluations);
const optionalScore = calculateWeightedAverage(optionalReqs, evaluations);
const overallScore = Math.round(mandatoryScore * 0.8 + optionalScore * 0.2);
```

#### Status Classification

- **Strong** (75-100%): Excellent match, exceeds requirements
- **Adequate** (50-74%): Good match, meets basic requirements  
- **Weak** (25-49%): Below expectations, concerns identified
- **Missing** (0-24%): Significant gap, major concern

## API Specification

### Endpoint Information

- **URL**: `https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-3`
- **Method**: `POST`
- **Authentication**: `Authorization: Bearer {supabase_anon_key}`
- **Content-Type**: `application/json`

### Input Format

```typescript
interface MatchAnalysisRequest {
  candidate: {
    main: {
      first_name: string;
      last_name: string;
      country: string;
      email: string;
      phone: string;
      linkedin: string;
      github: string;
    };
    skills: Array<{
      name: string;
      type: 'technical_skill' | 'soft_skill' | 'role' | 'certification' | 'industry' | 'technology_domain';
      yoe: number | null;
      proficiency_level: 'beginner' | 'advanced' | 'expert' | null;
    }>;
    years_of_experience: number;
    raw_profile?: LinkedInProfile; // Enhanced: Raw LinkedIn data for deep analysis
  };
  job: {
    attributes: {
      title: string;
      rate: { value: string; freq: string; };
      commitment: string;
      duration: string;
      location: {
        category: string;
        regions: string[];
        countries: string[];
      };
    };
    requirements: Array<{
      requirement: string;
      type: string;
      is_mandatory: boolean;
      proficiency_level: 'beginner' | 'advanced' | 'expert' | null;
      weight: number;
    }>;
    job_description: string;
  };
}
```

### Response Structure

The v3 API maintains exact compatibility with previous versions while internally leveraging enhanced analysis:

```typescript
interface MatchAnalysisResponse {
  match_analysis: {
    overall_score: number; // 0-100
    status: "strong" | "adequate" | "weak" | "missing";
    overall_feedback: string; // AI-generated recruiter summary
    matched_mandatory_requirements: number;
    total_mandatory_requirements: number;
  };
  requirement_evaluations: Array<{
    requirement_name: string;
    score: number; // 0-100
    status: "strong" | "adequate" | "weak" | "missing";
    feedback: string; // Human-readable analysis
  }>;
  summary: {
    strengths: string[]; // 3-5 key strengths
    gaps: string[]; // 3-5 areas of concern
  };
  recruiter_recommendations: {
    interview_strategy: string[]; // 3-4 focus areas
    other_options: string[]; // 3-4 alternative suggestions
  };
  metadata: {
    analysis_timestamp: string;
    job_id: string;
    candidate_id: string;
    algorithm_version: "3.0-embedding-enhanced";
    total_processing_time_ms: number;
  };
}
```

### Error Handling

```typescript
// Common error responses
{
  "error": "Invalid input. Expected object with 'candidate' and 'job' properties."
} // 400

{
  "error": "Invalid candidate data. Must contain 'main' and 'skills' array."
} // 400

{
  "error": "Enhanced analysis v3 failed",
  "details": "OpenAI embeddings API error: 429"
} // 500
```

## Database Design

### Enhanced Tables Schema

#### skill_embeddings
```sql
CREATE TABLE public.skill_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_text TEXT NOT NULL UNIQUE,
    embedding vector(1536), -- OpenAI text-embedding-3-small
    model_version TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### semantic_matches
```sql
CREATE TABLE public.semantic_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_skill TEXT NOT NULL,
    job_requirement TEXT NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('exact', 'semantic', 'related')),
    confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    evidence TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    match_analysis_id UUID
);
```

#### enhanced_match_analyses
```sql
CREATE TABLE public.enhanced_match_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_analysis_id UUID NOT NULL UNIQUE,
    discovered_skills JSONB,
    semantic_matches JSONB,
    qualitative_analysis JSONB,
    openai_calls JSONB,
    cost_estimate_usd DECIMAL(10,6),
    confidence_factors JSONB,
    semantic_analysis_enabled BOOLEAN DEFAULT true,
    qualitative_analysis_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Caching Strategy for Embeddings

The embedding cache implements intelligent storage and retrieval:

```typescript
async function getCachedEmbedding(text: string, supabase: any, openaiApiKey: string): Promise<number[]> {
  const normalizedText = text.toLowerCase().trim();
  
  // Try cache first
  const { data: cached } = await supabase
    .from('skill_embeddings')
    .select('embedding')
    .eq('skill_text', normalizedText)
    .single();

  if (cached?.embedding && Array.isArray(cached.embedding)) {
    return cached.embedding;
  }

  // Generate new embedding
  const embedding = await generateEmbedding(normalizedText, openaiApiKey);
  
  // Cache asynchronously (fire and forget)
  supabase.from('skill_embeddings').insert({
    skill_text: normalizedText,
    embedding: embedding,
    model_version: 'text-embedding-3-small'
  });

  return embedding;
}
```

### Performance Optimizations

- **Indexes**: Optimized for text searches and similarity lookups
- **Vector Extension**: PostgreSQL vector extension for efficient similarity operations
- **RLS Policies**: Row-level security for multi-tenant data isolation
- **Batch Operations**: Efficient bulk operations for large-scale analysis

## Integration Details

### Server Action Integration

The Next.js server action provides a clean interface to the enhanced API:

```typescript
export async function runSimplifiedEnhancedMatchAnalysis(
  candidate: ParsedCandidate,
  job: JobData,
  rawProfile?: Record<string, unknown>
): Promise<MatchAnalysisResponse> {
  const requestBody = { 
    candidate: {
      ...candidate,
      raw_profile: rawProfile || null
    }, 
    job 
  };
  
  const response = await fetch(
    "https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-3",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to run enhanced analysis");
  }

  return await response.json();
}
```

### Complete LinkedIn Analysis Flow

```typescript
export async function analyzeLinkedInCandidateSimplifiedEnhanced(
  linkedinUrl: string,
  jobId: string,
  saveResults: boolean = false
): Promise<{
  candidate: ParsedCandidate;
  analysis: MatchAnalysisResponse;
  candidateId?: string;
  rawProfile?: Record<string, unknown>;
}> {
  // Step 1: Scrape LinkedIn profile
  const rawLinkedInData = await scrapeLinkedInProfile(linkedinUrl);
  
  // Step 2: Reduce to structured format
  const reducedData = await reduceLinkedInProfile(rawLinkedInData);
  
  // Step 3: Parse skills and extract candidate data
  const candidate = await parseLinkedInSkills(reducedData);
  
  // Step 4: Get job data
  const jobData = await fetchJobDataForAnalysis(jobId);
  
  // Step 5: Run enhanced analysis with raw profile
  const analysis = await runSimplifiedEnhancedMatchAnalysis(candidate, jobData, reducedData);
  
  // Step 6: Save if requested
  if (saveResults) {
    const candidateId = await saveCandidate(candidate, linkedinUrl, "linkedin");
    await saveMatchAnalysis(jobId, candidateId, analysis);
    return { candidate, analysis, candidateId, rawProfile: reducedData };
  }
  
  return { candidate, analysis, rawProfile: reducedData };
}
```

### Error Handling Flows

The system implements comprehensive error handling with fallback strategies:

```typescript
// Graceful degradation for embedding failures
try {
  const embedding = await getCachedEmbedding(skill, supabase, openaiApiKey);
  const similarity = cosineSimilarity(reqEmbedding, embedding);
  // Use semantic matching
} catch (embeddingError) {
  console.error('Embedding failed, falling back to rule-based matching');
  // Fall back to hierarchical matching only
}

// Zero vector fallback for critical failures
return new Array(1536).fill(0); // Last resort fallback
```

## Quality Assurance

### Testing Approaches

#### Unit Testing for Core Algorithms
```typescript
// Cosine similarity validation
describe('cosineSimilarity', () => {
  test('handles identical vectors', () => {
    const vec = [1, 2, 3];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0);
  });
  
  test('handles orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });
  
  test('validates input arrays', () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1], [1, 2])).toBe(0);
  });
});
```

#### Integration Testing with Mock Data
```typescript
// Skill relationship testing
describe('getSkillRelationship', () => {
  test('identifies exact matches', () => {
    const result = getSkillRelationship('javascript', 'javascript');
    expect(result.relationship).toBe('exact');
    expect(result.confidence).toBe(1.0);
  });
  
  test('identifies parent-child relationships', () => {
    const result = getSkillRelationship('javascript', 'react');
    expect(result.relationship).toBe('child');
    expect(result.confidence).toBe(0.8);
  });
});
```

### Monitoring and Debugging

#### Comprehensive Logging
```typescript
console.log("🚀 Starting Enhanced Match Analysis v3 (Simplified Embedding-Based)");
console.log(`👤 Candidate: ${candidateData.main.first_name} ${candidateData.main.last_name}`);
console.log(`💼 Job: ${jobData.attributes?.title}`);
console.log(`📋 Requirements: ${jobData.requirements.length}`);
console.log(`🧠 LinkedIn Profile Available: ${!!candidateData.raw_profile}`);

// Processing metrics
console.log(`📊 Overall Score: ${overallScore}% (${overallStatus})`);
console.log(`✅ Mandatory Requirements Met: ${matchedMandatory}/${mandatoryReqs.length}`);
console.log(`🕒 Processing Time: ${processingTime}ms`);
console.log(`🧠 Profile Skills Extracted: ${profileSkills.length}`);
```

#### Performance Monitoring
- Processing time tracking per analysis
- API call counting for cost monitoring
- Cache hit/miss ratios for optimization
- Error rate tracking by failure type

### Performance Considerations

#### Processing Time Benchmarks
- **Average Analysis Time**: 3-8 seconds per candidate-job pair
- **LinkedIn Profile Extraction**: 1-2 seconds additional
- **Embedding Generation**: ~200ms per unique skill (cached after first use)
- **Semantic Similarity Calculations**: ~50ms per skill comparison

#### Cost Optimization Metrics
- **Embedding Cache Hit Rate**: Target >80% for established skill sets
- **OpenAI API Calls**: 
  - Embeddings: 1-10 per analysis (depending on cache)
  - Chat Completions: 1 per analysis for overall feedback
- **Estimated Cost**: $0.01-0.05 per analysis (depending on cache efficiency)

#### Scalability Limits
- **Concurrent Analyses**: 5-10 recommended (API rate limiting)
- **Batch Processing**: 3-5 candidates per batch optimal
- **Daily Volume**: 1000+ analyses sustainable with proper caching

### Memory and Resource Management
- **Zero Vector Fallbacks**: Prevent system crashes from API failures
- **Graceful Degradation**: Rule-based matching when embeddings fail
- **Cache Management**: Automatic cleanup of old embeddings
- **Error Isolation**: Individual requirement failures don't break entire analysis

## Production Deployment Considerations

### Environment Variables Required
```bash
OPENAI_API_KEY=sk-...                    # OpenAI API access
SUPABASE_URL=https://...                 # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Service role for database access
```

### Database Migration Prerequisites
```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Deploy enhanced tables
\i supabase/migrations/20250816000001_create_enhanced_match_analysis_tables.sql
```

### Monitoring and Alerting Setup
- **API Response Time**: Alert if >15 seconds
- **Error Rate**: Alert if >5% failed analyses
- **Cost Monitoring**: Daily OpenAI API spend tracking
- **Cache Performance**: Weekly cache hit rate reports

### Security Considerations
- **RLS Policies**: All tables protected by row-level security
- **API Key Rotation**: Regular rotation of OpenAI API keys
- **Data Isolation**: User-specific data segregation
- **Input Validation**: Comprehensive sanitization of all inputs

This technical reference provides a complete overview of the Enhanced Match Analysis API v3 implementation, serving as a comprehensive guide for development, debugging, and future enhancement of the system.
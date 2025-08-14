# Candidate Data Hybrid Architecture Implementation Plan

## Overview

This document outlines the strategic implementation plan for enhancing Vita's candidate creation and storage system with a hybrid architecture that combines structured data benefits with raw content richness.

## Executive Summary

**Current State**: Structured parsing-only approach that loses contextual information  
**Target State**: Hybrid architecture preserving both structured data (performance) and raw content (AI capabilities)  
**Timeline**: 6-8 weeks implementation  
**Expected Impact**: 3-4x improvement in candidate matching accuracy while maintaining operational performance

## Strategic Goals

### Primary Objectives
1. **Information Preservation**: Capture 100% of candidate profile information without data loss
2. **Performance Maintenance**: Retain fast SQL-based queries for routine operations
3. **AI Enhancement**: Enable advanced semantic analysis and contextual matching
4. **Future-Proofing**: Prepare for next-generation AI recruiting capabilities
5. **Cost Control**: Balance AI capabilities with operational efficiency

### Business Outcomes
- **Matching Accuracy**: Improve candidate-job matching by 40-60%
- **Recruiter Efficiency**: Enable deeper candidate insights without performance penalties
- **Competitive Advantage**: Unique hybrid approach combining speed and intelligence
- **Scalability**: Support growth without exponential cost increases

## Technical Architecture

### Current Data Flow
```
LinkedIn/Resume → Parse API → Structured Data → Database
                     ↓
              (Context Lost)
```

### Enhanced Data Flow
```
LinkedIn/Resume → Parse API → Structured Data → Database
                     ↓              ↓
              Raw Content → Enhanced Storage → AI Insights Cache
```

## Database Schema Changes

### Phase 1: Enhanced Candidate Storage

#### Candidates Table Extensions
```sql
-- Add raw content storage to existing candidates table
ALTER TABLE candidates ADD COLUMN raw_resume_text TEXT;
ALTER TABLE candidates ADD COLUMN raw_linkedin_content JSONB;
ALTER TABLE candidates ADD COLUMN content_source VARCHAR(20) DEFAULT 'structured'; -- 'resume', 'linkedin', 'manual'
ALTER TABLE candidates ADD COLUMN raw_content_hash VARCHAR(64); -- For change detection
ALTER TABLE candidates ADD COLUMN last_ai_analysis TIMESTAMP;

-- Add metadata for content tracking
ALTER TABLE candidates ADD COLUMN original_file_name VARCHAR(255);
ALTER TABLE candidates ADD COLUMN upload_timestamp TIMESTAMP DEFAULT NOW();
```

#### New AI Insights Table
```sql
CREATE TABLE candidate_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'soft_skills', 'leadership_evidence', 'cultural_fit', 'career_trajectory'
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    generated_at TIMESTAMP DEFAULT NOW(),
    model_version VARCHAR(50), -- 'gpt-4o-mini-2024-07', etc.
    processing_time_ms INTEGER,
    
    -- Ensure one insight type per candidate
    UNIQUE(candidate_id, insight_type),
    
    -- Index for efficient queries
    INDEX idx_candidate_insights_type (candidate_id, insight_type),
    INDEX idx_insights_generated_at (generated_at)
);
```

#### Enhanced Skills Tracking
```sql
-- Add source tracking to candidate skills
ALTER TABLE candidates_skills ADD COLUMN extraction_method VARCHAR(20) DEFAULT 'structured'; -- 'structured', 'ai_inferred', 'manual'
ALTER TABLE candidates_skills ADD COLUMN confidence_score DECIMAL(3,2);
ALTER TABLE candidates_skills ADD COLUMN supporting_evidence TEXT; -- Context where skill was found
ALTER TABLE candidates_skills ADD COLUMN last_verified TIMESTAMP;

-- Add skill relationships table
CREATE TABLE skill_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_skill VARCHAR(100) NOT NULL,
    child_skill VARCHAR(100) NOT NULL,
    relationship_type VARCHAR(20) NOT NULL, -- 'synonym', 'parent_child', 'related'
    confidence DECIMAL(3,2) DEFAULT 0.8,
    
    UNIQUE(parent_skill, child_skill, relationship_type)
);
```

### Phase 2: Content Processing Pipeline

#### Content Processing Status Table
```sql
CREATE TABLE candidate_processing_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    processing_stage VARCHAR(50) NOT NULL, -- 'raw_stored', 'structured_parsed', 'ai_analyzed', 'complete'
    stage_status VARCHAR(20) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    UNIQUE(candidate_id, processing_stage)
);
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Enhance data storage without disrupting current functionality

#### Database Changes
- [ ] Add raw content columns to candidates table
- [ ] Create candidate_ai_insights table
- [ ] Enhance candidates_skills with confidence scoring
- [ ] Set up processing status tracking

#### API Enhancements
- [ ] Modify `parse-linkedin-skill.ts` to store raw LinkedIn JSON
- [ ] Update `parse-resume-skill.js` to store original PDF text
- [ ] Enhance candidate creation endpoints to handle dual storage
- [ ] Add content hash generation for change detection

#### Component Updates
- [ ] Update `create-talent-dialog` to pass raw content
- [ ] Modify candidate creation flow to store both formats
- [ ] Add progress indicators for processing stages

### Phase 2: AI Integration (Weeks 3-4)
**Goal**: Implement AI-powered content analysis pipeline

#### AI Analysis Pipeline
```typescript
interface AIAnalysisPipeline {
  stages: [
    'content_extraction',    // Extract all text content
    'skill_inference',       // Identify implied skills
    'soft_skill_analysis',   // Leadership, communication evidence
    'cultural_fit_analysis', // Work style, values indicators
    'career_trajectory'      // Growth patterns, potential
  ]
}
```

#### New API Endpoints
- [ ] `/api/candidates/analyze-raw-content` - Trigger AI analysis
- [ ] `/api/candidates/ai-insights` - Retrieve cached insights
- [ ] `/api/candidates/refresh-analysis` - Re-run analysis with new models

#### Background Processing
- [ ] Implement queue system for AI analysis jobs
- [ ] Add retry logic for failed analyses
- [ ] Create monitoring for processing pipeline health

### Phase 3: Query Intelligence (Weeks 5-6)
**Goal**: Implement smart query routing and hybrid search

#### Query Router Implementation
```typescript
interface QueryRouter {
  routeQuery(query: SearchQuery): 'sql' | 'ai' | 'hybrid'
  
  // Examples:
  // "React developers" → SQL (fast, structured)
  // "innovative problem solvers" → AI (semantic analysis)
  // "React developers with leadership experience" → Hybrid
}
```

#### Search Enhancements
- [ ] Build query classification system
- [ ] Implement semantic search capabilities
- [ ] Add result confidence scoring
- [ ] Create fallback mechanisms for AI failures

### Phase 4: Integration & Optimization (Weeks 7-8)
**Goal**: Integrate with existing features and optimize performance

#### Match Analysis Integration
- [ ] Enhance candidate-match-analysis to use raw content
- [ ] Implement confidence-weighted scoring
- [ ] Add semantic similarity matching
- [ ] Create A/B testing framework

#### Performance Optimization
- [ ] Implement intelligent caching strategies
- [ ] Add content compression for storage efficiency
- [ ] Optimize AI insight retrieval
- [ ] Monitor and tune query performance

## Technical Specifications

### Content Storage Strategy
```typescript
interface CandidateContent {
  structured: ParsedCandidate    // Current format - fast queries
  raw: {
    linkedin?: LinkedInProfile   // Full LinkedIn API response
    resume?: {
      text: string              // Extracted text from PDF
      metadata: {
        fileName: string
        uploadDate: string
        fileSize: number
      }
    }
  }
  processing: {
    contentHash: string         // For change detection
    lastAnalysis: Date
    processingStatus: ProcessingStage[]
  }
}
```

### AI Insights Schema
```typescript
interface AIInsight {
  type: 'soft_skills' | 'leadership_evidence' | 'cultural_fit' | 'innovation_markers'
  data: {
    skills?: Array<{
      skill: string
      evidence: string[]
      confidence: number
    }>
    leadership?: {
      examples: string[]
      leadership_style: string
      team_size_managed?: number
    }
    cultural_indicators?: {
      work_style: string
      communication_style: string
      collaboration_preferences: string[]
    }
  }
  confidence: number
  generated_at: Date
  model_version: string
}
```

### Query Routing Logic
```typescript
class QueryRouter {
  classifyQuery(query: string): QueryType {
    // Simple queries → SQL
    if (this.hasStructuredTerms(query)) return 'sql'
    
    // Complex semantic queries → AI
    if (this.hasSemanticTerms(query)) return 'ai'
    
    // Mixed queries → Hybrid
    return 'hybrid'
  }
  
  private hasStructuredTerms(query: string): boolean {
    return /\b(years?|experience|skill|certification)\b/i.test(query)
  }
  
  private hasSemanticTerms(query: string): boolean {
    return /\b(innovative|leader|cultural fit|problem solver)\b/i.test(query)
  }
}
```

## Migration Strategy

### Data Migration
```sql
-- Migrate existing candidates (run during low-traffic hours)
UPDATE candidates 
SET content_source = 'structured'
WHERE raw_resume_text IS NULL AND raw_linkedin_content IS NULL;

-- Populate processing status for existing candidates
INSERT INTO candidate_processing_status (candidate_id, processing_stage, stage_status, completed_at)
SELECT id, 'structured_parsed', 'completed', created_at
FROM candidates
WHERE raw_resume_text IS NULL;
```

### Rollback Plan
- Maintain parallel processing during transition
- Feature flags for enabling/disabling AI analysis
- Database backup before each phase deployment
- Ability to fall back to structured-only queries

## Performance Considerations

### Storage Impact
- **Raw Content**: ~50KB average per candidate
- **AI Insights**: ~10KB average per candidate
- **Total Increase**: ~60KB per candidate (manageable for 10K+ candidates)

### Processing Costs
```typescript
const estimatedCosts = {
  structured_parsing: '$0.001 per candidate',  // Current cost
  ai_analysis: '$0.05 per candidate',          // New cost (one-time)
  hybrid_queries: '$0.001 per search',         // Cached results
  
  monthly_savings: '60% vs pure-AI approach'
}
```

### Performance Metrics
- **SQL Queries**: <100ms (maintained)
- **AI Queries**: <2s (cached results)
- **Hybrid Queries**: <500ms (SQL pre-filter + AI refinement)
- **Cache Hit Rate**: Target >90% for AI insights

## Success Metrics

### Technical KPIs
- [ ] Zero performance regression for existing SQL queries
- [ ] <2s response time for AI-enhanced searches
- [ ] >95% uptime for content processing pipeline
- [ ] <5% error rate for AI analysis jobs

### Business KPIs
- [ ] 40% improvement in candidate matching accuracy
- [ ] 25% reduction in time-to-hire
- [ ] 60% increase in recruiter satisfaction with candidate insights
- [ ] 30% improvement in candidate diversity identification

## Risk Mitigation

### Technical Risks
- **AI Service Downtime**: Fallback to structured-only queries
- **Cost Overruns**: Rate limiting and caching strategies
- **Performance Degradation**: Comprehensive monitoring and optimization
- **Data Quality Issues**: Validation and confidence scoring

### Business Risks
- **User Adoption**: Gradual rollout with training materials
- **Accuracy Concerns**: A/B testing and feedback loops
- **Compliance Issues**: Audit trails and data lineage tracking

## Future Enhancements

### Phase 5: Advanced AI (3-6 months)
- [ ] Vector embeddings for semantic search
- [ ] Multi-modal analysis (resume format, LinkedIn photos)
- [ ] Predictive candidate success modeling
- [ ] Real-time market salary and skills trending

### Phase 6: Integration Expansion (6-12 months)
- [ ] Integration with job matching algorithms
- [ ] Enhanced interview question generation
- [ ] Automated candidate outreach personalization
- [ ] Market intelligence and competitive analysis

## Conclusion

This hybrid architecture positions Vita as a leader in AI-powered recruiting while maintaining operational excellence. The phased approach minimizes risk while maximizing the benefits of both structured efficiency and AI-powered insights.

**Next Steps**:
1. Review and approve this implementation plan
2. Set up development environment and database changes
3. Begin Phase 1 implementation
4. Monitor metrics and iterate based on results

---

*Document Version: 1.0*  
*Last Updated: 2025-01-15*  
*Author: AI Engineering Team*  
*Review Date: Every 2 weeks during implementation*
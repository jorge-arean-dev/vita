# Match Analysis API - Database Tables Proposal

## Overview

This document outlines the database tables required to support the match-analysis API integration in the Vita application. These tables are designed to store the comprehensive analysis results returned by the API while maintaining proper relationships with existing database structures.

## Missing Tables Identified

After analyzing the match-analysis API documentation, the candidate-match-analysis component, and the existing database schema, the following tables need to be created:

1. **match_analyses** - Primary table to store complete match analysis results
2. **match_analysis_requirement_evaluations** - Detailed requirement-by-requirement evaluations
3. **job_descriptions** - Store job descriptions (referenced in API but missing from schema)
4. **job_linkedin_queries** - Store LinkedIn queries (referenced in component but missing from schema)

## Proposed Table Structures

### 1. match_analyses

This table will store the overall match analysis results returned by the API.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| job_id | uuid | NO | | FOREIGN KEY (jobs.id) | Reference to the job |
| candidate_id | uuid | YES | | FOREIGN KEY (candidates.id) | Reference to existing candidate (null for new candidates) |
| candidate_source | text | YES | | | Source type: 'existing', 'linkedin', 'resume' |
| candidate_source_data | jsonb | YES | | | LinkedIn URL or resume filename for new candidates |
| overall_score | numeric(3,0) | NO | | CHECK (0-100) | Overall match percentage |
| status | text | NO | | CHECK IN ('strong', 'adequate', 'weak', 'missing') | Overall match status |
| overall_feedback | text | NO | | | AI-generated overall feedback |
| matched_mandatory_requirements | integer | NO | | | Count of matched mandatory requirements |
| total_mandatory_requirements | integer | NO | | | Total count of mandatory requirements |
| strengths | jsonb | NO | | | Array of strength points |
| gaps | jsonb | NO | | | Array of gap points |
| interview_strategy | jsonb | NO | | | Array of interview strategy recommendations |
| other_options | jsonb | NO | | | Array of alternative options |
| candidate_data | jsonb | NO | | | Complete candidate data used in analysis |
| job_data | jsonb | NO | | | Complete job data used in analysis |
| metadata | jsonb | YES | | | API metadata (timestamp, processing time, version) |
| user_id | uuid | NO | | FOREIGN KEY (profiles.user_id) | User who created the analysis |
| is_saved | boolean | NO | false | | Whether analysis is saved permanently |
| created_at | timestamp with time zone | NO | now() | | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | | Last update timestamp |

### 2. match_analysis_requirement_evaluations

This table stores individual requirement evaluations for each match analysis.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| match_analysis_id | uuid | NO | | FOREIGN KEY (match_analyses.id) ON DELETE CASCADE | Reference to parent analysis |
| job_requirement_id | uuid | NO | | FOREIGN KEY (job_requirements.id) | Reference to job requirement |
| requirement_index | integer | NO | | | Order index from API response |
| score | numeric(3,0) | NO | | CHECK (0-100) | Requirement match percentage |
| status | text | NO | | CHECK IN ('strong', 'adequate', 'weak', 'missing') | Requirement match status |
| feedback | text | NO | | | AI-generated feedback for this requirement |
| created_at | timestamp with time zone | NO | now() | | Creation timestamp |

### 3. job_descriptions

This table stores generated job descriptions (missing but referenced in component).

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| job_id | uuid | NO | | FOREIGN KEY (jobs.id) UNIQUE | One description per job |
| content | text | NO | | | Full job description text |
| version | integer | NO | 1 | | Version number for tracking changes |
| generated_at | timestamp with time zone | YES | | | When AI generated the description |
| user_id | uuid | NO | | FOREIGN KEY (profiles.user_id) | User who created/edited |
| created_at | timestamp with time zone | NO | now() | | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | | Last update timestamp |

### 4. job_linkedin_queries

This table stores LinkedIn search queries (missing but referenced in component).

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|------------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| job_id | uuid | NO | | FOREIGN KEY (jobs.id) | Reference to job |
| query | text | NO | | | LinkedIn search query string |
| query_type | text | YES | | | Type of query (e.g., 'boolean', 'keywords') |
| is_active | boolean | NO | true | | Whether query is currently in use |
| user_id | uuid | NO | | FOREIGN KEY (profiles.user_id) | User who created the query |
| created_at | timestamp with time zone | NO | now() | | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | | Last update timestamp |

## Implementation Considerations

### 1. Indexes

Create indexes on foreign keys and commonly queried columns for optimal performance:

```sql
-- Indexes for match_analyses
CREATE INDEX idx_match_analyses_job_candidate ON match_analyses(job_id, candidate_id);
CREATE INDEX idx_match_analyses_user_created ON match_analyses(user_id, created_at DESC);
CREATE INDEX idx_match_analyses_saved ON match_analyses(is_saved) WHERE is_saved = true;

-- Indexes for match_analysis_requirement_evaluations
CREATE INDEX idx_match_analysis_req_eval_analysis ON match_analysis_requirement_evaluations(match_analysis_id);
CREATE INDEX idx_match_analysis_req_eval_requirement ON match_analysis_requirement_evaluations(job_requirement_id);

-- Indexes for job_descriptions
CREATE INDEX idx_job_descriptions_job ON job_descriptions(job_id);

-- Indexes for job_linkedin_queries
CREATE INDEX idx_job_linkedin_queries_job ON job_linkedin_queries(job_id);
CREATE INDEX idx_job_linkedin_queries_active ON job_linkedin_queries(job_id, is_active) WHERE is_active = true;
```

### 2. Row Level Security (RLS) Policies

All tables should have Row Level Security enabled with appropriate policies:

```sql
-- Example RLS policies for match_analyses
ALTER TABLE match_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own analyses
CREATE POLICY "Users can view own match analyses" ON match_analyses
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert own match analyses" ON match_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses
CREATE POLICY "Users can update own match analyses" ON match_analyses
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own match analyses" ON match_analyses
    FOR DELETE USING (auth.uid() = user_id);
```

### 3. Database Triggers

Consider adding triggers for automatic timestamp updates and data cleanup:

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_match_analyses_updated_at BEFORE UPDATE ON match_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup trigger for unsaved analyses older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_unsaved_analyses()
RETURNS void AS $$
BEGIN
    DELETE FROM match_analyses 
    WHERE is_saved = false 
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ language 'plpgsql';
```

### 4. Data Relationships

The proposed tables integrate with the existing schema through the following relationships:

- `match_analyses.job_id` → `jobs.id`
- `match_analyses.candidate_id` → `candidates.id` (nullable for new candidates)
- `match_analyses.user_id` → `profiles.user_id`
- `match_analysis_requirement_evaluations.match_analysis_id` → `match_analyses.id`
- `match_analysis_requirement_evaluations.job_requirement_id` → `job_requirements.id`
- `job_descriptions.job_id` → `jobs.id`
- `job_descriptions.user_id` → `profiles.user_id`
- `job_linkedin_queries.job_id` → `jobs.id`
- `job_linkedin_queries.user_id` → `profiles.user_id`

### 5. API Integration Notes

The table structure is designed to accommodate the exact response format from the match-analysis API:

- The `match_analyses` table stores the overall analysis results
- The `match_analysis_requirement_evaluations` table stores the detailed requirement-by-requirement evaluations
- JSONB columns are used for arrays (strengths, gaps, recommendations) to maintain flexibility
- The `metadata` column preserves API-specific information like processing time and algorithm version
- The `candidate_data` and `job_data` columns store the complete input data for audit and reference purposes

### 6. Performance Optimization

- Use JSONB instead of JSON for better indexing capabilities
- Consider partitioning `match_analyses` table by `created_at` if data volume becomes large
- Implement archival strategy for old analyses to maintain performance
- Use materialized views for frequently accessed aggregate data

## Migration Strategy

1. Create tables in the order listed to respect foreign key dependencies
2. Add indexes after initial data load for better performance
3. Enable RLS policies after confirming table structure
4. Test with sample data before production deployment
5. Plan for data migration if any existing data needs to be moved

## Future Enhancements

Consider these potential enhancements for future iterations:

1. **Versioning**: Add version tracking for match analyses to compare changes over time
2. **Templates**: Create analysis templates for common job types
3. **Batch Processing**: Add support for bulk analysis operations
4. **Analytics**: Create aggregate tables for reporting and insights
5. **Audit Trail**: Implement comprehensive audit logging for compliance
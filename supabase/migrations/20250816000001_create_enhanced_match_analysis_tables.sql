-- Enhanced Match Analysis Tables
-- Created: 2025-08-16
-- Description: Tables to support enhanced LinkedIn candidate match analysis with semantic matching and qualitative analysis

-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to cache skill embeddings to avoid repeated OpenAI API calls
CREATE TABLE IF NOT EXISTS public.skill_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_text TEXT NOT NULL UNIQUE,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    model_version TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table to track semantic matches for analytics and debugging
CREATE TABLE IF NOT EXISTS public.semantic_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_skill TEXT NOT NULL,
    job_requirement TEXT NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1), -- 0.0000 to 1.0000
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('exact', 'semantic', 'inferred')),
    confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    evidence TEXT[], -- Array of evidence strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Foreign key reference (optional, for when we have match analysis records)
    match_analysis_id UUID
);

-- Table to store enhanced analysis results
CREATE TABLE IF NOT EXISTS public.enhanced_match_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_analysis_id UUID NOT NULL,
    
    -- Enhanced analysis data
    discovered_skills JSONB, -- Skills discovered through qualitative analysis
    semantic_matches JSONB, -- Semantic matching results
    qualitative_analysis JSONB, -- Leadership indicators, soft skills, etc.
    
    -- Processing metadata
    openai_calls JSONB, -- Track API usage: embeddings, chat completions
    cost_estimate_usd DECIMAL(10,6), -- Processing cost estimate
    confidence_factors JSONB, -- Profile completeness, extraction quality, etc.
    
    -- Feature flags
    semantic_analysis_enabled BOOLEAN DEFAULT true,
    qualitative_analysis_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Unique constraint - one enhanced analysis per match analysis
    UNIQUE(match_analysis_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_embeddings_text ON public.skill_embeddings (skill_text);
CREATE INDEX IF NOT EXISTS idx_skill_embeddings_created ON public.skill_embeddings (created_at);

CREATE INDEX IF NOT EXISTS idx_semantic_matches_similarity ON public.semantic_matches (similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_semantic_matches_type ON public.semantic_matches (match_type);
CREATE INDEX IF NOT EXISTS idx_semantic_matches_created ON public.semantic_matches (created_at);
CREATE INDEX IF NOT EXISTS idx_semantic_matches_analysis ON public.semantic_matches (match_analysis_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_match_analyses_match_id ON public.enhanced_match_analyses (match_analysis_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_match_analyses_created ON public.enhanced_match_analyses (created_at);

-- Add foreign key constraints (if the referenced table exists)
DO $$ 
BEGIN
    -- Check if job_candidate_match_analysis table exists and add foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_candidate_match_analysis') THEN
        -- Add foreign key for semantic_matches if not already exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'semantic_matches' AND constraint_name = 'fk_semantic_matches_analysis') THEN
            ALTER TABLE public.semantic_matches 
            ADD CONSTRAINT fk_semantic_matches_analysis 
            FOREIGN KEY (match_analysis_id) REFERENCES public.job_candidate_match_analysis(id) ON DELETE CASCADE;
        END IF;
        
        -- Add foreign key for enhanced_match_analyses if not already exists  
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'enhanced_match_analyses' AND constraint_name = 'fk_enhanced_match_analyses_analysis') THEN
            ALTER TABLE public.enhanced_match_analyses 
            ADD CONSTRAINT fk_enhanced_match_analyses_analysis 
            FOREIGN KEY (match_analysis_id) REFERENCES public.job_candidate_match_analysis(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.skill_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_match_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_embeddings
CREATE POLICY "Authenticated users can read skill embeddings" 
  ON public.skill_embeddings 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert skill embeddings" 
  ON public.skill_embeddings 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for semantic_matches
CREATE POLICY "Users can read their semantic matches" 
  ON public.semantic_matches 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their semantic matches" 
  ON public.semantic_matches 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for enhanced_match_analyses (simplified for now)
CREATE POLICY "Authenticated users can read enhanced analyses" 
  ON public.enhanced_match_analyses 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert enhanced analyses" 
  ON public.enhanced_match_analyses 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update enhanced analyses" 
  ON public.enhanced_match_analyses 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_skill_embeddings_updated_at ON public.skill_embeddings;
CREATE TRIGGER update_skill_embeddings_updated_at
  BEFORE UPDATE ON public.skill_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_enhanced_match_analyses_updated_at ON public.enhanced_match_analyses;
CREATE TRIGGER update_enhanced_match_analyses_updated_at
  BEFORE UPDATE ON public.enhanced_match_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE public.skill_embeddings IS 'Cache for OpenAI embeddings to reduce API costs and improve performance';
COMMENT ON TABLE public.semantic_matches IS 'Tracks semantic similarity matches between candidate skills and job requirements';
COMMENT ON TABLE public.enhanced_match_analyses IS 'Stores enhanced analysis results including qualitative insights and discovered skills';

COMMENT ON COLUMN public.skill_embeddings.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON COLUMN public.semantic_matches.similarity_score IS 'Cosine similarity score between skill embeddings (0.0-1.0)';
COMMENT ON COLUMN public.enhanced_match_analyses.discovered_skills IS 'Skills extracted from LinkedIn profile text using AI analysis';
COMMENT ON COLUMN public.enhanced_match_analyses.qualitative_analysis IS 'Leadership indicators, soft skills, and other qualitative insights';
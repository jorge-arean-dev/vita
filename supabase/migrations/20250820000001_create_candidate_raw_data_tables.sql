-- Create tables for storing raw candidate source data
-- This enables match analysis on existing candidates by preserving original source data

-- LinkedIn raw data table
CREATE TABLE candidates_linkedin_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    linkedin_url TEXT,
    data_hash TEXT,
    extraction_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resume raw data table  
CREATE TABLE candidates_resume_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    url TEXT,
    file_name TEXT,
    file_size INTEGER,
    data_hash TEXT,
    extraction_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_candidates_linkedin_raw_candidate_id ON candidates_linkedin_raw(candidate_id);
CREATE INDEX idx_candidates_linkedin_raw_data_hash ON candidates_linkedin_raw(data_hash);
CREATE INDEX idx_candidates_resume_raw_candidate_id ON candidates_resume_raw(candidate_id);
CREATE INDEX idx_candidates_resume_raw_data_hash ON candidates_resume_raw(data_hash);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidates_linkedin_raw_updated_at
    BEFORE UPDATE ON candidates_linkedin_raw
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_resume_raw_updated_at
    BEFORE UPDATE ON candidates_resume_raw
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE candidates_linkedin_raw IS 'Stores raw LinkedIn profile JSON data for enhanced match analysis';
COMMENT ON TABLE candidates_resume_raw IS 'Stores raw extracted text from PDF resumes for enhanced match analysis';
COMMENT ON COLUMN candidates_linkedin_raw.content IS 'Raw LinkedIn profile JSON from Apify extraction';
COMMENT ON COLUMN candidates_linkedin_raw.linkedin_url IS 'Original LinkedIn URL used for extraction';
COMMENT ON COLUMN candidates_linkedin_raw.data_hash IS 'Hash of content for deduplication';
COMMENT ON COLUMN candidates_resume_raw.content IS 'Raw extracted text from PDF resume';
COMMENT ON COLUMN candidates_resume_raw.url IS 'Supabase storage URL to original PDF file in resumes bucket';
COMMENT ON COLUMN candidates_resume_raw.file_name IS 'Original filename of uploaded resume';
COMMENT ON COLUMN candidates_resume_raw.file_size IS 'Size of original PDF file in bytes';
COMMENT ON COLUMN candidates_resume_raw.data_hash IS 'Hash of content for deduplication';
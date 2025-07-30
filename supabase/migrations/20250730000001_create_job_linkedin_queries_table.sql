-- Create job_linkedin_queries table
-- This table stores LinkedIn search queries generated for each job

CREATE TABLE IF NOT EXISTS public.job_linkedin_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL,
    complete_query_all TEXT,
    complete_query_skills_only TEXT,
    complete_query_job_titles_only TEXT,
    mandatory_only_query_all TEXT,
    mandatory_only_query_skills_only TEXT,
    mandatory_only_query_job_titles_only TEXT,
    recommendations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE public.job_linkedin_queries
ADD CONSTRAINT fk_job_linkedin_queries_job_id
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Add index for faster job_id lookups
CREATE INDEX IF NOT EXISTS idx_job_linkedin_queries_job_id 
ON public.job_linkedin_queries(job_id);

-- Add unique constraint to ensure one-to-one relationship with jobs
ALTER TABLE public.job_linkedin_queries
ADD CONSTRAINT unique_job_linkedin_query
UNIQUE (job_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.job_linkedin_queries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.job_linkedin_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_linkedin_queries
-- Users can only access LinkedIn queries for jobs they own

-- Policy for SELECT: Users can view LinkedIn queries for their own jobs
CREATE POLICY "Users can view their own job LinkedIn queries"
ON public.job_linkedin_queries
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = job_linkedin_queries.job_id
        AND jobs.user_id = auth.uid()
    )
);

-- Policy for INSERT: Users can create LinkedIn queries for their own jobs
CREATE POLICY "Users can create LinkedIn queries for their own jobs"
ON public.job_linkedin_queries
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = job_linkedin_queries.job_id
        AND jobs.user_id = auth.uid()
    )
);

-- Policy for UPDATE: Users can update LinkedIn queries for their own jobs
CREATE POLICY "Users can update their own job LinkedIn queries"
ON public.job_linkedin_queries
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = job_linkedin_queries.job_id
        AND jobs.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = job_linkedin_queries.job_id
        AND jobs.user_id = auth.uid()
    )
);

-- Policy for DELETE: Users can delete LinkedIn queries for their own jobs
CREATE POLICY "Users can delete their own job LinkedIn queries"
ON public.job_linkedin_queries
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = job_linkedin_queries.job_id
        AND jobs.user_id = auth.uid()
    )
);

-- Add comment to document the table
COMMENT ON TABLE public.job_linkedin_queries IS 'Stores LinkedIn search queries and recommendations generated for each job posting';

-- Add comments to document key columns
COMMENT ON COLUMN public.job_linkedin_queries.job_id IS 'Foreign key reference to jobs table - one-to-one relationship';
COMMENT ON COLUMN public.job_linkedin_queries.recommendations IS 'JSONB array containing LinkedIn search recommendations and filter suggestions';
COMMENT ON COLUMN public.job_linkedin_queries.complete_query_all IS 'Complete LinkedIn query including both job titles and skills';
COMMENT ON COLUMN public.job_linkedin_queries.complete_query_skills_only IS 'LinkedIn query focusing only on required skills';
COMMENT ON COLUMN public.job_linkedin_queries.complete_query_job_titles_only IS 'LinkedIn query focusing only on job titles';
COMMENT ON COLUMN public.job_linkedin_queries.mandatory_only_query_all IS 'LinkedIn query with only mandatory requirements (titles + skills)';
COMMENT ON COLUMN public.job_linkedin_queries.mandatory_only_query_skills_only IS 'LinkedIn query with only mandatory skills';
COMMENT ON COLUMN public.job_linkedin_queries.mandatory_only_query_job_titles_only IS 'LinkedIn query with only mandatory job titles';
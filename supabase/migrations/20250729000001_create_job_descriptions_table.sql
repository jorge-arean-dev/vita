-- Create job_descriptions table
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE
    ON job_descriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_job_descriptions_job_id ON job_descriptions(job_id);
CREATE INDEX idx_job_descriptions_created_at ON job_descriptions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view job descriptions for jobs they own
CREATE POLICY "Users can view their own job descriptions" ON job_descriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_descriptions.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- Users can create job descriptions for jobs they own
CREATE POLICY "Users can create job descriptions for their jobs" ON job_descriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_descriptions.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- Users can update job descriptions for jobs they own
CREATE POLICY "Users can update their own job descriptions" ON job_descriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_descriptions.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- Users can delete job descriptions for jobs they own
CREATE POLICY "Users can delete their own job descriptions" ON job_descriptions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_descriptions.job_id
            AND jobs.user_id = auth.uid()
        )
    );
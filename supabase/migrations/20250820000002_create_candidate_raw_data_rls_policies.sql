-- Row Level Security policies for candidate raw data tables
-- Ensures users can only access raw data for candidates they own

-- Enable RLS on both tables
ALTER TABLE candidates_linkedin_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates_resume_raw ENABLE ROW LEVEL SECURITY;

-- LinkedIn raw data policies
CREATE POLICY "Users can view their own LinkedIn raw data" ON candidates_linkedin_raw
    FOR SELECT USING (
        candidate_id IN (
            SELECT id FROM candidates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own LinkedIn raw data" ON candidates_linkedin_raw
    FOR INSERT WITH CHECK (
        candidate_id IN (
            SELECT id FROM candidates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own LinkedIn raw data" ON candidates_linkedin_raw
    FOR UPDATE USING (
        candidate_id IN (
            SELECT id FROM candidates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own LinkedIn raw data" ON candidates_linkedin_raw
    FOR DELETE USING (
        candidate_id IN (
            SELECT id FROM candidates WHERE user_id = auth.uid()
        )
    );

-- Resume raw data policies
CREATE POLICY "Users can view their own resume raw data" ON candidates_resume_raw
    FOR SELECT USING (
        candidate_id IN (
            SELECT id FROM candidates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own resume raw data" ON candidates_resume_raw
    FOR INSERT WITH CHECK (
        candidate_id IN (
            SELECT id FROM candidates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own resume raw data" ON candidates_resume_raw
    FOR UPDATE USING (
        candidate_id IN (
            SELECT id FROM candidates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own resume raw data" ON candidates_resume_raw
    FOR DELETE USING (
        candidate_id IN (
            SELECT id FROM candidates WHERE user_id = auth.uid()
        )
    );
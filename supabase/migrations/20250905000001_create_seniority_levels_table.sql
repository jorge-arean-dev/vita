-- Create seniority_levels lookup table for job experience level requirements
-- This table defines the different seniority levels that can be required for jobs

CREATE TABLE seniority_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial seniority levels data
INSERT INTO seniority_levels (name, display_name, description) VALUES
('junior', 'Junior', 'Entry level positions typically requiring 0-2 years of experience'),
('mid', 'Mid', 'Mid-level positions typically requiring 2-5 years of experience'),
('senior', 'Senior', 'Senior positions typically requiring 5+ years of experience'),
('lead', 'Lead', 'Leadership positions requiring senior expertise plus team leadership'),
('executive', 'Executive', 'Executive positions (Director, VP, C-level roles)');
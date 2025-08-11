-- Create main entity tables for the Vita application

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  industry_id UUID,
  website TEXT,
  linkedin TEXT,
  country TEXT,
  culture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_companies_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_companies_industry_id 
    FOREIGN KEY (industry_id) REFERENCES public.industries(id),
  CONSTRAINT fk_companies_country 
    FOREIGN KEY (country) REFERENCES public.countries(iso_code)
);

-- Candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  linkedin TEXT,
  resume_url TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_candidates_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_candidates_country 
    FOREIGN KEY (country) REFERENCES public.countries(iso_code)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  initial_notes TEXT,
  rate NUMERIC(10,2),
  pay_freq TEXT,
  duration TEXT,
  commitment TEXT,
  location_reqs TEXT,
  regions TEXT[],
  countries TEXT[],
  timezone TEXT,
  job_description TEXT,
  linkedin_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_jobs_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_company_id 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_pay_freq 
    FOREIGN KEY (pay_freq) REFERENCES public.job_pay_frequencies(name),
  CONSTRAINT fk_jobs_duration 
    FOREIGN KEY (duration) REFERENCES public.job_durations(name),
  CONSTRAINT fk_jobs_commitment 
    FOREIGN KEY (commitment) REFERENCES public.job_commitment_types(name),
  CONSTRAINT fk_jobs_location_reqs 
    FOREIGN KEY (location_reqs) REFERENCES public.job_location_types(name),
  CONSTRAINT fk_jobs_timezone 
    FOREIGN KEY (timezone) REFERENCES public.timezones(name)
);

-- Note: Array validation will be handled at the application level
-- PostgreSQL doesn't support subqueries in check constraints

-- Enable RLS for main entity tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Add updated_at triggers for main entity tables
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_industry_id ON public.companies(industry_id);
CREATE INDEX IF NOT EXISTS idx_companies_country ON public.companies(country);

CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_country ON public.candidates(country);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_pay_freq ON public.jobs(pay_freq);
CREATE INDEX IF NOT EXISTS idx_jobs_duration ON public.jobs(duration);
CREATE INDEX IF NOT EXISTS idx_jobs_commitment ON public.jobs(commitment);
CREATE INDEX IF NOT EXISTS idx_jobs_location_reqs ON public.jobs(location_reqs);
CREATE INDEX IF NOT EXISTS idx_jobs_timezone ON public.jobs(timezone);
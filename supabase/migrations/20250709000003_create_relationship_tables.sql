-- Create relationship tables for the Vita application

-- Job requirements table
CREATE TABLE IF NOT EXISTS public.job_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  requirement TEXT NOT NULL,
  type TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  proficiency_level TEXT,
  weight NUMERIC(3,2) DEFAULT 0.50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_job_requirements_job_id 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_requirements_type 
    FOREIGN KEY (type) REFERENCES public.skill_types(name),
  CONSTRAINT fk_job_requirements_proficiency_level 
    FOREIGN KEY (proficiency_level) REFERENCES public.proficiency_levels(name),
  CONSTRAINT check_weight_range 
    CHECK (weight >= 0.00 AND weight <= 1.00)
);

-- Candidates skills table
CREATE TABLE IF NOT EXISTS public.candidates_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  skill TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  proficiency_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_candidates_skills_candidate_id 
    FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_candidates_skills_type 
    FOREIGN KEY (type) REFERENCES public.skill_types(name),
  CONSTRAINT fk_candidates_skills_source 
    FOREIGN KEY (source) REFERENCES public.skill_sources(name),
  CONSTRAINT fk_candidates_skills_proficiency_level 
    FOREIGN KEY (proficiency_level) REFERENCES public.proficiency_levels(name)
);

-- Job questions table
CREATE TABLE IF NOT EXISTS public.job_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_job_questions_job_id 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_questions_type 
    FOREIGN KEY (type) REFERENCES public.question_types(name)
);

-- Job interview transcript table
CREATE TABLE IF NOT EXISTS public.job_interview_transcript (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_job_interview_transcript_job_id 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_interview_transcript_candidate_id 
    FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE
);

-- Enable RLS for relationship tables
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_interview_transcript ENABLE ROW LEVEL SECURITY;

-- Add updated_at triggers for relationship tables
DROP TRIGGER IF EXISTS update_job_requirements_updated_at ON public.job_requirements;
CREATE TRIGGER update_job_requirements_updated_at
  BEFORE UPDATE ON public.job_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_skills_updated_at ON public.candidates_skills;
CREATE TRIGGER update_candidates_skills_updated_at
  BEFORE UPDATE ON public.candidates_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_questions_updated_at ON public.job_questions;
CREATE TRIGGER update_job_questions_updated_at
  BEFORE UPDATE ON public.job_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_interview_transcript_updated_at ON public.job_interview_transcript;
CREATE TRIGGER update_job_interview_transcript_updated_at
  BEFORE UPDATE ON public.job_interview_transcript
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_requirements_job_id ON public.job_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_job_requirements_type ON public.job_requirements(type);
CREATE INDEX IF NOT EXISTS idx_job_requirements_proficiency_level ON public.job_requirements(proficiency_level);
CREATE INDEX IF NOT EXISTS idx_job_requirements_weight ON public.job_requirements(weight);

CREATE INDEX IF NOT EXISTS idx_candidates_skills_candidate_id ON public.candidates_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_skills_type ON public.candidates_skills(type);
CREATE INDEX IF NOT EXISTS idx_candidates_skills_source ON public.candidates_skills(source);
CREATE INDEX IF NOT EXISTS idx_candidates_skills_proficiency_level ON public.candidates_skills(proficiency_level);

CREATE INDEX IF NOT EXISTS idx_job_questions_job_id ON public.job_questions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_questions_type ON public.job_questions(type);

CREATE INDEX IF NOT EXISTS idx_job_interview_transcript_job_id ON public.job_interview_transcript(job_id);
CREATE INDEX IF NOT EXISTS idx_job_interview_transcript_candidate_id ON public.job_interview_transcript(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_interview_transcript_job_candidate ON public.job_interview_transcript(job_id, candidate_id);
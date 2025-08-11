-- Create analysis and evaluation tables for the Vita application

-- Job candidate match analysis table
CREATE TABLE IF NOT EXISTS public.job_candidate_match_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  overall_score NUMERIC(3,2) NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_job_candidate_match_analysis_job_id 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_candidate_match_analysis_candidate_id 
    FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE,
  CONSTRAINT check_overall_score_range 
    CHECK (overall_score >= 0.00 AND overall_score <= 1.00),
  CONSTRAINT unique_job_candidate_match 
    UNIQUE (job_id, candidate_id)
);

-- Job candidate evaluation table (detailed requirement-by-requirement analysis)
CREATE TABLE IF NOT EXISTS public.job_candidate_evaluation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  job_requirement_id UUID NOT NULL,
  score NUMERIC(3,2) NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_job_candidate_evaluation_job_id 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_candidate_evaluation_candidate_id 
    FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_candidate_evaluation_job_requirement_id 
    FOREIGN KEY (job_requirement_id) REFERENCES public.job_requirements(id) ON DELETE CASCADE,
  CONSTRAINT check_score_range 
    CHECK (score >= 0.00 AND score <= 1.00),
  CONSTRAINT unique_job_candidate_requirement 
    UNIQUE (job_id, candidate_id, job_requirement_id)
);

-- Candidate interview evaluation table
CREATE TABLE IF NOT EXISTS public.candidate_interview_evaluation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_interview_transcript_id UUID NOT NULL,
  technical_skills_score NUMERIC(3,2),
  problem_solving_score NUMERIC(3,2),
  communication_collaboration_score NUMERIC(3,2),
  leadership_initiative_score NUMERIC(3,2),
  adaptability_learning_agility_score NUMERIC(3,2),
  cultural_fit_values_alignment_score NUMERIC(3,2),
  feedback TEXT,
  suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_candidate_interview_evaluation_transcript_id 
    FOREIGN KEY (job_interview_transcript_id) REFERENCES public.job_interview_transcript(id) ON DELETE CASCADE,
  CONSTRAINT check_technical_skills_score_range 
    CHECK (technical_skills_score IS NULL OR (technical_skills_score >= 0.00 AND technical_skills_score <= 1.00)),
  CONSTRAINT check_problem_solving_score_range 
    CHECK (problem_solving_score IS NULL OR (problem_solving_score >= 0.00 AND problem_solving_score <= 1.00)),
  CONSTRAINT check_communication_collaboration_score_range 
    CHECK (communication_collaboration_score IS NULL OR (communication_collaboration_score >= 0.00 AND communication_collaboration_score <= 1.00)),
  CONSTRAINT check_leadership_initiative_score_range 
    CHECK (leadership_initiative_score IS NULL OR (leadership_initiative_score >= 0.00 AND leadership_initiative_score <= 1.00)),
  CONSTRAINT check_adaptability_learning_agility_score_range 
    CHECK (adaptability_learning_agility_score IS NULL OR (adaptability_learning_agility_score >= 0.00 AND adaptability_learning_agility_score <= 1.00)),
  CONSTRAINT check_cultural_fit_values_alignment_score_range 
    CHECK (cultural_fit_values_alignment_score IS NULL OR (cultural_fit_values_alignment_score >= 0.00 AND cultural_fit_values_alignment_score <= 1.00)),
  CONSTRAINT unique_interview_evaluation 
    UNIQUE (job_interview_transcript_id)
);

-- Enable RLS for analysis and evaluation tables
ALTER TABLE public.job_candidate_match_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_candidate_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_interview_evaluation ENABLE ROW LEVEL SECURITY;

-- Add updated_at triggers for analysis and evaluation tables
DROP TRIGGER IF EXISTS update_job_candidate_match_analysis_updated_at ON public.job_candidate_match_analysis;
CREATE TRIGGER update_job_candidate_match_analysis_updated_at
  BEFORE UPDATE ON public.job_candidate_match_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_candidate_evaluation_updated_at ON public.job_candidate_evaluation;
CREATE TRIGGER update_job_candidate_evaluation_updated_at
  BEFORE UPDATE ON public.job_candidate_evaluation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_interview_evaluation_updated_at ON public.candidate_interview_evaluation;
CREATE TRIGGER update_candidate_interview_evaluation_updated_at
  BEFORE UPDATE ON public.candidate_interview_evaluation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_candidate_match_analysis_job_id ON public.job_candidate_match_analysis(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_match_analysis_candidate_id ON public.job_candidate_match_analysis(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_match_analysis_overall_score ON public.job_candidate_match_analysis(overall_score);

CREATE INDEX IF NOT EXISTS idx_job_candidate_evaluation_job_id ON public.job_candidate_evaluation(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_evaluation_candidate_id ON public.job_candidate_evaluation(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_evaluation_job_requirement_id ON public.job_candidate_evaluation(job_requirement_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_evaluation_score ON public.job_candidate_evaluation(score);

CREATE INDEX IF NOT EXISTS idx_candidate_interview_evaluation_transcript_id ON public.candidate_interview_evaluation(job_interview_transcript_id);
CREATE INDEX IF NOT EXISTS idx_candidate_interview_evaluation_technical_skills_score ON public.candidate_interview_evaluation(technical_skills_score);
CREATE INDEX IF NOT EXISTS idx_candidate_interview_evaluation_problem_solving_score ON public.candidate_interview_evaluation(problem_solving_score);
CREATE INDEX IF NOT EXISTS idx_candidate_interview_evaluation_communication_collaboration_score ON public.candidate_interview_evaluation(communication_collaboration_score);
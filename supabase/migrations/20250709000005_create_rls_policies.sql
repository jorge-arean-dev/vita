-- Create RLS policies for all tables in the Vita application

-- Lookup tables policies (read-only for authenticated users)
-- These tables are shared across all users for dropdown/reference purposes

-- Regions policies
CREATE POLICY "Authenticated users can read regions" 
  ON public.regions 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Countries policies
CREATE POLICY "Authenticated users can read countries" 
  ON public.countries 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Timezones policies
CREATE POLICY "Authenticated users can read timezones" 
  ON public.timezones 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Industries policies
CREATE POLICY "Authenticated users can read industries" 
  ON public.industries 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Job durations policies
CREATE POLICY "Authenticated users can read job durations" 
  ON public.job_durations 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Job pay frequencies policies
CREATE POLICY "Authenticated users can read job pay frequencies" 
  ON public.job_pay_frequencies 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Job commitment types policies
CREATE POLICY "Authenticated users can read job commitment types" 
  ON public.job_commitment_types 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Job location types policies
CREATE POLICY "Authenticated users can read job location types" 
  ON public.job_location_types 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Skill types policies
CREATE POLICY "Authenticated users can read skill types" 
  ON public.skill_types 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Proficiency levels policies
CREATE POLICY "Authenticated users can read proficiency levels" 
  ON public.proficiency_levels 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Skill sources policies
CREATE POLICY "Authenticated users can read skill sources" 
  ON public.skill_sources 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Question types policies
CREATE POLICY "Authenticated users can read question types" 
  ON public.question_types 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Main entity tables policies (user-specific data)

-- Companies policies
CREATE POLICY "Users can view own companies" 
  ON public.companies 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" 
  ON public.companies 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies" 
  ON public.companies 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Candidates policies
CREATE POLICY "Users can view own candidates" 
  ON public.candidates 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own candidates" 
  ON public.candidates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own candidates" 
  ON public.candidates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own candidates" 
  ON public.candidates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view own jobs" 
  ON public.jobs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" 
  ON public.jobs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" 
  ON public.jobs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" 
  ON public.jobs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Relationship tables policies

-- Job requirements policies
CREATE POLICY "Users can view job requirements for own jobs" 
  ON public.job_requirements 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_requirements.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert job requirements for own jobs" 
  ON public.job_requirements 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_requirements.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update job requirements for own jobs" 
  ON public.job_requirements 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_requirements.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete job requirements for own jobs" 
  ON public.job_requirements 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_requirements.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Candidates skills policies
CREATE POLICY "Users can view skills for own candidates" 
  ON public.candidates_skills 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = candidates_skills.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert skills for own candidates" 
  ON public.candidates_skills 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = candidates_skills.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update skills for own candidates" 
  ON public.candidates_skills 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = candidates_skills.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete skills for own candidates" 
  ON public.candidates_skills 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = candidates_skills.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

-- Job questions policies
CREATE POLICY "Users can view questions for own jobs" 
  ON public.job_questions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_questions.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions for own jobs" 
  ON public.job_questions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_questions.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions for own jobs" 
  ON public.job_questions 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_questions.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions for own jobs" 
  ON public.job_questions 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_questions.job_id 
      AND jobs.user_id = auth.uid()
    )
  );

-- Job interview transcript policies
CREATE POLICY "Users can view interview transcripts for own jobs and candidates" 
  ON public.job_interview_transcript 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_interview_transcript.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_interview_transcript.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interview transcripts for own jobs and candidates" 
  ON public.job_interview_transcript 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_interview_transcript.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_interview_transcript.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update interview transcripts for own jobs and candidates" 
  ON public.job_interview_transcript 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_interview_transcript.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_interview_transcript.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete interview transcripts for own jobs and candidates" 
  ON public.job_interview_transcript 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_interview_transcript.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_interview_transcript.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

-- Analysis and evaluation tables policies

-- Job candidate match analysis policies
CREATE POLICY "Users can view match analysis for own jobs and candidates" 
  ON public.job_candidate_match_analysis 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_match_analysis.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_match_analysis.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert match analysis for own jobs and candidates" 
  ON public.job_candidate_match_analysis 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_match_analysis.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_match_analysis.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update match analysis for own jobs and candidates" 
  ON public.job_candidate_match_analysis 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_match_analysis.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_match_analysis.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete match analysis for own jobs and candidates" 
  ON public.job_candidate_match_analysis 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_match_analysis.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_match_analysis.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

-- Job candidate evaluation policies
CREATE POLICY "Users can view detailed evaluation for own jobs and candidates" 
  ON public.job_candidate_evaluation 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_evaluation.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_evaluation.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert detailed evaluation for own jobs and candidates" 
  ON public.job_candidate_evaluation 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_evaluation.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_evaluation.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update detailed evaluation for own jobs and candidates" 
  ON public.job_candidate_evaluation 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_evaluation.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_evaluation.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete detailed evaluation for own jobs and candidates" 
  ON public.job_candidate_evaluation 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_evaluation.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_evaluation.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

-- Candidate interview evaluation policies
CREATE POLICY "Users can view interview evaluation for own interview transcripts" 
  ON public.candidate_interview_evaluation 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.job_interview_transcript jit
      JOIN public.jobs j ON j.id = jit.job_id
      JOIN public.candidates c ON c.id = jit.candidate_id
      WHERE jit.id = candidate_interview_evaluation.job_interview_transcript_id 
      AND j.user_id = auth.uid()
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interview evaluation for own interview transcripts" 
  ON public.candidate_interview_evaluation 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_interview_transcript jit
      JOIN public.jobs j ON j.id = jit.job_id
      JOIN public.candidates c ON c.id = jit.candidate_id
      WHERE jit.id = candidate_interview_evaluation.job_interview_transcript_id 
      AND j.user_id = auth.uid()
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update interview evaluation for own interview transcripts" 
  ON public.candidate_interview_evaluation 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.job_interview_transcript jit
      JOIN public.jobs j ON j.id = jit.job_id
      JOIN public.candidates c ON c.id = jit.candidate_id
      WHERE jit.id = candidate_interview_evaluation.job_interview_transcript_id 
      AND j.user_id = auth.uid()
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete interview evaluation for own interview transcripts" 
  ON public.candidate_interview_evaluation 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.job_interview_transcript jit
      JOIN public.jobs j ON j.id = jit.job_id
      JOIN public.candidates c ON c.id = jit.candidate_id
      WHERE jit.id = candidate_interview_evaluation.job_interview_transcript_id 
      AND j.user_id = auth.uid()
      AND c.user_id = auth.uid()
    )
  );
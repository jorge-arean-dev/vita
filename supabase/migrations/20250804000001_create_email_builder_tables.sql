-- Create email_types lookup table
CREATE TABLE IF NOT EXISTS public.email_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create email_builder_templates table
CREATE TABLE IF NOT EXISTS public.email_builder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_email_builder_templates_type FOREIGN KEY (type) REFERENCES public.email_types(name)
);

-- Create job_email_builder table
CREATE TABLE IF NOT EXISTS public.job_email_builder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL,
  candidate_id UUID,
  template UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_job_email_builder_user FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_job_email_builder_job FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_email_builder_candidate FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE SET NULL,
  CONSTRAINT fk_job_email_builder_template FOREIGN KEY (template) REFERENCES public.email_builder_templates(id),
  CONSTRAINT fk_job_email_builder_type FOREIGN KEY (type) REFERENCES public.email_types(name)
);

-- Create indexes for better performance
CREATE INDEX idx_job_email_builder_user_id ON public.job_email_builder(user_id);
CREATE INDEX idx_job_email_builder_job_id ON public.job_email_builder(job_id);
CREATE INDEX idx_job_email_builder_candidate_id ON public.job_email_builder(candidate_id);
CREATE INDEX idx_job_email_builder_template ON public.job_email_builder(template);
CREATE INDEX idx_job_email_builder_type ON public.job_email_builder(type);
CREATE INDEX idx_email_builder_templates_type ON public.email_builder_templates(type);

-- Create update trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_email_types_updated_at BEFORE UPDATE ON public.email_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_builder_templates_updated_at BEFORE UPDATE ON public.email_builder_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_email_builder_updated_at BEFORE UPDATE ON public.job_email_builder
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial email types
INSERT INTO public.email_types (name) VALUES 
  ('candidate'),
  ('client')
ON CONFLICT (name) DO NOTHING;
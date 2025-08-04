-- Enable RLS on all email builder tables
ALTER TABLE public.email_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_builder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_email_builder ENABLE ROW LEVEL SECURITY;

-- Email types policies (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to read email types"
  ON public.email_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Email builder templates policies (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to read email templates"
  ON public.email_builder_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Job email builder policies (users can only manage their own emails)
CREATE POLICY "Users can create their own job emails"
  ON public.job_email_builder
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own job emails"
  ON public.job_email_builder
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own job emails"
  ON public.job_email_builder
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job emails"
  ON public.job_email_builder
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON public.email_types TO authenticated;
GRANT SELECT ON public.email_builder_templates TO authenticated;
GRANT ALL ON public.job_email_builder TO authenticated;
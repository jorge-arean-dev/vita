-- Create waitlist_forms table for landing page form submissions
CREATE TABLE IF NOT EXISTS public.waitlist_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT,
  linkedin TEXT,
  role TEXT,
  industry TEXT,
  tools JSONB,
  ai_tools JSONB,
  trigger_source TEXT NOT NULL CHECK (trigger_source IN ('join_waitlist', 'vita_core', 'vita_custom')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add foreign key constraint for country (references countries.iso_code)
ALTER TABLE public.waitlist_forms 
ADD CONSTRAINT fk_waitlist_forms_country 
FOREIGN KEY (country) REFERENCES public.countries(iso_code);

-- Enable Row Level Security
ALTER TABLE public.waitlist_forms ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to insert their own waitlist forms
-- Note: This is a public waitlist form, so we allow inserts without user authentication
-- but we restrict access to reading the data
CREATE POLICY "Anyone can submit waitlist forms" ON public.waitlist_forms
FOR INSERT WITH CHECK (true);

-- Create policy to prevent reading waitlist data (only admins should access this)
CREATE POLICY "No public access to waitlist data" ON public.waitlist_forms
FOR SELECT USING (false);

-- Create index for faster lookups by email and creation date
CREATE INDEX IF NOT EXISTS idx_waitlist_forms_email ON public.waitlist_forms(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_forms_created_at ON public.waitlist_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_forms_trigger_source ON public.waitlist_forms(trigger_source);
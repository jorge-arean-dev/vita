-- Add subject column to job_email_builder table
ALTER TABLE public.job_email_builder 
ADD COLUMN subject TEXT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.job_email_builder.subject IS 'Email subject line. If NULL, subject should be extracted from body field for backward compatibility.';
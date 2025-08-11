-- Add unique constraint to email_builder_templates.name column
ALTER TABLE public.email_builder_templates 
ADD CONSTRAINT email_builder_templates_name_unique UNIQUE (name);
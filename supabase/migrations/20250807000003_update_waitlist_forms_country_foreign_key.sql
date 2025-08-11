-- Update waitlist_forms table to store country display names instead of ISO codes
-- and update foreign key constraint accordingly

-- First, drop the existing foreign key constraint (correct name from original migration)
ALTER TABLE public.waitlist_forms 
DROP CONSTRAINT IF EXISTS fk_waitlist_forms_country;

-- Add unique constraint to countries.display_name (required for foreign key reference)
ALTER TABLE public.countries 
ADD CONSTRAINT countries_display_name_unique 
UNIQUE (display_name);

-- Convert existing ISO codes to display names
UPDATE public.waitlist_forms 
SET country = (
  SELECT display_name 
  FROM public.countries 
  WHERE iso_code = waitlist_forms.country
)
WHERE country IS NOT NULL;

-- Add new foreign key constraint referencing countries.display_name
ALTER TABLE public.waitlist_forms 
ADD CONSTRAINT fk_waitlist_forms_country 
FOREIGN KEY (country) REFERENCES public.countries(display_name);

-- Add a comment explaining the change
COMMENT ON CONSTRAINT fk_waitlist_forms_country ON public.waitlist_forms IS 
'Foreign key constraint linking to countries display names for better readability in the waitlist data';
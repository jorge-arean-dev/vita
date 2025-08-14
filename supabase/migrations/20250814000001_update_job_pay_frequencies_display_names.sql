-- Update job_pay_frequencies display_name values and add yearly option
-- This migration updates existing display names and adds the yearly frequency option

-- Update existing display_name values to match UI requirements
UPDATE job_pay_frequencies SET display_name = 'hour' WHERE name = 'hourly';
UPDATE job_pay_frequencies SET display_name = 'week' WHERE name = 'weekly';
UPDATE job_pay_frequencies SET display_name = 'month' WHERE name = 'monthly';

-- Add the new yearly frequency option
INSERT INTO job_pay_frequencies (name, display_name) 
VALUES ('yearly', 'year')
ON CONFLICT (name) DO NOTHING;
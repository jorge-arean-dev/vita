-- Add github column to candidates table
ALTER TABLE candidates 
ADD COLUMN github TEXT;

-- Add comment for documentation
COMMENT ON COLUMN candidates.github IS 'GitHub profile URL of the candidate';
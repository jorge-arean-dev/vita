-- Add full_transcript column to interviews table for storing complete transcript JSON
-- This allows efficient querying without JOINs and supports PostgreSQL JSONB features

ALTER TABLE interviews 
ADD COLUMN full_transcript JSONB;

-- Create GIN index on the JSONB column for efficient JSON queries
CREATE INDEX idx_interviews_full_transcript 
ON interviews 
USING GIN (full_transcript);

-- Add comment explaining the JSON structure
COMMENT ON COLUMN interviews.full_transcript IS 
'Complete interview transcript in JSONB format. Structure: {"segments": [{"speaker": "string", "text": "string", "start_time": number, "end_time": number}], "metadata": {"bot_id": "string", "retrieved_at": "timestamp"}}';
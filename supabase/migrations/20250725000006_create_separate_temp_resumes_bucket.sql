-- Drop the old policies that were for temp_resumes folder within resumes bucket
DROP POLICY IF EXISTS "Public read access for temp_resumes folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload temporary resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own temporary resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own temporary resume files" ON storage.objects;

-- Create the temp_resumes bucket as a separate public bucket at root level
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp_resumes',
  'temp_resumes',
  true, -- Public bucket for API access
  5242880, -- 5MB file size limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
);

-- Policy: Users can upload their own temporary files to temp_resumes bucket
CREATE POLICY "Users can upload their own temp files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'temp_resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Public can read all temp files (needed for external API)
CREATE POLICY "Public read access for temp files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'temp_resumes'
);

-- Policy: Users can delete their own temp files from temp_resumes bucket
CREATE POLICY "Users can delete their own temp files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'temp_resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure resumes bucket remains private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'resumes';
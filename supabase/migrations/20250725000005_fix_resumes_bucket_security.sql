-- Make the resumes bucket private again
UPDATE storage.buckets 
SET public = false 
WHERE id = 'resumes';

-- Add policy for public read access to temp_resumes folder only
CREATE POLICY "Public read access for temp_resumes folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'temp_resumes'
);

-- Update the temporary upload policy to use temp_resumes path
DROP POLICY IF EXISTS "Users can upload temporary resume files" ON storage.objects;
CREATE POLICY "Users can upload temporary resume files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = 'temp_resumes'
);

-- Update the temporary view policy to use temp_resumes path
DROP POLICY IF EXISTS "Users can view their own temporary resume files" ON storage.objects;
CREATE POLICY "Users can view their own temporary resume files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = 'temp_resumes'
);

-- Update the temporary delete policy to use temp_resumes path
DROP POLICY IF EXISTS "Users can delete their own temporary resume files" ON storage.objects;
CREATE POLICY "Users can delete their own temporary resume files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = 'temp_resumes'
);
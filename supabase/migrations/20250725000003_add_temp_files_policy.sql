-- Policy: Users can upload temporary resume files
CREATE POLICY "Users can upload temporary resume files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = 'temp'
);

-- Policy: Users can view their own temporary resume files
CREATE POLICY "Users can view their own temporary resume files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = 'temp'
);

-- Policy: Users can delete their own temporary resume files
CREATE POLICY "Users can delete their own temporary resume files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = 'temp'
);

-- Temporary file policies created successfully
-- These policies handle temp/{userId}/{timestamp}/resume.{extension} file structure
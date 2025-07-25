-- Create the resumes storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false, -- Private bucket
  5242880, -- 5MB file size limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
);

-- Note: RLS is already enabled on storage.objects by default in Supabase

-- Policy: Users can upload resumes for their own candidates
CREATE POLICY "Users can upload resumes for their own candidates"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id::text = (storage.foldername(name))[2]
    AND candidates.user_id = auth.uid()
  )
);

-- Policy: Users can view resumes for their own candidates
CREATE POLICY "Users can view resumes for their own candidates"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id::text = (storage.foldername(name))[2]
    AND candidates.user_id = auth.uid()
  )
);

-- Policy: Users can update resumes for their own candidates
CREATE POLICY "Users can update resumes for their own candidates"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id::text = (storage.foldername(name))[2]
    AND candidates.user_id = auth.uid()
  )
);

-- Policy: Users can delete resumes for their own candidates
CREATE POLICY "Users can delete resumes for their own candidates"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id::text = (storage.foldername(name))[2]
    AND candidates.user_id = auth.uid()
  )
);

-- Storage bucket and policies created successfully
-- File structure: {userId}/{candidateId}/resume.{extension}
-- Policies ensure users can only access resumes for candidates they own
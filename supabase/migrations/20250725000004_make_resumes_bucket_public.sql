-- Make the resumes bucket public for API access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'resumes';

-- Note: Files are still protected by RLS policies, so only authorized users can upload/access
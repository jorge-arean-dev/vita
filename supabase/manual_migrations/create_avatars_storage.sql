-- Create a private storage bucket for avatars with proper error handling
BEGIN;

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create new policies
CREATE POLICY "Users can read their own avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create or replace the function to update avatar_url in profiles
CREATE OR REPLACE FUNCTION public.handle_avatar_upload()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  file_path TEXT;
BEGIN
  -- Extract the user ID from the file path
  user_id := (storage.foldername(NEW.name))[1]::UUID;
  
  -- Construct the file path for the avatar URL
  file_path := storage.storage_public_url(NEW.bucket_id, NEW.name);
  
  -- Update the avatar_url in the profiles table
  UPDATE public.profiles
  SET avatar_url = file_path
  WHERE user_id = user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_profile_avatar_url ON storage.objects;
CREATE TRIGGER update_profile_avatar_url
  AFTER INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION public.handle_avatar_upload();

COMMIT;

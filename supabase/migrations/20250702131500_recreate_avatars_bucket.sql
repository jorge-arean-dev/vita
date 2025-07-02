-- Recreate the avatars bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profile_avatar_url ON storage.objects;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_avatar_upload();

-- Create a new function that correctly handles private avatars
CREATE OR REPLACE FUNCTION public.handle_avatar_upload()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Extract the user ID from the file path
  user_id := (storage.foldername(NEW.name))[1]::UUID;
  
  -- Store just the file path in the avatar_url column
  -- The application will generate signed URLs when needed
  UPDATE public.profiles
  SET avatar_url = NEW.name
  WHERE user_id = user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update the profile when an avatar is uploaded
CREATE TRIGGER update_profile_avatar_url
  AFTER INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION public.handle_avatar_upload();

-- Note: RLS is already enabled by default in Supabase
-- We don't need to explicitly enable it

-- Policy for avatar uploads: Users can only upload to their own folder
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Policy for avatar access: Users can only access their own avatars
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
CREATE POLICY "Users can view their own avatars" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Policy for avatar updates: Users can only update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Policy for avatar deletion: Users can only delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1]::uuid = auth.uid()
);

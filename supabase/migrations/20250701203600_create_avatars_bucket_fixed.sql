-- Create a private storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Create a function to update the avatar_url in the profiles table
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

-- Create a trigger to update the profile when an avatar is uploaded
DROP TRIGGER IF EXISTS update_profile_avatar_url ON storage.objects;
CREATE TRIGGER update_profile_avatar_url
  AFTER INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION public.handle_avatar_upload();

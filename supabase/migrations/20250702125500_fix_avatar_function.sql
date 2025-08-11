-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_profile_avatar_url ON storage.objects;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_avatar_upload();

-- Create a new function that stores the path instead of trying to generate a URL
CREATE OR REPLACE FUNCTION public.handle_avatar_upload()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  file_path TEXT;
BEGIN
  -- Extract the user ID from the file path
  user_id := (storage.foldername(NEW.name))[1]::UUID;
  
  -- Store just the path information instead of trying to generate a URL
  -- This will be used by the application to generate signed URLs when needed
  file_path := NEW.name;
  
  -- Update the avatar_url in the profiles table
  UPDATE public.profiles
  SET avatar_url = file_path
  WHERE user_id = user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new trigger to update the profile when an avatar is uploaded
CREATE TRIGGER update_profile_avatar_url
  AFTER INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION public.handle_avatar_upload();

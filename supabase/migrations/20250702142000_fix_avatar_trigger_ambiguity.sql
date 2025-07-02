-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_profile_avatar_url ON storage.objects;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_avatar_upload();

-- Create a new function that correctly handles private avatars
-- with fixed variable naming to avoid ambiguity
CREATE OR REPLACE FUNCTION public.handle_avatar_upload()
RETURNS TRIGGER AS $$
DECLARE
  extracted_user_id UUID; -- Renamed variable to avoid ambiguity
BEGIN
  -- Extract the user ID from the file path
  extracted_user_id := (storage.foldername(NEW.name))[1]::UUID;
  
  -- Store just the file path in the avatar_url column
  -- The application will generate signed URLs when needed
  UPDATE public.profiles
  SET avatar_url = NEW.name
  WHERE user_id = extracted_user_id; -- Use the renamed variable
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update the profile when an avatar is uploaded
CREATE TRIGGER update_profile_avatar_url
  AFTER INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION public.handle_avatar_upload();

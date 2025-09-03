"use client";

import { useState, useRef, useEffect } from "react";
import { uploadAvatar } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StableAvatar } from "@/components/ui/stable-avatar";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, RotateCcw, WifiOff } from "lucide-react";
import { useAvatar } from "@/hooks/use-avatar";

interface AvatarFormProps {
  profile: {
    avatar_url: string | null;
    first_name: string | null;
    user_id: string;
    // Add other profile fields as needed
  } | null;
}

export default function AvatarForm({ profile }: AvatarFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const { signedAvatarUrl: avatarUrl, isLoading, error, clearAvatarCache, retry } = useAvatar({ 
    avatarUrl: profile?.avatar_url, 
    userId: profile?.user_id 
  });
  
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Clean up the object URL when component unmounts or when preview changes
      return () => URL.revokeObjectURL(objectUrl);
    }
  }
  
  function clearFileSelection() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPreviewUrl(null);
  }
  
  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    
    try {
      const result = await uploadAvatar(formData);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Your avatar has been updated.",
        });
        // Clear the preview after successful upload
        setPreviewUrl(null);
        // Clear avatar cache to force reload of new avatar
        if (profile?.user_id) {
          clearAvatarCache(profile.user_id);
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Get initials for avatar fallback
  const initials = profile?.first_name 
    ? profile.first_name.charAt(0).toUpperCase() 
    : "U";
  
  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Current or Preview Avatar */}
          <div className="relative">
            <StableAvatar
              key={`settings-avatar-${profile?.user_id}-${profile?.avatar_url}`}
              src={previewUrl || avatarUrl || undefined}
              alt="Profile picture"
              fallback={isLoading ? "..." : initials}
              className="h-24 w-24"
              imageClassName={isLoading ? "opacity-75" : ""}
              fallbackClassName={`text-2xl ${isLoading ? "opacity-75" : ""}`}
            />
            
            {previewUrl && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={clearFileSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {/* Error indicator and retry button */}
            {error && !previewUrl && (
              <div className="absolute -top-2 -right-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={retry}
                  title={`Avatar failed to load: ${error}. Click to retry.`}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {/* Network status indicator - only show after client hydration */}
            {hasMounted && typeof navigator !== 'undefined' && !navigator.onLine && (
              <div className="absolute -bottom-2 -right-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-white">
                  <WifiOff className="h-3 w-3" />
                </div>
              </div>
            )}
          </div>
          
          {/* File Input (hidden) */}
          <div className="space-y-2">
            <Label htmlFor="avatar" className="text-center block">
              {profile?.avatar_url || previewUrl 
                ? "Change profile picture" 
                : "Upload profile picture"}
            </Label>
            <input
              ref={fileInputRef}
              id="avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Select Image
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              JPEG, PNG, GIF or WebP. Max 5MB.
            </p>
          </div>
        </div>
      </div>
      
      <Button 
        type="submit" 
        disabled={isSubmitting || !previewUrl}
        className="w-full"
      >
        {isSubmitting ? "Uploading..." : "Upload Avatar"}
      </Button>
    </form>
  );
}

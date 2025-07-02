"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { uploadAvatar } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AvatarFormProps {
  profile: {
    avatar_url: string | null;
    first_name: string | null;
    // Add other profile fields as needed
  } | null;
}

export default function AvatarForm({ profile }: AvatarFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  
  // Generate a signed URL for the avatar if it exists
  useEffect(() => {
    async function getAvatarUrl() {
      if (profile?.avatar_url) {
        try {
          // Generate a signed URL that expires in 1 hour (3600 seconds)
          const { data, error } = await supabase
            .storage
            .from('avatars')
            .createSignedUrl(profile.avatar_url, 3600);
          
          if (data?.signedUrl && !error) {
            setAvatarUrl(data.signedUrl);
          } else if (error) {
            console.error('Error getting signed URL:', error);
          }
        } catch (error) {
          console.error('Error in getAvatarUrl:', error);
        }
      }
    }
    
    getAvatarUrl();
  }, [profile?.avatar_url]);
  
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
      }
    } catch (error) {
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
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={previewUrl || avatarUrl || undefined} 
                alt="Profile picture" 
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            
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

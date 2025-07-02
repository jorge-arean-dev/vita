"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";

interface UserAvatarDropdownProps {
  user: {
    id: string;
    email?: string;
  };
  profile?: {
    avatar_url: string | null;
    first_name: string | null;
  } | null;
}

export function UserAvatarDropdown({ user, profile: initialProfile }: UserAvatarDropdownProps) {
  const router = useRouter();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // Set up a real-time subscription to profile changes
  useEffect(() => {
    if (!user?.id) return;
    
    // Set up a real-time subscription to the profiles table
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          // Update avatar URL when profile changes
          if (payload.new.avatar_url) {
            getAvatarUrl(payload.new.avatar_url);
          } else {
            setAvatarUrl(null);
          }
        }
      )
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase]);

  // Generate a signed URL for the avatar with caching
  useEffect(() => {
    if (!initialProfile?.avatar_url) {
      setAvatarUrl(null);
      return;
    }
    
    // Check for cached URL first
    const cachedUrl = sessionStorage.getItem(`avatar_${initialProfile.avatar_url}`);
    if (cachedUrl) {
      setAvatarUrl(cachedUrl);
      return;
    }
    
    // If no cached URL, generate a new one
    getAvatarUrl(initialProfile.avatar_url);
  }, [initialProfile?.avatar_url]);
  
  // Function to get avatar URL from storage with caching
  async function getAvatarUrl(avatarPath: string) {
    try {
      // Generate a signed URL that expires in 1 hour (3600 seconds)
      const { data, error } = await supabase
        .storage
        .from('avatars')
        .createSignedUrl(avatarPath, 3600);
      
      if (data?.signedUrl && !error) {
        // Cache the URL in sessionStorage
        sessionStorage.setItem(`avatar_${avatarPath}`, data.signedUrl);
        setAvatarUrl(data.signedUrl);
      } else if (error) {
        setAvatarUrl(null);
      }
    } catch (error) {
      setAvatarUrl(null);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Get initials for avatar fallback - exactly matching settings implementation
  const initials = initialProfile?.first_name 
    ? initialProfile.first_name.charAt(0).toUpperCase() 
    : "U";

  // Memoize the avatar component to prevent unnecessary re-renders
  const avatarComponent = useMemo(() => (
    <Avatar className="h-8 w-8">
      {avatarUrl ? (
        <AvatarImage 
          src={avatarUrl} 
          alt="Profile picture" 
          className="object-cover"
          loading="eager"
          fetchPriority="high"
        />
      ) : (
        <AvatarFallback>{initials}</AvatarFallback>
      )}
    </Avatar>
  ), [avatarUrl, initials]);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {avatarComponent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="flex items-center">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import { logError, logInfo } from "@/lib/logging";
import { monitorAuthState, monitorNavigation, monitorAvatarLoading, diagnoseStorageState } from "@/lib/monitoring";

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
  const pathname = usePathname();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Create a user-specific cache key to prevent stale data between users
  const cacheKeyPrefix = useMemo(() => `avatar_${user.id}_`, [user.id]);
  
  // Diagnose storage state on component mount in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const storageState = diagnoseStorageState();
      logInfo('Storage', 'Storage state on mount', storageState);
    }
  }, []);
  // Function to get avatar URL from storage with caching
  const getAvatarUrl = useCallback(async (avatarPath: string) => {
    try {
      logInfo('Avatar', `Fetching avatar for user ${user.id}`);
      monitorAvatarLoading('fetch', user.id);

      // Generate a signed URL that expires in 60 minutes
      const { data, error } = await supabase
        .storage
        .from('avatars')
        .createSignedUrl(avatarPath, 3600);

      if (data?.signedUrl && !error) {
        // Cache the signed URL
        const cacheKey = `${cacheKeyPrefix}${avatarPath}`;
        try {
          sessionStorage.setItem(cacheKey, data.signedUrl);
          monitorAvatarLoading('cache_hit', user.id);
        } catch (error) {
          // Handle errors with sessionStorage
          logError('Avatar', error);
          monitorAvatarLoading('error', user.id);
        }

        setAvatarUrl(data.signedUrl);
      } else {
        setAvatarUrl(null);
        logInfo('Avatar', `Failed to get signed URL for ${avatarPath}`);
      }
    } catch (error) {
      setAvatarUrl(null);
      logError('Avatar', error);
      monitorAvatarLoading('error', user.id);
    }
  }, [cacheKeyPrefix, supabase, user.id]);

  // Clear previous user's avatar cache
  const clearPreviousUserCache = useCallback(() => {
    try {
      // Find and remove all avatar cache entries for previous users
      const keysToRemove: string[] = [];
      
      // Identify avatar cache entries for previous users
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('avatar_') && !key.startsWith(cacheKeyPrefix)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove the identified entries
      if (keysToRemove.length > 0) {
        logInfo('Avatar', `Clearing ${keysToRemove.length} stale avatar cache entries`);
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      }
    } catch (error) {
      // Handle errors with sessionStorage
      logError('Avatar', error);
    }
  }, [cacheKeyPrefix]);

  // Set up a real-time subscription to profile changes
  useEffect(() => {
    if (!user?.id) return;
    
    // Clear previous avatar cache when user changes
    clearPreviousUserCache();
    
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
            logInfo('Avatar', `Profile updated via realtime for user ${user.id}`);
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
  }, [user?.id, supabase, cacheKeyPrefix, clearPreviousUserCache, getAvatarUrl]);



  // Generate a signed URL for the avatar with caching
  useEffect(() => {
    if (!initialProfile?.avatar_url) {
      setAvatarUrl(null);
      return;
    }

    // Use user-specific cache key to prevent stale data
    const cacheKey = `${cacheKeyPrefix}${initialProfile.avatar_url}`;

    // Check for cached URL first
    try {
      const cachedUrl = sessionStorage.getItem(cacheKey);
      if (cachedUrl) {
        logInfo('Avatar', `Using cached avatar for user ${user.id}`);
        monitorAvatarLoading('cache_hit', user.id);
        setAvatarUrl(cachedUrl);
        return;
      } else {
        monitorAvatarLoading('cache_miss', user.id);
      }
    } catch (error) {
      // Handle errors with sessionStorage (e.g., in Safari private mode)
      logError('Avatar', error);
      monitorAvatarLoading('error', user.id);
    }

    // If no cached URL, generate a new one
    getAvatarUrl(initialProfile.avatar_url);
  }, [initialProfile?.avatar_url, cacheKeyPrefix, user.id, getAvatarUrl]);

  const handleLogout = async () => {
    try {
      // Clear all avatar caches on logout
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('avatar_')) {
            sessionStorage.removeItem(key);
          }
        }
      } catch (storageError) {
        logError('Logout', storageError);
      }
      
      // Sign out the user
      const userId = user.id; // Capture user ID before logout for monitoring
      await supabase.auth.signOut();
      logInfo('Auth', 'User logged out successfully');
      monitorAuthState('logout', true, userId);
      monitorNavigation(pathname || 'unknown', '/', { sampleRate: 1.0 }); // Always monitor logout navigation
      router.push("/");
    } catch (error) {
      logError('Logout', error);
      monitorAuthState('logout', false, user.id);
      // Still try to redirect even if there was an error
      router.push("/");
    }
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
          // Add key to force re-render when URL changes
          key={avatarUrl}
        />
      ) : (
        <AvatarFallback>{initials}</AvatarFallback>
      )}
    </Avatar>
  ), [avatarUrl, initials]);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          {avatarComponent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link 
            href="/settings" 
            className="flex items-center"
            // Use replace instead of push to avoid navigation history issues
            // This helps prevent back button problems with authentication
            replace
            onClick={() => {
              monitorNavigation(pathname || 'unknown', '/settings', { sampleRate: 0.5 });
            }}
          >
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

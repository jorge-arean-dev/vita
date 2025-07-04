"use client";

import { useState, useEffect } from "react";
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
import { monitorAuthState, monitorNavigation, monitorAvatarLoading } from "@/lib/monitoring";

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
  
  // Log production information
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      logInfo('Avatar', `UserAvatarDropdown mounted for user ${user.id}`);
    }
  }, [user.id]);

  // Generate a signed URL for the avatar with caching - simplified to match settings page approach
  useEffect(() => {
    async function getAvatarUrl() {
      if (!initialProfile?.avatar_url) {
        setAvatarUrl(null);
        return;
      }
      
      // Use simple cache key format matching settings page
      const cacheKey = `avatar_${initialProfile.avatar_url}`;
      
      // Check for cached URL first
      try {
        const cachedUrl = sessionStorage.getItem(cacheKey);
        if (cachedUrl) {
          logInfo('Avatar', `Using cached avatar in header for user ${user.id}`);
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
      try {
        logInfo('Avatar', `Fetching avatar in header for user ${user.id}`);
        monitorAvatarLoading('fetch', user.id);
        
        // Generate a signed URL that expires in 1 hour (3600 seconds)
        const { data, error } = await supabase
          .storage
          .from('avatars')
          .createSignedUrl(initialProfile.avatar_url, 3600);
        
        if (data?.signedUrl && !error) {
          // Cache the URL in sessionStorage with simple key
          try {
            sessionStorage.setItem(cacheKey, data.signedUrl);
            logInfo('Avatar', `Cached avatar in header for user ${user.id}`);
          } catch (storageError) {
            // Handle errors with sessionStorage
            logError('Avatar', storageError);
          }
          
          setAvatarUrl(data.signedUrl);
        } else if (error) {
          logError('Avatar', error);
          setAvatarUrl(null);
        }
      } catch (error) {
        logError('Avatar', error);
        setAvatarUrl(null);
      }
    }
    
    getAvatarUrl();
  }, [initialProfile?.avatar_url, supabase, user.id]);

  const handleLogout = async () => {
    try {
      // Clear all avatar caches on logout - keep this functionality
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('avatar_')) {
            sessionStorage.removeItem(key);
            logInfo('Logout', `Cleared avatar cache: ${key}`);
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

  // Simplified avatar component without memoization
  const avatarComponent = (
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
  );
  
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
            href="/protected/settings" 
            className="flex items-center"
            // Use replace instead of push to avoid navigation history issues
            // This helps prevent back button problems with authentication
            replace
            onClick={() => {
              // Always monitor settings navigation in production
              if (process.env.NODE_ENV === 'production') {
                monitorNavigation(pathname || 'unknown', '/protected/settings', { sampleRate: 1.0 });
                logInfo('Navigation', `Navigating from ${pathname} to /protected/settings`);
              }
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

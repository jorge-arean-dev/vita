"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseAvatarOptions {
  avatarUrl?: string | null;
  userId?: string | null;
}

export function useAvatar({ avatarUrl, userId }: UseAvatarOptions) {
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function getAvatarUrl() {
      if (!avatarUrl || !userId) {
        setSignedAvatarUrl(null);
        return;
      }

      setIsLoading(true);

      try {
        // Create a unique cache key using userId and avatarUrl path
        const cacheKey = `avatar_${userId}_${avatarUrl}`;
        
        // Check for cached URL first
        const cachedUrl = sessionStorage.getItem(cacheKey);
        if (cachedUrl) {
          // Verify the cached URL hasn't expired
          try {
            const urlObj = new URL(cachedUrl);
            const expiresParam = urlObj.searchParams.get('Expires');
            if (expiresParam) {
              const expiresTime = parseInt(expiresParam) * 1000; // Convert to milliseconds
              if (Date.now() < expiresTime) {
                setSignedAvatarUrl(cachedUrl);
                setIsLoading(false);
                return;
              } else {
                // Remove expired cache entry
                sessionStorage.removeItem(cacheKey);
              }
            }
          } catch {
            // If URL parsing fails, remove invalid cache entry
            sessionStorage.removeItem(cacheKey);
          }
        }
        
        // Generate a signed URL that expires in 1 hour (3600 seconds)
        const { data, error } = await supabase
          .storage
          .from('avatars')
          .createSignedUrl(avatarUrl, 3600);
        
        if (data?.signedUrl && !error) {
          // Cache the URL with user-specific key
          sessionStorage.setItem(cacheKey, data.signedUrl);
          setSignedAvatarUrl(data.signedUrl);
        } else if (error) {
          console.error('Error getting signed URL:', error);
          setSignedAvatarUrl(null);
        }
      } catch (error) {
        console.error('Error in getAvatarUrl:', error);
        setSignedAvatarUrl(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    getAvatarUrl();
  }, [avatarUrl, userId, supabase.storage]);

  // Function to clear avatar cache for a specific user
  const clearAvatarCache = (userIdToClear?: string) => {
    const targetUserId = userIdToClear || userId;
    if (!targetUserId) return;

    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(`avatar_${targetUserId}_`)) {
        sessionStorage.removeItem(key);
      }
    });
  };

  // Function to clear all avatar caches
  const clearAllAvatarCaches = () => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('avatar_') || key.startsWith('user_') || key.startsWith('profile_')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  return {
    signedAvatarUrl,
    isLoading,
    clearAvatarCache,
    clearAllAvatarCaches
  };
}
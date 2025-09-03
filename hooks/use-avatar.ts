"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Global request deduplication to prevent cross-component duplicates
const globalRequestMap = new Map<string, Promise<{ signedUrl: string } | null>>();

interface UseAvatarOptions {
  avatarUrl?: string | null;
  userId?: string | null;
  maxRetries?: number;
  retryDelay?: number;
}

interface RetryState {
  count: number;
  timer?: NodeJS.Timeout;
}

export function useAvatar({ 
  avatarUrl, 
  userId,
  maxRetries = 3,
  retryDelay = 1000 
}: UseAvatarOptions) {
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const retryStateRef = useRef<RetryState>({ count: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastValidUrlRef = useRef<string | null>(null);
  const currentAvatarPathRef = useRef<string | null>(null);
  const requestInProgressRef = useRef<boolean>(false);

  // Function to calculate exponential backoff delay
  const getBackoffDelay = useCallback((retryCount: number) => {
    return Math.min(retryDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }, [retryDelay]);

  // Function to check if error is network-related
  const isNetworkError = (error: unknown): boolean => {
    if (!error) return false;
    
    const errorMessage = error.toString().toLowerCase();
    const hasNetworkErrorMessage = (
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('err_internet_disconnected') ||
      errorMessage.includes('err_network')
    );
    
    const hasNetworkErrorProps = error && typeof error === 'object' && (
      ('name' in error && error.name === 'NetworkError') ||
      ('code' in error && (error.code === 'ERR_NETWORK' || error.code === 'ERR_INTERNET_DISCONNECTED'))
    );
    
    return hasNetworkErrorMessage || hasNetworkErrorProps;
  };

  const getAvatarUrl = useCallback(async (retryCount: number = 0, forceRefresh: boolean = false) => {
    if (!avatarUrl || !userId) {
      setSignedAvatarUrl(null);
      setError(null);
      lastValidUrlRef.current = null;
      currentAvatarPathRef.current = null;
      requestInProgressRef.current = false;
      return;
    }

    // Global request deduplication - prevent ALL duplicate requests
    const requestKey = `${userId}_${avatarUrl}`;
    const cacheKey = `avatar_${userId}_${avatarUrl}`;
    
    // Check if request is already in progress globally
    if (!forceRefresh && globalRequestMap.has(requestKey)) {
      console.log('Avatar request already in progress globally, using existing promise');
      try {
        const existingResult = await globalRequestMap.get(requestKey);
        if (existingResult?.signedUrl) {
          sessionStorage.setItem(cacheKey, existingResult.signedUrl);
          setSignedAvatarUrl(existingResult.signedUrl);
          lastValidUrlRef.current = existingResult.signedUrl;
          setError(null);
        }
        return;
      } catch {
        // If existing request failed, allow new request to proceed
        globalRequestMap.delete(requestKey);
      }
    }
    
    // Prevent multiple simultaneous requests from same component
    if (requestInProgressRef.current && !forceRefresh) {
      console.log('Component request already in progress, skipping duplicate');
      return;
    }

    // If avatar path changed, reset everything
    if (currentAvatarPathRef.current !== avatarUrl) {
      lastValidUrlRef.current = null;
      currentAvatarPathRef.current = avatarUrl;
      setSignedAvatarUrl(null);
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Mark request as in progress
    requestInProgressRef.current = true;

    // Only show loading state if we don't have a cached URL to display
    if (!lastValidUrlRef.current || forceRefresh) {
      setIsLoading(true);
    }
    setError(null);

    try {
        // Check for cached URL first (unless forcing refresh)
        if (!forceRefresh) {
          const cachedUrl = sessionStorage.getItem(cacheKey);
          if (cachedUrl) {
            // Verify the cached URL hasn't expired
            try {
              const urlObj = new URL(cachedUrl);
              const expiresParam = urlObj.searchParams.get('Expires') || urlObj.searchParams.get('exp');
              if (expiresParam) {
                const expiresTime = parseInt(expiresParam) * 1000; // Convert to milliseconds
                // Add 5 minute buffer to prevent expiration during use
                const bufferTime = 5 * 60 * 1000;
                if (Date.now() < (expiresTime - bufferTime)) {
                  setSignedAvatarUrl(cachedUrl);
                  lastValidUrlRef.current = cachedUrl;
                  setIsLoading(false);
                  return;
                } else {
                  // Remove expired cache entry but keep displaying current URL
                  sessionStorage.removeItem(cacheKey);
                }
              }
            } catch {
              // If URL parsing fails, remove invalid cache entry
              sessionStorage.removeItem(cacheKey);
            }
          }
        }
        
        // Create and register the request promise globally
        const requestPromise = supabase
          .storage
          .from('avatars')
          .createSignedUrl(avatarUrl, 3600);
          
        globalRequestMap.set(requestKey, requestPromise.then(result => result.data));
        
        // Generate a signed URL that expires in 1 hour (3600 seconds)
        const { data, error } = await requestPromise;
        
        if (data?.signedUrl && !error) {
          // Cache the URL with user-specific key
          sessionStorage.setItem(cacheKey, data.signedUrl);
          setSignedAvatarUrl(data.signedUrl);
          lastValidUrlRef.current = data.signedUrl;
          setError(null);
          retryStateRef.current = { count: 0 }; // Reset retry count on success
          
          // Clean up global request map on success
          globalRequestMap.delete(requestKey);
        } else if (error) {
          throw error;
        }
      } catch (error: unknown) {
        // Check if request was aborted
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
          return;
        }

        // Handle network errors with retry logic
        if (isNetworkError(error) && retryCount < maxRetries) {
          const delay = getBackoffDelay(retryCount);
          console.warn(
            `Network error fetching avatar, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`,
            error
          );
          
          retryStateRef.current = {
            count: retryCount + 1,
            timer: setTimeout(() => {
              getAvatarUrl(retryCount + 1);
            }, delay)
          };
        } else {
          // Final failure or non-network error
          const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' 
            ? error.message 
            : 'Failed to load avatar';
          console.error('Error getting signed URL:', error);
          setError(errorMessage);
          // Keep last valid URL if available, don't clear it immediately
          if (!lastValidUrlRef.current) {
            setSignedAvatarUrl(null);
          }
          retryStateRef.current = { count: 0 };
        }
      } finally {
        setIsLoading(false);
        requestInProgressRef.current = false;
        
        // Always clean up global request map
        globalRequestMap.delete(requestKey);
      }
  }, [avatarUrl, userId, supabase.storage, maxRetries, getBackoffDelay]);
  useEffect(() => {
    getAvatarUrl();

    // Cleanup function
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear any pending retry timers
      if (retryStateRef.current.timer) {
        clearTimeout(retryStateRef.current.timer);
      }
    };
  }, [getAvatarUrl]);

  // Add visibility change handler to retry on page focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && error && avatarUrl && userId) {
        // Retry loading when page becomes visible if there was an error
        getAvatarUrl();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [error, avatarUrl, userId, getAvatarUrl]);

  // Add online/offline event handlers
  useEffect(() => {
    const handleOnline = () => {
      if (error && avatarUrl && userId) {
        console.log('Network connection restored, retrying avatar load');
        getAvatarUrl();
      }
    };

    const handleOffline = () => {
      console.log('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, avatarUrl, userId, getAvatarUrl]);

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

  // Manual retry function
  const retry = useCallback(() => {
    if (!isLoading) {
      retryStateRef.current = { count: 0 };
      getAvatarUrl(0, true); // Force refresh on manual retry
    }
  }, [isLoading, getAvatarUrl]);

  // Force refresh function (clears cache)
  const refreshAvatar = useCallback(() => {
    if (avatarUrl && userId) {
      const cacheKey = `avatar_${userId}_${avatarUrl}`;
      sessionStorage.removeItem(cacheKey);
      retryStateRef.current = { count: 0 };
      getAvatarUrl(0, true);
    }
  }, [avatarUrl, userId, getAvatarUrl]);

  return {
    signedAvatarUrl,
    isLoading,
    error,
    clearAvatarCache,
    clearAllAvatarCaches,
    retry,
    refreshAvatar
  };
}
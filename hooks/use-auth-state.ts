"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to monitor auth state changes and handle cache invalidation
 */
export function useAuthState() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle auth state changes
      if (event === 'SIGNED_OUT') {
        // Clear all client-side caches
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
          localStorage.clear();
          
          // Clear any additional caches
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('avatar_') || key.startsWith('user_') || key.startsWith('profile_')) {
              sessionStorage.removeItem(key);
            }
          });
        }
        
        // Force redirect to home
        window.location.href = '/';
      } else if (event === 'SIGNED_IN') {
        // Force router refresh to get fresh data
        router.refresh();
      } else if (event === 'TOKEN_REFRESHED') {
        // Force router refresh on token refresh to ensure fresh data
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);
}

/**
 * Force clear all user-related caches
 */
export function clearUserCaches() {
  if (typeof window !== 'undefined') {
    // Clear all storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Also clear any potential service worker caches if they exist
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  }
}
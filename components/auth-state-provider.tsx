"use client";

import { useAuthState } from '@/hooks/use-auth-state';

/**
 * Provider component to monitor auth state changes globally
 */
export function AuthStateProvider({ children }: { children: React.ReactNode }) {
  useAuthState();
  
  return <>{children}</>;
}
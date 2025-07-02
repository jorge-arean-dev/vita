/**
 * Monitoring utilities for Vercel-specific issues
 * This helps track and diagnose session/cookie problems that only occur in production
 */

import { logInfo, logError } from "./logging";

interface MonitoringOptions {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of requests to monitor
}

// Default to enabled in production only, with 10% sampling
const defaultOptions: MonitoringOptions = {
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 0.1
};

/**
 * Monitor authentication state changes
 */
export function monitorAuthState(
  action: 'login' | 'logout' | 'session_check', 
  success: boolean,
  userId?: string,
  options: Partial<MonitoringOptions> = {}
) {
  const opts = { ...defaultOptions, ...options };
  
  if (!opts.enabled || Math.random() > opts.sampleRate) return;
  
  try {
    logInfo('Monitor', `Auth action: ${action}`, { 
      success, 
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      isVercel: process.env.VERCEL === '1'
    });
  } catch (error) {
    // Never let monitoring interfere with the application
    console.error('Monitoring error:', error);
  }
}

/**
 * Monitor navigation events that might affect session state
 */
export function monitorNavigation(
  from: string,
  to: string,
  options: Partial<MonitoringOptions> = {}
) {
  const opts = { ...defaultOptions, ...options };
  
  if (!opts.enabled || Math.random() > opts.sampleRate) return;
  
  try {
    logInfo('Monitor', `Navigation: ${from} → ${to}`, {
      timestamp: new Date().toISOString(),
      isVercel: process.env.VERCEL === '1'
    });
  } catch (error) {
    // Never let monitoring interfere with the application
    console.error('Monitoring error:', error);
  }
}

/**
 * Monitor avatar loading and caching
 */
export function monitorAvatarLoading(
  action: 'fetch' | 'cache_hit' | 'cache_miss' | 'error',
  userId: string,
  options: Partial<MonitoringOptions> = {}
) {
  const opts = { ...defaultOptions, ...options };
  
  if (!opts.enabled || Math.random() > opts.sampleRate) return;
  
  try {
    logInfo('Monitor', `Avatar ${action}`, {
      userId,
      timestamp: new Date().toISOString(),
      isVercel: process.env.VERCEL === '1'
    });
  } catch (error) {
    // Never let monitoring interfere with the application
    console.error('Monitoring error:', error);
  }
}

/**
 * Check if the environment has all required cookies for authentication
 * Returns true if all required cookies are present
 */
export function checkAuthCookies(cookieNames: string[]): boolean {
  // These are the critical Supabase auth cookie prefixes
  const requiredPrefixes = ['sb-', 'supabase-auth-token'];
  
  return requiredPrefixes.some(prefix => 
    cookieNames.some(name => name.startsWith(prefix))
  );
}

/**
 * Diagnostic function to check browser storage state
 * This can help identify issues with sessionStorage or localStorage
 */
export function diagnoseStorageState(): { 
  sessionStorageAvailable: boolean;
  localStorageAvailable: boolean;
  sessionStorageKeys: string[];
  localStorageKeys: string[];
} {
  const result = {
    sessionStorageAvailable: false,
    localStorageAvailable: false,
    sessionStorageKeys: [] as string[],
    localStorageKeys: [] as string[]
  };
  
  try {
    // Check sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      result.sessionStorageAvailable = true;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) result.sessionStorageKeys.push(key);
      }
    }
    
    // Check localStorage
    if (typeof localStorage !== 'undefined') {
      result.localStorageAvailable = true;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) result.localStorageKeys.push(key);
      }
    }
  } catch (error) {
    // Storage might be disabled (e.g., Safari private mode)
    logError('Storage', error);
  }
  
  return result;
}

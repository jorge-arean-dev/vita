/**
 * Utility functions for consistent logging in production environments
 * Helps debug Vercel-specific issues that don't occur locally
 */

/**
 * Log an error with context in production environments
 */
export function logError(context: string, error: unknown) {
  // Only log detailed errors in production
  if (process.env.NODE_ENV === 'production') {
    console.error(`[${context}] Error:`, error);
  }
}

/**
 * Log information with context in production environments
 */
export function logInfo(context: string, message: string, data?: Record<string, unknown>) {
  // Only log in production
  if (process.env.NODE_ENV === 'production') {
    console.log(`[${context}] ${message}`, data || '');
  }
}

/**
 * Log warnings with context in production environments
 */
export function logWarning(context: string, message: string, data?: Record<string, unknown>) {
  // Only log in production
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[${context}] ${message}`, data || '');
  }
}

/**
 * Log authentication-related events in production
 */
export function logAuth(action: string, userId?: string, success: boolean = true) {
  if (process.env.NODE_ENV === 'production') {
    const status = success ? 'Success' : 'Failed';
    console.log(`[Auth] ${action} - ${status}${userId ? ` - User: ${userId}` : ''}`);
  }
}

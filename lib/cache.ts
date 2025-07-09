import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Cache management utilities for user-specific data
 */
export class CacheManager {
  /**
   * Revalidate all user-specific cache entries
   */
  static revalidateUserData(userId: string) {
    // Revalidate user-specific tags
    revalidateTag(`user:${userId}`);
    revalidateTag(`profile:${userId}`);
    
    // Revalidate protected paths
    revalidatePath('/protected');
    revalidatePath('/protected/settings');
    revalidatePath('/settings');
  }

  /**
   * Revalidate profile-specific cache entries
   */
  static revalidateUserProfile(userId: string) {
    revalidateTag(`profile:${userId}`);
    revalidateTag(`avatar:${userId}`);
  }

  /**
   * Clear all caches (for logout)
   */
  static revalidateAll() {
    revalidatePath('/protected', 'layout');
    revalidatePath('/settings', 'layout');
  }

  /**
   * Get cache tags for a user
   */
  static getUserTags(userId: string): string[] {
    return [`user:${userId}`, `profile:${userId}`];
  }

  /**
   * Get cache tags for user avatar
   */
  static getAvatarTags(userId: string): string[] {
    return [`avatar:${userId}`, `profile:${userId}`];
  }
}

/**
 * Higher-order function to add user-specific cache tags to fetch operations
 */
export function withUserCache<T>(
  operation: () => Promise<T>, 
  userId: string
): Promise<T> {
  // This would be used with fetch operations that support cache tags
  // For now, we'll just return the operation as-is since Supabase handles its own caching
  return operation();
}
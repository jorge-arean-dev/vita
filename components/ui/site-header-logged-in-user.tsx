"use client"

import { useState, useEffect } from "react"
import { LogOut, RotateCcw, WifiOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { StableAvatar } from "@/components/ui/stable-avatar"
import { useAvatar } from "@/hooks/use-avatar"

interface HeaderProps {
  avatarUrl?: string | null
  firstName?: string | null
  userId?: string | null
}

export default function Header({ avatarUrl, firstName, userId }: HeaderProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const { signedAvatarUrl, isLoading, error, clearAllAvatarCaches, retry } = useAvatar({ avatarUrl, userId })

  // Fix hydration mismatch by ensuring client-only rendering of avatar
  useEffect(() => {
    setHasMounted(true)
  }, [])

  const logout = async () => {
    const supabase = createClient()
    
    // Clear all user-specific cache items on logout
    clearAllAvatarCaches();
    
    // Clear all localStorage and sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.clear();
    }
    
    await supabase.auth.signOut()
    
    // Force a hard navigation to clear any cached state
    window.location.href = "/";
  }

  // Get first letter of first name for avatar fallback
  const fallbackInitial = firstName ? firstName.charAt(0).toUpperCase() : "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/protected" className="flex items-center space-x-2">
          <div className="relative h-12 w-12">
            <Image
              src="/logo/vita-logo-light.svg"
              alt="Vita Logo"
              width={64}
              height={64}
              className="dark:hidden"
              priority
            />
            <Image
              src="/logo/vita-logo-dark.svg"
              alt="Vita Logo"
              width={64}
              height={64}
              className="hidden dark:block"
              priority
            />
          </div>
          
        </Link>

        {/* Navigation Links - Center */}

        {/* Mobile Navigation Button */}

        {/* User Actions */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            <StableAvatar
              key={`header-avatar-${userId}-${avatarUrl}`}
              src={hasMounted ? signedAvatarUrl : null}
              alt="User avatar"
              fallback={isLoading ? "..." : fallbackInitial}
              className="h-8 w-8"
              imageClassName={isLoading ? "opacity-75" : ""}
              fallbackClassName={isLoading ? "opacity-75" : ""}
            />
            
            {/* Error indicator and retry button */}
            {error && (
              <div className="absolute -top-1 -right-1">
                <button
                  onClick={retry}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                  title={`Avatar failed to load: ${error}. Click to retry.`}
                  aria-label="Retry loading avatar"
                >
                  <RotateCcw className="h-2 w-2" />
                </button>
              </div>
            )}
            
            {/* Network status indicator - only show after client hydration */}
            {hasMounted && typeof navigator !== 'undefined' && !navigator.onLine && (
              <div className="absolute -bottom-1 -right-1">
                <div className="flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500 text-white">
                  <WifiOff className="h-1.5 w-1.5" />
                </div>
              </div>
            )}
          </div>

          {/* Logout Icon */}
          <button 
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

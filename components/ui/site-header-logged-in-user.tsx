"use client"

import { Building2, LogOut } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatar } from "@/hooks/use-avatar"

interface HeaderProps {
  avatarUrl?: string | null
  firstName?: string | null
  userId?: string | null
}

export default function Header({ avatarUrl, firstName, userId }: HeaderProps) {
  const { signedAvatarUrl, clearAllAvatarCaches } = useAvatar({ avatarUrl, userId })

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
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/protected" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Vita</span>
        </Link>

        {/* Navigation Links - Center */}

        {/* Mobile Navigation Button */}

        {/* User Actions */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-8 w-8">
              {signedAvatarUrl ? (
                <AvatarImage src={signedAvatarUrl} alt="User avatar" />
              ) : null}
              <AvatarFallback>{fallbackInitial}</AvatarFallback>
            </Avatar>
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

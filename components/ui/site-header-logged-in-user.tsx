"use client"

import { Building2, LogOut } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"

interface HeaderProps {
  avatarUrl?: string | null
  firstName?: string | null
}

export default function Header({ avatarUrl, firstName }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null)
  
  // Generate a signed URL for the avatar if it exists
  useEffect(() => {
    async function getAvatarUrl() {
      if (avatarUrl) {
        try {
          // Generate a signed URL that expires in 1 hour (3600 seconds)
          const { data, error } = await supabase
            .storage
            .from('avatars')
            .createSignedUrl(avatarUrl, 3600);
          
          if (data?.signedUrl && !error) {
            setSignedAvatarUrl(data.signedUrl);
          } else if (error) {
            console.error('Error getting signed URL:', error);
          }
        } catch (error) {
          console.error('Error in getAvatarUrl:', error);
        }
      }
    }
    
    getAvatarUrl();
  }, [avatarUrl, supabase.storage]);

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
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

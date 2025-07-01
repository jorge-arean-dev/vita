import { Building2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { NavLinks } from "./nav-links"
import { MobileNav } from "./mobile-nav"

export default async function SiteHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between w-full max-w-5xl mx-auto px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Vita</span>
        </Link>

        {/* Navigation Links - Center */}
        <nav className="hidden md:flex items-center space-x-8">
          <NavLinks publicOnly={!!user} />
        </nav>

        {/* Mobile Navigation Button */}
        <div className="md:hidden">
          <button className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center gap-4">
                <span className="text-sm">Hey, {user.email}</span>
                <LogoutButton />
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu (hidden by default) */}
      <div className="md:hidden border-t bg-background">
        <nav className="flex flex-col space-y-1 p-4">
          {user ? (
            <>
              <MobileNav publicOnly={true} />
              <div className="pt-2 flex flex-col space-y-2">
                <div className="text-sm">Hey, {user.email}</div>
                <LogoutButton />
              </div>
            </>
          ) : (
            <>
              <MobileNav publicOnly={false} />
              <div className="pt-2 flex flex-col space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

import { Building2, LogOut } from "lucide-react"
import Link from "next/link"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
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
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {/* Fallback to initial if no avatar image */}
              <span className="text-sm font-medium text-gray-600">J</span>
              {/* Uncomment below when you have user avatar */}
              {/* <img src="/placeholder-avatar.jpg" alt="User avatar" className="h-full w-full object-cover" /> */}
            </div>
          </div>

          {/* Logout Icon */}
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu (hidden by default) */}
    </header>
  )
}

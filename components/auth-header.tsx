"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthHeader() {
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
          <Link
            href="/how-it-works"
            className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>How it works</span>
          </Link>
          <Link
            href="/about"
            className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>About</span>
          </Link>
        </nav>

        {/* User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between w-full max-w-5xl mx-auto px-5">
        {/* Logo */}
        <Link href="/landing-v1" className="flex items-center space-x-2">
          <Image 
            src="/logo/vita-logo-light.svg" 
            alt="Vita Logo" 
            width={32} 
            height={32} 
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">Vita</span>
        </Link>

        {/* Navigation Links - Center */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            About
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            How
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Plans
          </Link>
        </nav>

        {/* Mobile Navigation Button */}
        <div className="md:hidden">
          <button className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
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

        {/* CTA Button */}
        <div className="hidden md:flex items-center">
          <Button asChild className="bg-black hover:bg-gray-800 text-white">
            <Link href="#">Join Waitlist</Link>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu (hidden by default) */}
      <div className="md:hidden border-t bg-white hidden">
        <nav className="flex flex-col space-y-1 p-4">
          <Link href="#" className="py-2 text-sm font-medium text-gray-700">About</Link>
          <Link href="#" className="py-2 text-sm font-medium text-gray-700">How</Link>
          <Link href="#" className="py-2 text-sm font-medium text-gray-700">Plans</Link>
          <div className="pt-2">
            <Button asChild className="w-full bg-black hover:bg-gray-800 text-white">
              <Link href="#">Join Waitlist</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
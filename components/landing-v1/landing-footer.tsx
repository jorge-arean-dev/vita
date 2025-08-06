import Image from "next/image"
import Link from "next/link"

export default function LandingFooter() {
  return (
    <footer className="w-full border-t backdrop-blur-sm bg-white/80">
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Desktop Layout - Three columns */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center space-x-2">
            <Image 
              src="/logo/vita-logo-light.svg" 
              alt="Vita Logo" 
              width={32} 
              height={32} 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">Vita</span>
          </div>

          {/* Slogan - Center */}
          <div className="text-center">
            <p className="text-sm text-gray-600 italic">
              Built to make recruiting smarter.
            </p>
          </div>

          {/* Links - Right */}
          <div className="flex items-center space-x-6">
            <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>

        {/* Mobile Layout - Stack everything centered */}
        <div className="md:hidden flex flex-col items-center space-y-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Image 
              src="/logo/vita-logo-light.svg" 
              alt="Vita Logo" 
              width={32} 
              height={32} 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">Vita</span>
          </div>

          {/* Slogan */}
          <p className="text-sm text-gray-600 italic">
            Built to make recruiting smarter.
          </p>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
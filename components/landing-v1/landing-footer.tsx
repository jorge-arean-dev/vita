import Image from "next/image"
import Link from "next/link"

export default function LandingFooter() {
  return (
    <footer className="w-full border-t border-gray-800/30 backdrop-blur-sm bg-black/85">
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Desktop Layout - Three columns */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center space-x-2">
            <Image 
              src="/logo/vita-logo-dark.svg" 
              alt="Vita Logo" 
              width={32} 
              height={32} 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-white">Vita</span>
          </div>

          {/* Slogan - Center */}
          <div className="text-center">
            <p className="text-sm text-gray-300 italic">
              Built to make recruiting smarter.
            </p>
          </div>

          {/* Links - Right */}
          <div className="flex items-center space-x-6">
            <Link href="https://drive.google.com/file/d/1HU87s9U4kJBOA8tlVsd4i83sKyDUVoPL/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="mailto:info@vita-hire.com" className="text-sm text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>

        {/* Mobile Layout - Stack everything centered */}
        <div className="md:hidden flex flex-col items-center space-y-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Image 
              src="/logo/vita-logo-dark.svg" 
              alt="Vita Logo" 
              width={32} 
              height={32} 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-white">Vita</span>
          </div>

          {/* Slogan */}
          <p className="text-sm text-gray-300 italic">
            Built to make recruiting smarter.
          </p>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <Link href="https://drive.google.com/file/d/1HU87s9U4kJBOA8tlVsd4i83sKyDUVoPL/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="mailto:info@vita-hire.com" className="text-sm text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
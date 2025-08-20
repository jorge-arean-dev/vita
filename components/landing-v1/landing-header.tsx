"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const [isHeroVisible, setIsHeroVisible] = useState(true)

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false) // Close mobile menu after clicking
  }

  // Track active section and hero visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "about", "how", "plans"]
      const scrollPosition = window.scrollY + 100

      // Track active section
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }

      // Track hero visibility - check if hero section is in viewport
      const heroElement = document.getElementById("hero")
      if (heroElement) {
        const rect = heroElement.getBoundingClientRect()
        const isVisible = rect.bottom > 0 && rect.top < window.innerHeight
        setIsHeroVisible(isVisible)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Call once to set initial state
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-sm bg-white/80">
      <div className="flex h-16 items-center justify-between w-full max-w-5xl mx-auto px-5">
        {/* Logo - Fixed width container to balance layout */}
        <div className="flex items-center w-72">
          <button 
            onClick={() => scrollToSection("hero")}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Image 
              src="/logo/vita-logo-light.svg" 
              alt="Vita Logo" 
              width={32} 
              height={32} 
              className="h-12 w-12"
            />
            <span className="text-xl font-bold"></span>
          </button>
        </div>

        {/* Navigation Links - Center */}
        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => scrollToSection("about")}
            className={`text-sm font-medium transition-colors ${
              activeSection === "about" 
                ? "text-black font-semibold" 
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection("how")}
            className={`text-sm font-medium transition-colors ${
              activeSection === "how" 
                ? "text-black font-semibold" 
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            How
          </button>
          <button 
            onClick={() => scrollToSection("plans")}
            className={`text-sm font-medium transition-colors ${
              activeSection === "plans" 
                ? "text-black font-semibold" 
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Plans
          </button>
        </nav>

        {/* Mobile Navigation Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
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

        {/* CTA Buttons - Fixed width container to prevent layout shifts */}
        <div className="hidden md:flex items-center justify-end w-72 space-x-3">
          <div className={`transition-all duration-300 ease-in-out ${
            !isHeroVisible 
              ? 'opacity-100 translate-x-0 scale-100' 
              : 'opacity-0 translate-x-2 scale-95 pointer-events-none'
          }`}>
            <Button 
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => scrollToSection("hero")}
            >
              Join Waitlist
            </Button>
          </div>
          <Link href="https://calendar.app.google/PZab9EFZmHffd7Ya8" target="_blank" rel="noopener noreferrer">
            <Button
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Book a Call
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`md:hidden border-t backdrop-blur-sm bg-white/90 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <nav className="flex flex-col space-y-1 p-4">
          <button 
            onClick={() => scrollToSection("about")}
            className="py-2 text-sm font-medium text-gray-700 text-left"
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection("how")}
            className="py-2 text-sm font-medium text-gray-700 text-left"
          >
            How
          </button>
          <button 
            onClick={() => scrollToSection("plans")}
            className="py-2 text-sm font-medium text-gray-700 text-left"
          >
            Plans
          </button>
          
          <div className="pt-4 space-y-2">
            <div className={`transition-all duration-300 ease-in-out ${
              !isHeroVisible 
                ? 'opacity-100 translate-y-0 max-h-20' 
                : 'opacity-0 -translate-y-2 max-h-0 overflow-hidden'
            }`}>
              <Button 
                className="w-full bg-black hover:bg-gray-800 text-white mb-2"
                onClick={() => scrollToSection("hero")}
              >
                Join Waitlist
              </Button>
            </div>
            <Link href="https://calendar.app.google/PZab9EFZmHffd7Ya8" target="_blank" rel="noopener noreferrer">
              <Button
                className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Book a Call
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
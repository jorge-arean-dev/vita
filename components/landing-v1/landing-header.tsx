"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false) // Close mobile menu after clicking
  }

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "about", "how", "plans"]
      const scrollPosition = window.scrollY + 100

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
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Call once to set initial state
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-sm bg-white/80">
      <div className="flex h-16 items-center justify-between w-full max-w-5xl mx-auto px-5">
        {/* Logo */}
        <button 
          onClick={() => scrollToSection("hero")}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Image 
            src="/logo/vita-logo-light.svg" 
            alt="Vita Logo" 
            width={32} 
            height={32} 
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">Vita</span>
        </button>

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

        {/* CTA Button */}
        <div className="hidden md:flex items-center">
          <Button asChild className="bg-black hover:bg-gray-800 text-white">
            <Link href="#">Join Waitlist</Link>
          </Button>
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
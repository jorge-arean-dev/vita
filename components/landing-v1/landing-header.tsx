"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Target, 
  Zap, 
  Users, 
  TrendingUp,
  Briefcase,
  Brain,
  Rocket,
  Globe
} from "lucide-react"

interface LandingHeaderProps {
  isAboutOpen: boolean
  setIsAboutOpen: (open: boolean) => void
}

export default function LandingHeader({ isAboutOpen, setIsAboutOpen }: LandingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur-sm bg-white/80">
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
            <button 
              onClick={() => setIsAboutOpen(true)}
              className={`text-sm font-medium transition-colors ${
                isAboutOpen 
                  ? "text-black font-semibold" 
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              About
            </button>
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              How
            </Link>
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Plans
            </Link>
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
              onClick={() => {
                setIsAboutOpen(true)
                setIsMobileMenuOpen(false)
              }}
              className="py-2 text-sm font-medium text-gray-700 text-left"
            >
              About
            </button>
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

      {/* About Dialog - Custom implementation without backdrop */}
      <DialogPrimitive.Root open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] max-w-[calc(100vw-4rem)] w-full max-h-[calc(100vh-10rem)] h-auto overflow-y-auto sm:max-w-[calc(100vw-6rem)] md:max-w-[calc(100vw-8rem)] bg-white/65 backdrop-blur-lg border border-gray-300/30 rounded-lg shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-500">
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
            
            <DialogPrimitive.Title className="text-3xl font-bold text-center mb-4">
              About Vita
            </DialogPrimitive.Title>
          
          <div className="space-y-8 px-6">
            {/* Main Introduction */}
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-2xl text-gray-700 leading-relaxed font-medium">
                Your co-pilot for recruiting
              </p>
              <p className="mt-4 text-lg text-gray-600">
                Built for independent recruiters, boutique agencies, and niche hiring teams, 
                Vita brings together the essential tools you need to run a smarter, 
                faster hiring process — all in one place.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <Card className="border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Target className="h-6 w-6 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">Smart Job Creation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    From writing job descriptions to building LinkedIn search strings, 
                    Vita streamlines your entire recruitment workflow.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Brain className="h-6 w-6 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Analyze resumes and guide interviews with intelligent insights 
                    that help you focus on making great hires.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Zap className="h-6 w-6 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">Workflow Automation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Automate repetitive tasks and streamline your process from 
                    job creation to candidate submission.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Globe className="h-6 w-6 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">Industry Adaptable</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Whether you're recruiting in cybersecurity, pharma, automation, 
                    or beyond — Vita adapts to your workflow.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <div className="text-center pt-6 border-t max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 font-medium mb-6">
                Ready to transform your recruiting process?
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-black hover:bg-gray-800 text-white px-8"
                  onClick={() => setIsAboutOpen(false)}
                >
                  Join Waitlist
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="px-8"
                  onClick={() => setIsAboutOpen(false)}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
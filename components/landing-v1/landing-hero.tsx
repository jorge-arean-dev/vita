"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { submitWaitlistForm } from "@/app/actions/waitlist"
import Link from "next/link"
import { useState } from "react"

interface LandingHeroProps {}

export default function LandingHero({}: LandingHeroProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({ name: "", email: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [nameError, setNameError] = useState("")

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Name validation function
  const validateName = (name: string): boolean => {
    // Allow letters, spaces, hyphens, and apostrophes (common in names)
    const nameRegex = /^[a-zA-Z\s\-']+$/
    return nameRegex.test(name) && name.trim().length >= 2
  }

  // Handle name input change with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({ ...prev, name }))
    
    // Clear error when user starts typing
    if (nameError && name !== formData.name) {
      setNameError("")
    }
    
    // Show error for invalid name (only if field has content and user has stopped typing)
    if (name && !validateName(name)) {
      setTimeout(() => {
        if (name === e.target.value && !validateName(name)) {
          setNameError("Please enter a valid name (letters only)")
        }
      }, 1000) // Debounce validation by 1 second
    }
  }

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setFormData(prev => ({ ...prev, email }))
    
    // Clear error when user starts typing
    if (emailError && email !== formData.email) {
      setEmailError("")
    }
    
    // Show error for invalid email (only if field has content and user has stopped typing)
    if (email && !validateEmail(email)) {
      setTimeout(() => {
        if (email === e.target.value && !validateEmail(email)) {
          setEmailError("Please enter a valid email address")
        }
      }, 1000) // Debounce validation by 1 second
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any existing errors
    setNameError("")
    setEmailError("")
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in both name and email",
        variant: "destructive"
      })
      return
    }
    
    // Validate name format before submission
    if (!validateName(formData.name)) {
      setNameError("Please enter a valid name (letters only)")
      toast({
        title: "Invalid Name",
        description: "Please enter a valid name using only letters",
        variant: "destructive"
      })
      return
    }
    
    // Validate email format before submission
    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address")
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const result = await submitWaitlistForm({
        name: formData.name,
        email: formData.email,
        triggerSource: "join_waitlist"
      })
      
      if (result.success) {
        setFormData({ name: "", email: "" })
        toast({
          title: "Welcome to the Waitlist!",
          description: result.message || "Thank you for your interest. We'll contact you when Vita is ready.",
        })
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <section className="flex items-center justify-center px-4 py-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-tight mb-6">
          <span className="font-normal">Streamline recruiting with </span>
          <span className="font-bold">Vita</span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12">
          Your AI toolkit to optimize every step of the recruitment process, from job creation to candidate submission.
        </p>

        {/* Join Waitlist Form */}
        <div className="max-w-lg mx-auto bg-white/10 backdrop-blur-sm border border-gray-200 rounded-lg p-6 space-y-4">
          
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Responsive input fields - side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hero-name" className="text-sm font-medium text-gray-700 block mb-2">
                  Name
                </Label>
                <Input
                  id="hero-name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className={`bg-white/80 transition-colors ${
                    nameError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300'
                  }`}
                />
                {nameError && (
                  <p className="text-xs text-red-600 mt-1">
                    {nameError}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="hero-email" className="text-sm font-medium text-gray-700 block mb-2">
                  Email
                </Label>
                <Input
                  id="hero-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleEmailChange}
                  required
                  className={`bg-white/80 transition-colors ${
                    emailError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300'
                  }`}
                />
                {emailError && (
                  <p className="text-xs text-red-600 mt-1">
                    {emailError}
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              type="submit"
              size="lg" 
              className="w-full bg-black hover:bg-gray-800 text-white px-8 py-3 text-base font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Joining..." : "Join Waitlist"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>

      </div>
    </section>
  )
}
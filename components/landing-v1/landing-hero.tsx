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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in both name and email",
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
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-tight">
          <span className="font-normal">Streamline recruiting with </span>
          <span className="font-bold">Vita</span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Your AI toolkit to optimize every step of the recruitment process, from job creation to candidate submission.
        </p>

        {/* Join Waitlist Form */}
        <div className="max-w-lg mx-auto bg-white/10 backdrop-blur-sm border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Join Waitlist</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Responsive input fields - side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hero-name" className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <Input
                  id="hero-name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-white/80 border-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="hero-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="bg-white/80 border-gray-300"
                />
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

        {/* Book Call Button */}
        <div className="pt-4">
          <Link href="https://calendar.app.google/PZab9EFZmHffd7Ya8" target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="lg"
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400 px-8 py-3 text-base font-medium bg-white/80"
            >
              Book a Call
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
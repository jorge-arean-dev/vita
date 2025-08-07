"use client"

import { useState } from "react"
import LandingHeader from "@/components/landing-v1/landing-header"
import LandingHero from "@/components/landing-v1/landing-hero"
import LandingFooter from "@/components/landing-v1/landing-footer"
import AboutSection from "@/components/landing-v1/about-section"
import HowSection from "@/components/landing-v1/how-section"
import PlansSection from "@/components/landing-v1/plans-section"
import { JoinWaitlistDialog } from "@/components/landing-v1/join-waitlist-dialog"

export default function LandingPageV1() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  const [triggerSource, setTriggerSource] = useState<"join_waitlist" | "vita_core" | "vita_custom">("join_waitlist")

  return (
    <main className="relative">
      {/* Fullscreen Video Background - Fixed position */}
      <div className="fixed inset-0 -z-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source 
            src="https://res.cloudinary.com/dnhjrpwmc/video/upload/v1754507917/background-2-4k_nkezn5.mp4" 
            type="video/mp4" 
          />
        </video>
      </div>
      
      {/* Content - with fade effect when dialog is open */}
      <div className={`relative z-10 transition-opacity duration-500 ${isWaitlistOpen ? 'opacity-30' : 'opacity-100'}`}>
        <LandingHeader onJoinWaitlist={() => {
          setTriggerSource("join_waitlist")
          setIsWaitlistOpen(true)
        }} />
        
        {/* Hero Section - Full viewport height with buttons centered in available space */}
        <section id="hero" className="min-h-screen flex pt-16 pb-20">
          <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-5 w-full">
            {/* Offset to position buttons at center of available space */}
            <div className="-mt-24">
              <LandingHero onJoinWaitlist={() => {
                setTriggerSource("join_waitlist")
                setIsWaitlistOpen(true)
              }} />
            </div>
          </div>
        </section>

        {/* About Section - Full viewport height with padding for footer */}
        <section id="about" className="min-h-screen flex items-center justify-center pt-16 pb-24">
          <AboutSection />
        </section>

        {/* How Section - Full viewport height with padding for footer */}
        <section id="how" className="min-h-screen flex items-center justify-center pt-16 pb-24">
          <HowSection />
        </section>

        {/* Plans Section - Full viewport height with padding for footer */}
        <section id="plans" className="min-h-screen flex items-center justify-center pt-16 pb-24">
          <PlansSection onJoinWaitlist={(source: "vita_core" | "vita_custom") => {
            setTriggerSource(source)
            setIsWaitlistOpen(true)
          }} />
        </section>
      </div>

      {/* Fixed Footer - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <LandingFooter />
      </div>

      {/* Join Waitlist Dialog */}
      <JoinWaitlistDialog 
        open={isWaitlistOpen} 
        onOpenChange={setIsWaitlistOpen}
        triggerSource={triggerSource}
      />
    </main>
  )
}
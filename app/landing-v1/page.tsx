import LandingHeader from "@/components/landing-v1/landing-header"
import LandingHero from "@/components/landing-v1/landing-hero"
import LandingFooter from "@/components/landing-v1/landing-footer"

export default function LandingPageV1() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Fullscreen Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source 
          src="https://res.cloudinary.com/dnhjrpwmc/video/upload/v1754507917/background-2-4k_nkezn5.mp4" 
          type="video/mp4" 
        />
      </video>
      
      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <LandingHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-5xl mx-auto px-5 w-full">
            <LandingHero />
          </div>
        </div>
        <LandingFooter />
      </div>
    </main>
  )
}
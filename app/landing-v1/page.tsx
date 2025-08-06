import LandingHeader from "@/components/landing-v1/landing-header"
import LandingHero from "@/components/landing-v1/landing-hero"
import LandingFooter from "@/components/landing-v1/landing-footer"

export default function LandingPageV1() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <LandingHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-5 w-full">
          <LandingHero />
        </div>
      </div>
      <LandingFooter />
    </main>
  )
}
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingHero() {
  return (
    <section className="flex items-center justify-center px-4 py-6 bg-white">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
          Streamline recruiting with Vita
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Your toolkit to manage and automate every step of the recruitment process, from job creation to candidate submission.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Link href="#">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-base font-medium">
              Join Waitlist
            </Button>
          </Link>
          <Link href="#">
            <Button
              variant="outline"
              size="lg"
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400 px-8 py-3 text-base font-medium"
            >
              Book a Call
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
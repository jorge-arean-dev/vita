import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="flex items-center justify-center px-4 py-8 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/test-logo.svg" alt="Vita Logo" width={80} height={80} className="w-16 h-16 md:w-20 md:h-20" />
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
          Streamline recruitment with Vita
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Toolkit to manage and automate every step of the recruitment process, from job creation to candidate submission.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-black hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white px-8 py-3 text-base font-medium">
              Get Started
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="ghost"
              size="lg"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-8 py-3 text-base font-medium"
            >
              Learn more
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

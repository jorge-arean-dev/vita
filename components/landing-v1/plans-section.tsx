import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Package,
  Sparkles,
  Settings,
  Building2,
  Users,
  Rocket,
  CheckCircle,
  Calendar
} from "lucide-react"

export default function PlansSection() {
  return (
    <div className="max-w-5xl mx-auto px-5 w-full">
      <div className="bg-white/50 backdrop-blur-lg border border-gray-300/30 rounded-lg shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-2">
          Our Plans
        </h2>

        <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
          Choose the perfect solution for your recruiting needs
        </p>
      
        <div className="max-w-6xl mx-auto">
          {/* Plans Grid - Side by Side */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Core Version Card */}
            <Card className="border-gray-200 hover:shadow-xl transition-shadow relative bg-white/70">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Package className="h-6 w-6 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    STANDARD
                  </span>
                </div>
                <CardTitle className="text-2xl mb-2">Core Version</CardTitle>
                <CardDescription className="text-lg text-gray-700 font-medium">
                  Everything You Need to Get Started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Access the suite of tools designed to work out of the box for modern recruiters.
                </p>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">AI-powered job description builder</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Boolean search generator</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Resume and LinkedIn analysis</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Email templates and builder</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Interview companion mode</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    size="lg"
                  >
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Custom Version Card */}
            <Card className="border-gray-200 hover:shadow-xl transition-shadow relative bg-white/70">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Sparkles className="h-6 w-6 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    ENTERPRISE
                  </span>
                </div>
                <CardTitle className="text-2xl mb-2">Custom Version</CardTitle>
                <CardDescription className="text-lg text-gray-700 font-medium">
                  Tailored for Niche Recruiting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                For specialized firms in niche industries or deep tech, tailored to match your workflows and needs.                </p>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-start space-x-3">
                    <Settings className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Customized to your industry language</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Adapted to your specific processes</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Tailored to your talent profiles</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Rocket className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Enhanced for your unique value</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">All Core features included</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book a Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom CTA */}
          <div className="text-center pt-6 border-t">
            <p className="text-gray-600 mb-2">
              👉 <span className="italic">Interested in a tailored version?</span>
            </p>
            <p className="text-lg text-gray-700 font-medium">
              Let's discuss how Vita can be customized for your specific needs
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
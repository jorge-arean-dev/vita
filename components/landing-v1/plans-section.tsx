import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Package,
  Sparkles,
  Settings,
  Building2,
  Rocket,
  CheckCircle
} from "lucide-react"

interface PlansSectionProps {
  onJoinWaitlist?: (source: "vita_core" | "vita_custom") => void
}

export default function PlansSection({ onJoinWaitlist }: PlansSectionProps) {
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
                  <div className="p-1 bg-gray-100 rounded-lg">
                    <Package className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Core</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Access the suite of tools designed to work out of the box for modern recruiters.
                </p>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Job description builder</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Boolean queries generator</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Resume analysis</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Candidate match analysis</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Interview companion mode and much more</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    size="lg"
                    onClick={() => onJoinWaitlist?.("vita_core")}
                  >
                    I want to know more
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Custom Version Card */}
            <Card className="border-gray-200 hover:shadow-xl transition-shadow relative bg-white/70">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-1 bg-gray-100 rounded-lg">
                    <Sparkles className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Custom</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                For specialized firms in niche industries or deep tech, tailored to match your workflows and needs.                </p>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">All Core features</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Settings className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Customization to your industry language</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Adaptation to your specific processes</span>
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
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    size="lg"
                    onClick={() => onJoinWaitlist?.("vita_custom")}
                  >
                    This is the right fit for me!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
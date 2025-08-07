import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Target, 
  Brain,
  Zap,
  Globe,
  Users,
  Rocket,
  Briefcase
} from "lucide-react"

export default function AboutSection() {
  return (
    <div className="max-w-5xl mx-auto px-5 w-full">
      <div className="bg-white/50 backdrop-blur-lg border border-gray-300/30 rounded-lg shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-4">
        Your copilot for recruiting
        </h2>
        
        <div className="space-y-8">
          {/* Main Introduction */}
          <div className="text-center px-4">
           <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Built for independent recruiters, boutique agencies, and niche hiring teams, 
              Vita brings together the essential tools you need to run a smarter, 
              faster hiring process, all in one place.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white/70">
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
                  Vita speeds up recruitment duties.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white/70">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Brain className="h-6 w-6 text-gray-600" />
                  </div>
                  <CardTitle className="text-lg">AI Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Analyze resumes and guide interviews with intelligent insights 
                  that help you focus on making great hires.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white/70">
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
                  Automate repetitive tasks and simplify your processes from 
                  job creation to candidate submission.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white/70">
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
                  Whether you're recruiting in niche industries or sectors, Vita can adapt to your workflow.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
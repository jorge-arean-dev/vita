import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  FileText,
  Search,
  MessageSquare
} from "lucide-react"

export default function HowSection() {
  return (
    <div className="max-w-5xl mx-auto px-5 w-full">
      <div className="bg-white/50 backdrop-blur-lg border border-gray-300/30 rounded-lg shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-2">
          How It Works
        </h2>

        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          A few simple steps to transform your recruiting process
        </p>
      
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Step 1 */}
          <div className="relative">
            <Card className="border-gray-200 hover:shadow-lg transition-shadow bg-white/70">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-700">1</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center">
                      <FileText className="h-5 w-5 text-gray-600 mr-2" />
                      Create a Job
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      Start by capturing job requirements from your raw notes or client call transcripts. 
                      Vita extracts key attributes using AI and generates engaging job descriptions.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            {/* Connector line */}
            <div className="absolute left-[24px] top-[60px] w-0.5 h-[calc(100%+1.5rem)] bg-gray-300 -z-10"></div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <Card className="border-gray-200 hover:shadow-lg transition-shadow bg-white/70">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-700">2</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center">
                      <Search className="h-5 w-5 text-gray-600 mr-2" />
                      Source Candidates
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      Vita helps you search LinkedIn with precision using AI-generated queries 
                      and evaluate candidate resumes through a Match Analysis tool that scores fit 
                      and reveals key skill gaps.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            {/* Connector line */}
            <div className="absolute left-[24px] top-[60px] w-0.5 h-[calc(100%+1.5rem)] bg-gray-300 -z-10"></div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <Card className="border-gray-200 hover:shadow-lg transition-shadow bg-white/70">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-700">3</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center">
                      <MessageSquare className="h-5 w-5 text-gray-600 mr-2" />
                      Interview & Decide
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                    Vita can assist in interviews to support recruiters, even in technical or niche roles, 
                    by offering guidance, customized questions, and post-interview performance insight.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
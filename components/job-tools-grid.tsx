"use client"

import { useRouter } from "next/navigation"
import { FileText, Search, UserCheck, MessageSquare, BarChart3, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface JobToolsGridProps {
  jobId: string
}

const toolCards = [
  {
    title: "Job Description Builder",
    description: "Create polished job descriptions from rough notes or client calls",
    icon: FileText,
    route: "job-description-builder"
  },
  {
    title: "LinkedIn Query Builder",
    description: "Generate Boolean search strings optimized for LinkedIn Recruiter",
    icon: Search,
    route: "linkedin-query-builder"
  },
  {
    title: "Candidate Match Analysis",
    description: "Upload resumes or LinkedIn profiles to assess job fit instantly",
    icon: UserCheck,
    route: "candidate-match-analysis"
  },
  {
    title: "Interview Questions Generator",
    description: "Generate tailored interview questions based on your job requirements",
    icon: MessageSquare,
    route: "interview-questions-generator"
  },
  {
    title: "Interview Analysis",
    description: "Analyze candidate responses and get AI-powered evaluation scores",
    icon: BarChart3,
    route: "interview-analysis"
  },
  {
    title: "Email Builder",
    description: "Create professional outreach, follow-up, and client communication emails",
    icon: Mail,
    route: "email-builder"
  },
]

export default function JobToolsGrid({ jobId }: JobToolsGridProps) {
  const router = useRouter()

  const handleCardClick = (route: string) => {
    console.log("Opening tool:", route)
    router.push(`/protected/jobs/${jobId}/${route}`)
  }

  return (
    <div className="space-y-6">
      {/* Tool cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card
              key={index}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 group"
              onClick={() => handleCardClick(card.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">{card.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
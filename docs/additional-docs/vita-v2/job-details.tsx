"use client"

import { ArrowLeft, FileText, Search, UserCheck, MessageSquare, BarChart3, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface JobDetailsProps {
  job: {
    id: number
    title: string
    company: string
  }
  onBack: () => void
}

const toolCards = [
  {
    title: "Job Description Builder",
    description: "Create polished job descriptions from rough notes or client calls",
    icon: FileText,
  },
  {
    title: "LinkedIn Query Builder",
    description: "Generate Boolean search strings optimized for LinkedIn Recruiter",
    icon: Search,
  },
  {
    title: "Candidate Match Analysis",
    description: "Upload resumes or LinkedIn profiles to assess job fit instantly",
    icon: UserCheck,
  },
  {
    title: "Interview Questions Generator",
    description: "Generate tailored interview questions based on your job requirements",
    icon: MessageSquare,
  },
  {
    title: "Interview Analysis",
    description: "Analyze candidate responses and get AI-powered evaluation scores",
    icon: BarChart3,
  },
  {
    title: "Email Builder",
    description: "Create professional outreach, follow-up, and client communication emails",
    icon: Mail,
  },
]

export default function JobDetails({ job, onBack }: JobDetailsProps) {
  const handleCardClick = (cardTitle: string) => {
    console.log("Opening tool:", cardTitle)
    // Navigate to specific tool page
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
      </div>

      {/* Job title and company */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
        <p className="text-xl text-muted-foreground">{job.company}</p>
      </div>

      {/* Tool cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card
              key={index}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 group"
              onClick={() => handleCardClick(card.title)}
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

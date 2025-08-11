"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Sample data based on the provided JSON
const sampleAnalysisData = {
  match_analysis: {
    overall_score: 18,
    status: "missing",
    overall_feedback:
      "This candidate is not a good fit; consider other options unless more information becomes available.",
    matched_mandatory_requirements: 0,
    total_mandatory_requirements: 5,
  },
  requirement_evaluations: [
    {
      job_requirement_id: "req_1",
      requirement_name: "TypeScript", // Assumed name
      score: 6,
      status: "missing",
      feedback:
        "Candidate has beginner-level TypeScript (1 year) but expert level required (5+ years). Significant skill gap identified for senior role.",
    },
    {
      job_requirement_id: "req_2",
      requirement_name: "React", // Assumed name
      score: 39,
      status: "weak",
      feedback:
        "Candidate demonstrates advanced proficiency in React with 3.5 years of experience, but the expert level is required. This indicates a potential for growth but may not meet immediate expectations for a senior role.",
    },
    {
      job_requirement_id: "req_3",
      requirement_name: "Node.js", // Assumed name
      score: 39,
      status: "weak",
      feedback:
        "Similar to React, the candidate has advanced experience in Node (3.5 years), yet the role demands expert-level skills. This suggests a solid foundation but a need for further development to meet senior expectations.",
    },
    {
      job_requirement_id: "req_4",
      requirement_name: "PostgreSQL", // Assumed name
      score: 11,
      status: "missing",
      feedback:
        "Candidate has beginner-level experience with Postgres (1 year), while the role requires advanced proficiency. This gap could hinder the candidate's ability to handle complex database tasks effectively.",
    },
    {
      job_requirement_id: "req_5",
      requirement_name: "MongoDB", // Assumed name
      score: 11,
      status: "missing",
      feedback:
        "With only beginner-level experience in MongoDB (1 year), the candidate does not meet the advanced requirement for this role. This could limit their effectiveness in projects that rely heavily on NoSQL databases.",
    },
    {
      job_requirement_id: "req_6",
      requirement_name: "AWS", // Assumed name
      score: 0,
      status: "missing",
      feedback:
        "Candidate lacks any experience with AWS, while advanced skills are preferred. This could be a significant drawback, especially for roles that involve cloud services.",
    },
    {
      job_requirement_id: "req_7",
      requirement_name: "Financial Services Experience", // Assumed name
      score: 0,
      status: "missing",
      feedback:
        "Candidate has no experience in the financial services industry, which is not mandatory but would be beneficial. This could affect their understanding of domain-specific challenges.",
    },
  ],
  summary: {
    strengths: [
      "Strong React and Node.js foundation with 3.5 years experience each",
      "5 years of experience in software engineering, demonstrating a solid background in full-stack development",
      "Advanced skills in Agile methodologies, Scrum, and Test Driven Development, indicating strong project management capabilities",
    ],
    gaps: [
      "TypeScript proficiency significantly below senior level requirements",
      "Missing advanced skills in Postgres and MongoDB, which are critical for the role",
      "Lack of experience with AWS, which may limit cloud-based project contributions",
    ],
  },
  recruiter_recommendations: {
    interview_strategy: [
      "Dig deeper into TypeScript projects during the technical interview to assess potential for growth",
      "Explore candidate's understanding of advanced React and Node concepts to gauge readiness for senior responsibilities",
      "Discuss past experiences with databases to evaluate problem-solving skills in relation to Postgres and MongoDB",
    ],
    other_options: [
      "Consider 'Mid-Level with Senior Potential' positioning instead, focusing on the candidate's strong foundation and growth mindset",
      "Explore opportunities for mentorship or training in TypeScript and AWS to bridge skill gaps",
      "Look for roles that may allow for gradual upskilling in the required technologies while leveraging existing strengths",
    ],
  },
  metadata: {
    analysis_timestamp: "2025-07-31T16:45:13.471Z",
    job_id: "placeholder_job_id",
    candidate_id: "placeholder_candidate_id",
    algorithm_version: "1.0",
    total_processing_time_ms: 12612,
  },
  candidate: {
    first_name: "John",
    last_name: "Doe",
  },
}

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  status: string // Added status prop
}

function CircularProgress({ value, size = 120, strokeWidth = 8, className = "", status }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (status: string) => {
    if (status === "strong") return "stroke-green-500"
    if (status === "adequate") return "stroke-blue-500"
    if (status === "weak") return "stroke-orange-500"
    if (status === "missing") return "stroke-red-500"
    return "stroke-gray-500" // Default or fallback
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getColor(status)}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  )
}

function getStatusBadge(score: number) {
  if (score >= 75) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Strong</Badge>
  }
  if (score >= 50) {
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Adequate</Badge>
  }
  if (score >= 25) {
    return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">Weak</Badge>
  }
  return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Missing</Badge>
}

function getProgressBarColor(score: number) {
  if (score >= 75) return "bg-green-500"
  if (score >= 50) return "bg-blue-500"
  if (score >= 25) return "bg-orange-500"
  return "bg-red-500"
}

function getBannerColor(status: string) {
  if (status === "strong") return "bg-green-100 text-green-800 border-green-200"
  if (status === "adequate") return "bg-blue-100 text-blue-800 border-blue-200"
  if (status === "weak") return "bg-orange-100 text-orange-800 border-orange-200"
  if (status === "missing") return "bg-red-100 text-red-800 border-red-200"
  return "bg-gray-100 text-gray-800 border-gray-200" // Default or fallback
}

export default function CandidateMatchAnalysisPage() {
  const data = sampleAnalysisData

  // Animation states
  const [visibleSections, setVisibleSections] = useState<string[]>([])
  const [visibleRequirementCards, setVisibleRequirementCards] = useState<number>(0)
  const [visibleProgressBars, setVisibleProgressBars] = useState<number>(0)

  // Calculate requirements met
  const requirementsMet = data.match_analysis.matched_mandatory_requirements
  const totalRequirements = data.match_analysis.total_mandatory_requirements

  useEffect(() => {
    // Sequential section reveal
    const timeline = [
      { section: "header", delay: 0 },
      { section: "combined-card", delay: 800 },
      { section: "requirements-header", delay: 1600 },
    ]

    timeline.forEach(({ section, delay }) => {
      setTimeout(() => {
        setVisibleSections((prev) => [...prev, section])
      }, delay)
    })

    // Start progress bars animation after combined card appears
    setTimeout(() => {
      const progressInterval = setInterval(() => {
        setVisibleProgressBars((prev) => {
          if (prev < data.requirement_evaluations.length) {
            return prev + 1
          } else {
            clearInterval(progressInterval)
            return prev
          }
        })
      }, 200)
    }, 1600) // Start after combined card appears

    // Start requirement cards animation after requirements header appears
    setTimeout(() => {
      const cardInterval = setInterval(() => {
        setVisibleRequirementCards((prev) => {
          if (prev < data.requirement_evaluations.length) {
            return prev + 1
          } else {
            clearInterval(cardInterval)
            // After all requirement cards are shown, show remaining sections
            setTimeout(() => {
              setVisibleSections((prevSections) => [...prevSections, "summary", "recommendations"])
            }, 500)
            return prev
          }
        })
      }, 400)
    }, 2400) // Start after requirements header appears (1600ms + 800ms buffer)
  }, [data.requirement_evaluations.length])

  const isVisible = (section: string) => visibleSections.includes(section)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className={`transition-all duration-1000 ${isVisible("header") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <h1 className="text-3xl font-bold tracking-tight">Candidate Match Analysis</h1>
        <p className="text-muted-foreground">Comprehensive analysis of candidate fit for the position</p>
      </div>

      {/* Combined Card - Overall Match Score + Requirement Analysis */}
      <div
        className={`transition-all duration-1000 ${isVisible("combined-card") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <Card className="w-full">
          <CardContent className="p-6">
            {/* Row Container */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Element 1: Column Container */}
              <div className="flex flex-col space-y-6 lg:w-1/2">
                {/* Element 1.1: Overall Match Score */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Overall Match Score</h2>
                  <CircularProgress value={data.match_analysis.overall_score} status={data.match_analysis.status} />
                </div>

                {/* Element 1.2: Informative Banner */}
                <div className={`p-4 rounded-lg border ${getBannerColor(data.match_analysis.status)}`}>
                  <p className="text-sm font-medium">
                    {data.candidate.first_name} {data.candidate.last_name} meets {requirementsMet} out of{" "}
                    {totalRequirements} requirements.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{data.match_analysis.overall_feedback}</p>
                </div>
              </div>

              {/* Element 2: Requirement Analysis */}
              <div className="flex flex-col space-y-4 lg:w-1/2">
                <h2 className="text-2xl font-bold">Requirement Analysis</h2>
                <div className="space-y-4">
                  {data.requirement_evaluations.map((req, index) => (
                    <div
                      key={req.job_requirement_id}
                      className={`space-y-2 transition-all duration-500 ${
                        index < visibleProgressBars ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{req.requirement_name}</span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(req.score)}`}
                            style={{
                              width: index < visibleProgressBars ? `${req.score}%` : "0%",
                              transitionDelay: `${index * 100 + 200}ms`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirement Evaluations Section */}
      <div
        className={`space-y-6 transition-all duration-1000 ${isVisible("requirements-header") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div>
          <h2 className="text-2xl font-bold mb-2">Requirement Evaluations</h2>
          <p className="text-lg text-muted-foreground">
            {data.candidate.first_name} {data.candidate.last_name} meets {requirementsMet} out of {totalRequirements}{" "}
            requirements for this role
          </p>
        </div>

        {/* Requirement Cards - Table-style Layout */}
        <div className="space-y-4">
          {data.requirement_evaluations.slice(0, visibleRequirementCards).map((req, index) => (
            <Card
              key={req.job_requirement_id}
              className="w-full transition-all duration-500 animate-in slide-in-from-left hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Left Section - Requirement Name and Score Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-semibold">{req.requirement_name}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Score:</span>
                          <span className="font-bold text-lg">{req.score}%</span>
                        </div>
                        {getStatusBadge(req.score)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pr-4">{req.feedback}</p>
                  </div>

                  {/* Right Section - Circular Progress */}
                  <div className="flex-shrink-0 ml-6">
                    <CircularProgress value={req.score} size={80} strokeWidth={6} status={req.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-1000 ${isVisible("summary") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.summary.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.summary.gaps.map((gap, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{gap}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div
        className={`space-y-6 transition-all duration-1000 ${isVisible("recommendations") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <h2 className="text-2xl font-bold">Recruiter Recommendations</h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Assessment Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.recruiter_recommendations.interview_strategy.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-purple-700">Other Options</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.recruiter_recommendations.other_options.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

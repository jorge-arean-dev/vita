import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Check, TrendingDown } from "lucide-react"
import { formatSeniorityLevel, getSeniorityStatus } from "./utils"

interface SeniorityAnalysisSectionProps {
  seniorityAnalysis: {
    required: "junior" | "mid" | "senior" | "lead" | "executive" | null
    candidate: "junior" | "mid" | "senior" | "lead" | "executive" | null
    candidateYears?: number
    match: boolean
    score: number
    feedback: string
  }
}

export function SeniorityAnalysisSection({ seniorityAnalysis }: SeniorityAnalysisSectionProps) {
  const status = getSeniorityStatus(seniorityAnalysis)

  // Get appropriate icon and styling based on status
  const getStatusDisplay = () => {
    switch (status.type) {
      case "overqualified":
        return {
          icon: TrendingUp,
          text: status.message,
          className: "text-[hsl(var(--match-developing-text))] bg-[hsl(var(--match-developing-bg))]"
        }
      case "fit":
        return {
          icon: Check,
          text: status.message,
          className: "text-[hsl(var(--match-fit-text))] bg-[hsl(var(--match-fit-bg))]"
        }
      case "underqualified":
        return {
          icon: TrendingDown,
          text: status.message,
          className: "text-[hsl(var(--match-weak-text))] bg-[hsl(var(--match-weak-bg))]"
        }
      default:
        return {
          icon: Check,
          text: status.message,
          className: "text-muted-foreground bg-muted"
        }
    }
  }

  const statusDisplay = getStatusDisplay()
  const StatusIcon = statusDisplay.icon

  return (
    <div className="transition-all duration-1000 opacity-100 translate-y-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Seniority Level Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seniority Level Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Required Level</p>
              <p className="text-lg font-semibold">{formatSeniorityLevel(seniorityAnalysis.required)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Candidate Level</p>
              <p className="text-lg font-semibold">
                {formatSeniorityLevel(seniorityAnalysis.candidate)}
                {seniorityAnalysis.candidateYears && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({seniorityAnalysis.candidateYears} years)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${statusDisplay.className}`}>
            <div className="flex-shrink-0">
              <StatusIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">{statusDisplay.text}</p>
          </div>

          {/* Feedback */}
          {seniorityAnalysis.feedback && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Analysis</p>
              <p className="text-sm leading-relaxed text-foreground">
                {seniorityAnalysis.feedback}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
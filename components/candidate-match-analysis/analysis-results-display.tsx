import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, SearchX, CheckCircle2, type LucideIcon } from "lucide-react"
import { CircularProgress } from "./circular-progress"
import { RequirementAnalysisBadge } from "./requirement-analysis-badge"
import { AnalysisStrategyBadge } from "./analysis-strategy-badge"
import { SeniorityAnalysisSection } from "./seniority-analysis-section"
import { getAnalysisData, getStatusBadge, getBannerColor, scrollToRequirement } from "./utils"
import { MatchAnalysis, ExistingMatchAnalysis } from "./types"

interface AnalysisResultsDisplayProps {
  analysis: MatchAnalysis | ExistingMatchAnalysis
  candidateName?: string
  isNewCandidate?: boolean
}

// Fallback component for empty states
const EmptyStateContent = ({ 
  type, 
  icon: Icon, 
  primary, 
  secondary 
}: {
  type: 'strengths' | 'gaps'
  icon: LucideIcon
  primary: string
  secondary: string
}) => (
  <div 
    className="flex flex-col items-center justify-center py-8 px-4 text-center"
    role="status"
    aria-label={`No ${type} identified for this candidate`}
  >
    <div className={`mb-3 p-3 rounded-full ${
      type === 'gaps' 
        ? 'bg-[hsl(var(--match-fit-bg))] text-[hsl(var(--match-fit-text))]' // Use fit colors since no gaps is positive
        : 'bg-[hsl(var(--match-fit-bg))] text-[hsl(var(--match-fit-text))]'
    }`}>
      <Icon className="h-6 w-6 md:h-5 md:w-5" />
    </div>
    <p className="text-sm font-medium text-foreground mb-2">
      {primary}
    </p>
    <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
      {secondary}
    </p>
  </div>
)

export function AnalysisResultsDisplay({ analysis, candidateName, isNewCandidate = false }: AnalysisResultsDisplayProps) {
  const data = getAnalysisData(analysis)
  
  // Get candidate name from different sources
  const displayName = candidateName || 
    ('candidates' in analysis && analysis.candidates 
      ? `${analysis.candidates.first_name} ${analysis.candidates.last_name}`
      : "Unknown Candidate")

  return (
    <div className="space-y-8">
      {/* Blue informative banner for new candidates */}
      {isNewCandidate && (
        <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                This candidate will be saved to your database
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                When you click Save, this candidate&apos;s information and match analysis will be permanently stored for future reference.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Element 1: Combined Section - Overall Match Score + Requirement Analysis */}
      <div className="transition-all duration-1000 opacity-100 translate-y-0">
        {/* Row Container */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Element 1: Column Container */}
          <div className="flex flex-col space-y-6 lg:w-1/2">
            {/* Element 1.1: Overall Match Score */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-left">Overall Match Score</h2>
                {(('results' in analysis && analysis.results && 'analysisMetadata' in analysis.results) || ('analysisStrategy' in analysis && analysis.analysisStrategy)) && (
                  <AnalysisStrategyBadge
                    strategy={
                      ('results' in analysis && analysis.results && 'analysisMetadata' in analysis.results && analysis.results?.analysisMetadata?.strategy) ||
                      ('analysisStrategy' in analysis ? analysis.analysisStrategy : undefined) ||
                      undefined
                    }
                    reason={
                      ('results' in analysis && analysis.results && 'analysisMetadata' in analysis.results && analysis.results?.analysisMetadata?.reason) ||
                      undefined
                    }
                    rawDataSources={
                      ('results' in analysis && analysis.results && 'analysisMetadata' in analysis.results && analysis.results?.analysisMetadata?.rawDataSources) ||
                      ('rawDataSources' in analysis ? analysis.rawDataSources : undefined) ||
                      undefined
                    }
                  />
                )}
              </div>
              <div className="flex justify-center">
                <CircularProgress 
                  value={data.match_analysis.overall_score} 
                  status={data.match_analysis.status} 
                />
              </div>
            </div>

            {/* Element 1.2: Informative Banner */}
            <div className={`p-4 rounded-lg border ${getBannerColor(data.match_analysis.status)}`}>
              <p className="text-sm font-medium">
                {displayName} meets {data.match_analysis.matched_mandatory_requirements} out of{" "}
                {data.match_analysis.total_mandatory_requirements} requirements.
              </p>
              <p className="text-sm text-muted-foreground mt-1">{data.match_analysis.overall_feedback}</p>
            </div>
          </div>

          {/* Element 2: Requirement Analysis */}
          <div className="flex flex-col space-y-4 lg:w-1/2">
            <h2 className="text-2xl font-bold">Requirement Analysis</h2>
            <div className="flex flex-wrap gap-2">
              {data.requirement_evaluations.map((req) => (
                <RequirementAnalysisBadge
                  key={req.requirement_name}
                  name={req.requirement_name}
                  score={req.score}
                  status={req.status}
                  onClick={() => {
                    // Safely handle scroll to requirement
                    try {
                      scrollToRequirement(req.requirement_name)
                    } catch (error) {
                      // Silently handle any DOM access errors
                      console.warn('Could not scroll to requirement:', error)
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Element 2: Candidate Summary */}
      <div className="transition-all duration-1000 opacity-100 translate-y-0">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Candidate Summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[hsl(var(--match-fit-text))]">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                {data.summary.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {data.summary.strengths.map((strength, index) => (
                      <li key={`strength-${index}-${strength.slice(0, 20)}`} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--match-fit))] mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyStateContent
                    type="strengths"
                    icon={SearchX}
                    primary="No specific strengths identified in this analysis"
                    secondary="This suggests the candidate may need significant development or that additional information is needed to identify their key strengths."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[hsl(var(--match-missing-text))]">Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                {data.summary.gaps.length > 0 ? (
                  <ul className="space-y-3">
                    {data.summary.gaps.map((gap, index) => (
                      <li key={`gap-${index}-${gap.slice(0, 20)}`} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--match-missing))] mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{gap}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyStateContent
                    type="gaps"
                    icon={CheckCircle2}
                    primary="No development gaps identified"
                    secondary="This candidate appears to meet all job requirements well based on the available information."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Seniority Analysis Section */}
      {data.seniority_analysis && (
        <SeniorityAnalysisSection seniorityAnalysis={data.seniority_analysis} />
      )}

      {/* Requirement Evaluations Section */}
      <div className="space-y-8 mt-8 transition-all duration-1000 opacity-100 translate-y-0">
        <div>
          <h2 className="text-2xl font-bold mb-2">Per Requirement Analysis</h2>
          <p className="text-lg text-muted-foreground">
            See below for a detailed analysis of each requirement.
          </p>
        </div>

        {/* Requirement Cards - Table-style Layout */}
        <div className="space-y-4 mt-8">
          {data.requirement_evaluations.map((req, index) => (
            <Card
              key={req.requirement_name}
              id={`requirement-${req.requirement_name}`}
              className="w-full transition-all duration-500 animate-in slide-in-from-left hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="px-8 py-2">
                <div className="flex items-center justify-between">
                  {/* Left Section - Requirement Name and Score Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-semibold">{req.requirement_name}</h3>
                      <div className="flex items-center gap-3">
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

      {/* Recommendations */}
      <div className="space-y-6 mt-8 transition-all duration-1000 opacity-100 translate-y-0">
        <div>
          <h2 className="text-2xl font-bold mb-2">Recruiter Recommendations</h2>
          <p className="text-lg text-muted-foreground">
            Here&apos;s what to consider next
          </p>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Assessment Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.recruiter_recommendations.interview_strategy.map((item, index) => (
                  <li key={`interview-strategy-${index}-${item.slice(0, 20)}`} className="flex items-start gap-2">
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
                  <li key={`other-option-${index}-${item.slice(0, 20)}`} className="flex items-start gap-2">
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
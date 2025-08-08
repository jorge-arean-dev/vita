"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BarChart, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { InterviewWithDetails } from "@/types/interview.types"

interface InterviewAnalysisProps {
  interview: InterviewWithDetails
}

export default function InterviewAnalysis({ interview }: InterviewAnalysisProps) {
  const score = interview.interview_scores?.[0]
  
  if (!score || !score.analysis) {
    return (
      <div className="py-8 text-center">
        <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {interview.status === 'analyzing' 
            ? "Analysis in progress..."
            : "No analysis available yet. Analyze the transcript to see insights."}
        </p>
      </div>
    )
  }

  const analysis = score.analysis
  const scorePercentage = ((analysis.overall_score / 4) * 100)
  
  const getScoreColor = (score: number) => {
    if (score >= 3.5) return "text-green-600"
    if (score >= 2.5) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 3.5) return "Excellent"
    if (score >= 3.0) return "Good"
    if (score >= 2.5) return "Fair"
    if (score >= 2.0) return "Below Average"
    return "Poor"
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Assessment</CardTitle>
          <CardDescription>
            AI-powered analysis based on job requirements and interview performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}/4.0
              </p>
              <p className="text-sm text-muted-foreground">
                {getScoreLabel(analysis.overall_score)}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {getScoreLabel(analysis.overall_score)}
            </Badge>
          </div>
          
          <Progress value={scorePercentage} className="h-2" />
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommendation:</strong> {analysis.recommendation}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-yellow-600" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.areas_for_improvement.map((area, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{area}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Key Moments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Key Moments
          </CardTitle>
          <CardDescription>
            Notable highlights from the interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.key_moments.map((moment, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="outline" className="font-mono text-xs">
                  {moment.timestamp}
                </Badge>
                <p className="text-sm flex-1">{moment.highlight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Metadata */}
      <div className="text-xs text-muted-foreground text-center">
        Analysis generated on {new Date(score.created_at).toLocaleString()}
      </div>
    </div>
  )
}
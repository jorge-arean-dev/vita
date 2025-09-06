import { Badge } from "@/components/ui/badge"
import { MatchAnalysis, ExistingMatchAnalysis } from "./types"

// Utility functions for styling
export function getStatusBadge(score: number) {
  if (score >= 80) {
    return <Badge className="bg-[hsl(var(--match-fit-bg))] text-[hsl(var(--match-fit-text))] hover:bg-[hsl(var(--match-fit-bg))] border-[hsl(var(--match-fit-border))]">Fit</Badge>
  }
  if (score >= 60) {
    return <Badge className="bg-[hsl(var(--match-developing-bg))] text-[hsl(var(--match-developing-text))] hover:bg-[hsl(var(--match-developing-bg))] border-[hsl(var(--match-developing-border))]">Developing</Badge>
  }
  if (score >= 30) {
    return <Badge className="bg-[hsl(var(--match-weak-bg))] text-[hsl(var(--match-weak-text))] hover:bg-[hsl(var(--match-weak-bg))] border-[hsl(var(--match-weak-border))]">Weak</Badge>
  }
  return <Badge className="bg-[hsl(var(--match-missing-bg))] text-[hsl(var(--match-missing-text))] hover:bg-[hsl(var(--match-missing-bg))] border-[hsl(var(--match-missing-border))]">Missing</Badge>
}

export function getProgressBarColor(score: number) {
  if (score >= 80) return "bg-[hsl(var(--match-fit))]"
  if (score >= 60) return "bg-[hsl(var(--match-developing))]"
  if (score >= 30) return "bg-[hsl(var(--match-weak))]"
  return "bg-[hsl(var(--match-missing))]"
}

export function getBannerColor(status: string) {
  if (status === "fit") return "bg-[hsl(var(--match-fit-bg))] text-[hsl(var(--match-fit-text))] border-[hsl(var(--match-fit-border))]"
  if (status === "strong") return "bg-[hsl(var(--match-strong-bg))] text-[hsl(var(--match-strong-text))] border-[hsl(var(--match-strong-border))]" // Legacy support
  if (status === "developing") return "bg-[hsl(var(--match-developing-bg))] text-[hsl(var(--match-developing-text))] border-[hsl(var(--match-developing-border))]"
  if (status === "adequate") return "bg-[hsl(var(--match-adequate-bg))] text-[hsl(var(--match-adequate-text))] border-[hsl(var(--match-adequate-border))]" // Legacy support
  if (status === "weak") return "bg-[hsl(var(--match-weak-bg))] text-[hsl(var(--match-weak-text))] border-[hsl(var(--match-weak-border))]"
  if (status === "missing") return "bg-[hsl(var(--match-missing-bg))] text-[hsl(var(--match-missing-text))] border-[hsl(var(--match-missing-border))]"
  return "bg-gray-100 text-gray-800 border-gray-200"
}

// Helper functions for seniority analysis
export function formatSeniorityLevel(level: string | null): string {
  if (!level) return "Not specified"
  
  const levelMap: Record<string, string> = {
    junior: "Junior",
    mid: "Mid-level", 
    senior: "Senior",
    lead: "Lead",
    executive: "Executive"
  }
  
  return levelMap[level] || level
}

export function getSeniorityStatus(analysis: NonNullable<ReturnType<typeof getAnalysisData>['seniority_analysis']>) {
  const requiredLevel = analysis.required
  const candidateLevel = analysis.candidate
  
  // Define seniority hierarchy
  const hierarchy = ["junior", "mid", "senior", "lead", "executive"]
  
  if (!requiredLevel || !candidateLevel) {
    return { type: "unknown" as const, message: "Seniority levels not available" }
  }
  
  const requiredIndex = hierarchy.indexOf(requiredLevel)
  const candidateIndex = hierarchy.indexOf(candidateLevel)
  
  if (candidateIndex > requiredIndex) {
    return { 
      type: "overqualified" as const, 
      message: "Candidate is overqualified for this role" 
    }
  } else if (candidateIndex < requiredIndex) {
    return { 
      type: "underqualified" as const, 
      message: "Candidate is underqualified for this role" 
    }
  } else {
    return { 
      type: "fit" as const, 
      message: "Candidate is a fit for this role" 
    }
  }
}

// Helper function to access data consistently for both new and existing analyses
export function getAnalysisData(analysis: MatchAnalysis | ExistingMatchAnalysis) {
  if ('results' in analysis && analysis.results) {
    // New analysis structure
    return {
      match_analysis: analysis.results.match_analysis,
      requirement_evaluations: analysis.results.requirement_evaluations,
      summary: analysis.results.summary,
      recruiter_recommendations: analysis.results.recruiter_recommendations,
      seniority_analysis: analysis.results.seniority_analysis
    }
  } else {
    // Existing analysis structure
    const existingAnalysis = analysis as ExistingMatchAnalysis
    return {
      match_analysis: existingAnalysis.match_analysis,
      requirement_evaluations: existingAnalysis.requirement_evaluations,
      summary: existingAnalysis.summary,
      recruiter_recommendations: existingAnalysis.recruiter_recommendations,
      seniority_analysis: existingAnalysis.seniority_analysis
    }
  }
}

// Scroll to requirement evaluation card
export function scrollToRequirement(requirementId: string) {
  // Check if we're in the browser and document is ready
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  
  // Use setTimeout to ensure DOM is fully rendered
  setTimeout(() => {
    const element = document.getElementById(`requirement-${requirementId}`)
    if (element && element.parentNode) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

// Card expansion state persistence utilities
const EXPANSION_STATE_KEY = 'candidate-match-analysis-expansion-state'

export function getExpansionState(jobId: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(`${EXPANSION_STATE_KEY}-${jobId}`)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function setExpansionState(jobId: string, analysisId: string, isExpanded: boolean) {
  if (typeof window === 'undefined') return
  
  try {
    const currentState = getExpansionState(jobId)
    const newState = { ...currentState, [analysisId]: isExpanded }
    localStorage.setItem(`${EXPANSION_STATE_KEY}-${jobId}`, JSON.stringify(newState))
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function clearExpansionState(jobId: string, analysisId?: string) {
  if (typeof window === 'undefined') return
  
  try {
    if (analysisId) {
      // Remove specific analysis expansion state
      const currentState = getExpansionState(jobId) 
      delete currentState[analysisId]
      localStorage.setItem(`${EXPANSION_STATE_KEY}-${jobId}`, JSON.stringify(currentState))
    } else {
      // Clear all expansion state for this job
      localStorage.removeItem(`${EXPANSION_STATE_KEY}-${jobId}`)
    }
  } catch {
    // Silently fail if localStorage is not available
  }
}
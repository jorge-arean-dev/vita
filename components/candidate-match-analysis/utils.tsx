import { Badge } from "@/components/ui/badge"
import { MatchAnalysis, ExistingMatchAnalysis } from "./types"

// Utility functions for styling
export function getStatusBadge(score: number) {
  if (score >= 75) {
    return <Badge className="bg-[hsl(var(--match-strong-bg))] text-[hsl(var(--match-strong-text))] hover:bg-[hsl(var(--match-strong-bg))] border-[hsl(var(--match-strong-border))]">Strong</Badge>
  }
  if (score >= 50) {
    return <Badge className="bg-[hsl(var(--match-adequate-bg))] text-[hsl(var(--match-adequate-text))] hover:bg-[hsl(var(--match-adequate-bg))] border-[hsl(var(--match-adequate-border))]">Adequate</Badge>
  }
  if (score >= 25) {
    return <Badge className="bg-[hsl(var(--match-weak-bg))] text-[hsl(var(--match-weak-text))] hover:bg-[hsl(var(--match-weak-bg))] border-[hsl(var(--match-weak-border))]">Weak</Badge>
  }
  return <Badge className="bg-[hsl(var(--match-missing-bg))] text-[hsl(var(--match-missing-text))] hover:bg-[hsl(var(--match-missing-bg))] border-[hsl(var(--match-missing-border))]">Missing</Badge>
}

export function getProgressBarColor(score: number) {
  if (score >= 75) return "bg-[hsl(var(--match-strong))]"
  if (score >= 50) return "bg-[hsl(var(--match-adequate))]"
  if (score >= 25) return "bg-[hsl(var(--match-weak))]"
  return "bg-[hsl(var(--match-missing))]"
}

export function getBannerColor(status: string) {
  if (status === "strong") return "bg-[hsl(var(--match-strong-bg))] text-[hsl(var(--match-strong-text))] border-[hsl(var(--match-strong-border))]"
  if (status === "adequate") return "bg-[hsl(var(--match-adequate-bg))] text-[hsl(var(--match-adequate-text))] border-[hsl(var(--match-adequate-border))]"
  if (status === "weak") return "bg-[hsl(var(--match-weak-bg))] text-[hsl(var(--match-weak-text))] border-[hsl(var(--match-weak-border))]"
  if (status === "missing") return "bg-[hsl(var(--match-missing-bg))] text-[hsl(var(--match-missing-text))] border-[hsl(var(--match-missing-border))]"
  return "bg-gray-100 text-gray-800 border-gray-200"
}

// Helper function to access data consistently for both new and existing analyses
export function getAnalysisData(analysis: MatchAnalysis | ExistingMatchAnalysis) {
  if ('results' in analysis && analysis.results) {
    // New analysis structure
    return {
      match_analysis: analysis.results.match_analysis,
      requirement_evaluations: analysis.results.requirement_evaluations,
      summary: analysis.results.summary,
      recruiter_recommendations: analysis.results.recruiter_recommendations
    }
  } else {
    // Existing analysis structure
    const existingAnalysis = analysis as ExistingMatchAnalysis
    return {
      match_analysis: existingAnalysis.match_analysis,
      requirement_evaluations: existingAnalysis.requirement_evaluations,
      summary: existingAnalysis.summary,
      recruiter_recommendations: existingAnalysis.recruiter_recommendations
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
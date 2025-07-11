"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

/**
 * Phase-based navigation system for job management workflow.
 * 
 * This component implements a fixed navigation bar that allows users to move
 * between different phases of the recruiting process. Each phase represents
 * a major step in the recruiting workflow, from initial job definition
 * through final candidate submission.
 * 
 * The navigator maintains URL state and provides visual feedback for the
 * current active phase, making it easy for users to understand their
 * progress and navigate between workflow stages.
 */

export type JobPhase = "define" | "source" | "review" | "reach" | "assess" | "submit"

/**
 * Configuration object for each recruitment phase
 * Defines the display properties and description for each workflow step
 */
interface PhaseConfig {
  id: JobPhase          // Unique identifier for the phase
  label: string         // Display name shown in navigation
  subtitle: string      // Description of the phase's purpose
}

/**
 * Complete workflow configuration defining all recruitment phases.
 * 
 * This array defines the complete recruiting workflow from job definition
 * to candidate submission. Each phase contains specific tools and features
 * designed to support that stage of the recruiting process.
 * 
 * The order matters as it represents the logical flow of recruiting activities.
 */
const phases: PhaseConfig[] = [
  {
    id: "define",
    label: "Define",
    subtitle: "Tools to help you capture and organize what the job is about."
  },
  {
    id: "source",
    label: "Source", 
    subtitle: "Tools to help you find potential candidates for the job."
  },
  {
    id: "review",
    label: "Review",
    subtitle: "Tools to help you check if a talent matches the job."
  },
  {
    id: "reach",
    label: "Reach",
    subtitle: "Tools to help you contact and follow up with candidates."
  },
  {
    id: "assess",
    label: "Assess",
    subtitle: "Tools to help you guide and review conversations with candidates."
  },
  {
    id: "submit",
    label: "Submit", 
    subtitle: "Tools to help you present candidates to clients."
  }
]

/**
 * Props for the JobPhaseNavigator component
 */
interface JobPhaseNavigatorProps {
  currentPhase: JobPhase        // Currently active phase to highlight
  jobId: string                 // Job ID for URL navigation
  className?: string            // Optional CSS classes for styling
}

export default function JobPhaseNavigator({ currentPhase, jobId, className }: JobPhaseNavigatorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  /**
   * Handle navigation when user clicks on a phase button
   * Updates URL parameters and navigates to the selected phase
   * 
   * @param phaseId - The target phase to navigate to
   */
  const handlePhaseClick = (phaseId: JobPhase) => {
    const params = new URLSearchParams(searchParams)
    params.set("phase", phaseId)
    
    // Set default tabs for phases that have sub-navigation
    // This ensures users land on the most relevant starting point
    if (phaseId === "define") {
      params.set("tab", "initial-data")
    } else if (phaseId === "assess") {
      params.set("tab", "interview-questions")
    } else {
      // Clear tab parameter for phases without sub-navigation
      params.delete("tab")
    }
    
    // Navigate while preserving other URL parameters
    router.push(`/protected/jobs/${jobId}?${params.toString()}`)
  }

  // Find configuration for the currently active phase
  const currentPhaseConfig = phases.find(p => p.id === currentPhase)

  return (
    <div className={cn("bg-background border-b", className)}>
      {/* Phase Navigation */}
      <nav 
        className="flex items-center justify-center space-x-1 px-6 py-2"
        role="tablist"
        aria-label="Job workflow phases"
      >
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex items-center">
            <button
              onClick={() => handlePhaseClick(phase.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                currentPhase === phase.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={currentPhase === phase.id ? "page" : undefined}
              aria-label={`Navigate to ${phase.label} phase: ${phase.subtitle}`}
              role="tab"
              aria-selected={currentPhase === phase.id}
            >
              {phase.label}
            </button>
            {index < phases.length - 1 && (
              <div className="mx-2 h-px w-4 bg-border" />
            )}
          </div>
        ))}
      </nav>

      {/* Phase Title and Subtitle */}
      {currentPhaseConfig && (
        <div className="px-6 py-4 text-center border-t bg-muted/30">
          <h1 
            className="text-2xl font-bold tracking-tight mb-1"
            id="phase-title"
          >
            {currentPhaseConfig.label}
          </h1>
          <p 
            className="text-sm text-muted-foreground"
            id="phase-description"
            aria-describedby="phase-title"
          >
            {currentPhaseConfig.subtitle}
          </p>
        </div>
      )}
    </div>
  )
}

export { phases }
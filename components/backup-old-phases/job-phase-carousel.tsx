"use client"

// import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * Carousel-based navigation system for job management workflow.
 * 
 * This component implements a carousel interface that allows users to navigate
 * between different phases of the recruiting process. Each phase represents
 * a major step in the recruiting workflow, displayed in a card format with
 * arrow navigation controls.
 */

export type JobPhase = "define" | "source" | "review" | "reach" | "assess" | "submit"

/**
 * Configuration object for each recruitment phase
 */
interface PhaseConfig {
  id: JobPhase
  label: string
  subtitle: string
}

/**
 * Complete workflow configuration defining all recruitment phases.
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

interface JobPhaseCarouselProps {
  currentPhase: JobPhase
  jobId: string
  className?: string
  children: React.ReactNode // Phase content
}

export default function JobPhaseCarousel({ 
  currentPhase, 
  jobId, 
  className,
  children 
}: JobPhaseCarouselProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Find current phase index
  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase)
  const currentPhaseConfig = phases[currentPhaseIndex]
  
  // Navigation helpers
  const canGoBack = currentPhaseIndex > 0
  const canGoForward = currentPhaseIndex < phases.length - 1
  
  /**
   * Handle navigation to a specific phase
   */
  const navigateToPhase = (phaseId: JobPhase) => {
    const params = new URLSearchParams(searchParams)
    params.set("phase", phaseId)
    
    // Set default tabs for phases that have sub-navigation
    if (phaseId === "define") {
      params.set("tab", "initial-data")
    } else if (phaseId === "assess") {
      params.set("tab", "interview-questions")
    } else {
      params.delete("tab")
    }
    
    router.push(`/protected/jobs/${jobId}?${params.toString()}`)
  }
  
  /**
   * Handle arrow navigation
   */
  const handlePrevious = () => {
    if (canGoBack) {
      navigateToPhase(phases[currentPhaseIndex - 1].id)
    }
  }
  
  const handleNext = () => {
    if (canGoForward) {
      navigateToPhase(phases[currentPhaseIndex + 1].id)
    }
  }

  return (
    <div className={cn("bg-background h-full flex flex-col", className)}>
      {/* Progress Stepper - Fixed */}
      <div className="border-b bg-background/95 backdrop-blur flex-shrink-0">
        <div className="px-6 py-4">
          <nav 
            className="flex items-center justify-center space-x-2"
            role="tablist"
            aria-label="Job workflow phases"
          >
            {phases.map((phase, index) => (
              <div key={phase.id} className="flex items-center">
                <button
                  onClick={() => navigateToPhase(phase.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    currentPhase === phase.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={currentPhase === phase.id ? "page" : undefined}
                  aria-label={`Navigate to ${phase.label} phase`}
                  role="tab"
                  aria-selected={currentPhase === phase.id}
                >
                  {phase.label}
                </button>
                {index < phases.length - 1 && (
                  <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Carousel Content */}
      <div className="relative flex-1 overflow-hidden">
        {/* Main Content Card */}
        <div className="px-6 py-6 h-full">
          <div className="relative max-w-5xl mx-auto h-full flex flex-col">
            {/* Navigation Arrows */}
            <div className="absolute -left-32 top-1/2 -translate-y-1/2 z-10">
              <Button
                variant="default"
                size="icon"
                onClick={handlePrevious}
                disabled={!canGoBack}
                className={cn(
                  "h-12 w-12 rounded-full shadow-lg border-2 border-background bg-primary text-primary-foreground",
                  "hover:bg-primary/90 hover:scale-105 transition-all duration-200",
                  !canGoBack && "opacity-30 cursor-not-allowed hover:scale-100 hover:bg-primary"
                )}
                aria-label="Previous phase"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="absolute -right-32 top-1/2 -translate-y-1/2 z-10">
              <Button
                variant="default"
                size="icon"
                onClick={handleNext}
                disabled={!canGoForward}
                className={cn(
                  "h-12 w-12 rounded-full shadow-lg border-2 border-background bg-primary text-primary-foreground",
                  "hover:bg-primary/90 hover:scale-105 transition-all duration-200",
                  !canGoForward && "opacity-30 cursor-not-allowed hover:scale-100 hover:bg-primary"
                )}
                aria-label="Next phase"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
              {/* Phase Header - Fixed */}
              <div className="border-b bg-muted/30 px-6 py-4 flex-shrink-0">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight mb-1">
                    {currentPhaseConfig?.label}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {currentPhaseConfig?.subtitle}
                  </p>
                </div>
              </div>
              
              {/* Phase Content - Scrollable */}
              <CardContent className="p-6 flex-1 overflow-y-auto">
                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export { phases }
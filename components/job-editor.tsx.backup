"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, AlertTriangle } from "lucide-react"
import JobPhaseCarousel, { JobPhase } from "@/components/job-phase-carousel"
import DefinePhase from "@/components/job-phases/define-phase"
import SourcePhase from "@/components/job-phases/source-phase"
import ReviewPhase from "@/components/job-phases/review-phase"
import ReachPhase from "@/components/job-phases/reach-phase"
import AssessPhase from "@/components/job-phases/assess-phase"
import SubmitPhase from "@/components/job-phases/submit-phase"

/**
 * Main job editing interface that manages the complete job lifecycle.
 * 
 * This component serves as the central hub for job creation and editing,
 * implementing a phase-based navigation system that mirrors the recruiting workflow:
 * Define → Source → Review → Reach → Assess → Submit
 * 
 * Key features:
 * - Unsaved changes detection with browser navigation protection
 * - Dynamic phase routing with URL state management
 * - Centralized job data state with change tracking
 * - Responsive layout with sticky navigation
 */

/**
 * Core job data structure representing a recruiting position.
 * This interface defines the minimal required data for job management
 * across all phases of the recruiting workflow.
 */
interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
  // Additional fields will be added as features expand
}

/**
 * Props for the JobEditor component.
 * These props control the editor's state and behavior.
 */
interface JobEditorProps {
  jobId: string                    // Unique identifier for the job
  jobData?: JobData | null         // Existing job data (null for new jobs)
  currentPhase: JobPhase           // Active recruitment phase
  currentTab?: string              // Active sub-tab within a phase
  isNewJob: boolean                // Whether this is a new job creation flow
}

export default function JobEditor({ 
  jobId, 
  jobData, 
  currentPhase, 
  currentTab
}: JobEditorProps) {
  const router = useRouter()
  
  // Track unsaved changes to prevent accidental data loss
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Local job state that gets updated as user makes changes
  // This allows for real-time editing without immediate persistence
  const [jobInfo, setJobInfo] = useState<JobData | null>(jobData || null)
  
  // Error state for handling save/load errors
  const [error, setError] = useState<string | null>(null)

  /**
   * Prevent users from accidentally losing unsaved changes
   * by intercepting browser navigation and page refresh events
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = "" // Required for Chrome compatibility
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  /**
   * Handle user attempting to close the editor
   * Shows confirmation dialog if there are unsaved changes
   */
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      )
      if (!confirm) return
    }
    router.push("/protected/jobs")
  }


  /**
   * Render the appropriate phase component based on current navigation state
   * Each phase component receives common props for job data management
   * and a callback to update the local state when changes occur
   */
  const renderPhaseContent = () => {
    // Common props shared across all phase components
    const commonProps = {
      jobId,
      jobData: jobInfo,
      // Callback to update job data and mark as changed
      onDataChange: (data: Partial<JobData>) => {
        setJobInfo(prev => ({ ...prev, ...data } as JobData))
        setHasUnsavedChanges(true)
      }
    }

    // Route to the appropriate phase component
    switch (currentPhase) {
      case "define":
        return <DefinePhase {...commonProps} currentTab={currentTab} />
      case "source":
        return <SourcePhase {...commonProps} />
      case "review":
        return <ReviewPhase />
      case "reach":
        return <ReachPhase {...commonProps} />
      case "assess":
        return <AssessPhase {...commonProps} currentTab={currentTab} />
      case "submit":
        return <SubmitPhase {...commonProps} />
      default:
        // Fallback to define phase for unknown phases
        return <DefinePhase {...commonProps} currentTab={currentTab} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with close button and save */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-semibold">
                {jobInfo?.title || "New Job"}
              </h1>
              {jobInfo?.companyName && (
                <p className="text-sm text-muted-foreground">
                  {jobInfo.companyName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Close job editor and return to jobs list"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Phase Carousel */}
      <JobPhaseCarousel
        currentPhase={currentPhase}
        jobId={jobId}
      >
        {/* Error Alert */}
        {error && (
          <Alert 
            variant="destructive" 
            className="mb-6"
            role="alert"
            aria-live="polite"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="ml-2 h-6 px-2"
                aria-label="Dismiss error message"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {renderPhaseContent()}
      </JobPhaseCarousel>
    </div>
  )
}
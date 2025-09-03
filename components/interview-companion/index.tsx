"use client"

import { useState, useEffect, useCallback } from "react"
import "./interview-companion.css"
import type { JSX } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Video, 
  Loader2, 
  Play,
  FileText,
  BarChart,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Calendar
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  getJobInterviews, 
  getInterviewDetails,
  simulateWebhookReceived 
} from "@/app/actions/interviews"
import { InterviewWithDetails } from "@/types/interview.types"
import { InterviewStatusBadge } from "@/components/ui/interview-status-badge"
import CreateInterviewDialog from "./create-interview-dialog"
import InterviewTranscript from "./interview-transcript"
import InterviewAnalysis from "./interview-analysis"

interface InterviewCompanionProps {
  jobId: string
}

export default function InterviewCompanion({ jobId }: InterviewCompanionProps): JSX.Element {
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([])
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null)
  const [expandedInterviewId, setExpandedInterviewId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // Load interview details  
  const loadInterviewDetails = useCallback(async (interviewId: string) => {
    try {
      const { data, error } = await getInterviewDetails(interviewId)
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
        return
      }
      setSelectedInterview(data)
    } catch (error) {
      console.error("Error loading interview details:", error)
      toast({
        title: "Error",
        description: "Failed to load interview details",
        variant: "destructive"
      })
    }
  }, [toast])

  // Load interviews
  const loadInterviews = useCallback(async () => {
    try {
      const { data, error } = await getJobInterviews(jobId)
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
        return
      }
      setInterviews(data || [])
      
      // If we have interviews and none selected, select the first one
      if (data && data.length > 0 && !selectedInterview) {
        await loadInterviewDetails(data[0].id)
      }
    } catch (error) {
      console.error("Error loading interviews:", error)
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [jobId, selectedInterview, toast, loadInterviewDetails])

  // Initial load
  useEffect(() => {
    loadInterviews()
  }, [jobId, loadInterviews])

  // Auto-refresh for in-progress interviews
  useEffect(() => {
    const hasInProgressInterview = interviews.some(
      interview => interview.status === 'in_progress' || interview.status === 'created'
    )
    
    if (hasInProgressInterview) {
      const interval = setInterval(() => {
        loadInterviews()
      }, 10000) // Refresh every 10 seconds
      
      return () => clearInterval(interval)
    }
  }, [interviews, loadInterviews])

  const handleRefresh = () => {
    setRefreshing(true)
    loadInterviews()
  }

  const handleInterviewCreated = () => {
    loadInterviews()
  }

  const handleSimulateTranscript = async (interviewId: string) => {
    try {
      const result = await simulateWebhookReceived(interviewId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Mock transcript generated successfully"
        })
        await loadInterviews()
        await loadInterviewDetails(interviewId)
      }
    } catch (error) {
      console.error("Error simulating transcript:", error)
      toast({
        title: "Error",
        description: "Failed to generate mock transcript",
        variant: "destructive"
      })
    }
  }

  const handleDeleteInterview = async (interviewId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete interview:', interviewId)
  }

  const handleToggleExpanded = (interviewId: string) => {
    if (expandedInterviewId === interviewId) {
      setExpandedInterviewId(null)
      setSelectedInterview(null)
    } else {
      setExpandedInterviewId(interviewId)
      loadInterviewDetails(interviewId)
    }
  }

  const getInterviewStatusBadgeStatus = (status: string): "analyzing" | "completed" | "created" | "in_progress" | "ready_for_analysis" => {
    switch (status) {
      case 'ready_for_analysis':
        return 'ready_for_analysis'
      case 'in_progress':
        return 'in_progress'
      case 'analyzing':
        return 'analyzing'
      case 'completed':
        return 'completed'
      case 'created':
      default:
        return 'created'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Interview Companion</h2>
            <p className="text-muted-foreground">Record and analyze Google Meet interviews with AI-powered insights</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <CreateInterviewDialog 
              jobId={jobId} 
              onInterviewCreated={handleInterviewCreated}
              variant="default"
            />
          </div>
        </div>
      </div>

      {/* Interviews List - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2">
        {interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No interviews found</h3>
            <p className="text-muted-foreground mb-4">Create your first interview to get started</p>
            <CreateInterviewDialog 
              jobId={jobId} 
              onInterviewCreated={handleInterviewCreated}
              variant="default"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Headers - Hidden but kept for structure */}
            <div className="sr-only">
              <div>Interview Details</div>
            </div>

            {/* Interview Cards - Container query wrapper */}
            <div className="@container space-y-2">
              {interviews.map((interview) => {
                const candidateName = interview.candidates 
                  ? `${interview.candidates.first_name} ${interview.candidates.last_name}`
                  : 'No candidate assigned'
                const interviewTitle = interview.title || `Interview #${interviews.indexOf(interview) + 1}`

                return (
                  <Collapsible
                    key={interview.id}
                    open={expandedInterviewId === interview.id}
                    onOpenChange={() => handleToggleExpanded(interview.id)}
                  >
                    <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5 py-2">
                      <CardContent className="px-3 @[850px]:px-6 py-3 @[850px]:py-4">
                        {/* Grid layout for table-like alignment with progressive spacing */}
                        <div className="grid grid-cols-[auto_minmax(120px,1fr)_auto] @[750px]:grid-cols-[auto_280px_1fr_auto] @[850px]:grid-cols-[auto_360px_1fr_auto] @[1000px]:grid-cols-[auto_420px_minmax(auto,1fr)_auto] items-center gap-2 @[750px]:gap-3 @[850px]:gap-4">
                          {/* Expand/Collapse Button - Always visible */}
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 @[850px]:h-9 @[850px]:w-9 flex-shrink-0"
                              aria-label={expandedInterviewId === interview.id ? "Collapse interview details" : "Expand interview details"}
                            >
                              {expandedInterviewId === interview.id ? (
                                <ChevronDown className="h-3 w-3 @[850px]:h-4 @[850px]:w-4" />
                              ) : (
                                <ChevronRight className="h-3 w-3 @[850px]:h-4 @[850px]:w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          {/* Candidate Name Column */}
                          <div className="min-w-0">
                            <span className="text-sm @[850px]:text-base font-bold group-hover:text-primary transition-colors truncate block">
                              {candidateName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {interviewTitle}
                            </span>
                          </div>

                          {/* Middle Section - Progressive disclosure: Date and Status */}
                          <div className="hidden @[750px]:grid @[750px]:grid-cols-[auto] @[1000px]:grid-cols-[auto_auto] gap-2 @[1000px]:gap-3 items-center">
                            {/* Date Column - Only visible at 1000px+ for better space distribution */}
                            <div className="hidden @[1000px]:flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                              <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">
                                {new Date(interview.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>

                            {/* Status Badge - Always visible in middle section at 750px+ */}
                            <div className="flex justify-center @[1000px]:justify-start min-w-0">
                              <InterviewStatusBadge 
                                status={getInterviewStatusBadgeStatus(interview.status)}
                                isStatic={true}
                                showIcon={false}
                                className="text-xs"
                              />
                            </div>
                          </div>

                          {/* Actions Section - Always visible */}
                          <div className="flex items-center gap-1 @[750px]:gap-2 justify-end min-w-0">
                            {/* Action Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 @[850px]:h-9 @[850px]:w-9"
                                  aria-label={`Actions for ${interviewTitle} - ${candidateName}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3 w-3 @[850px]:h-4 @[850px]:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteInterview(interview.id)
                                  }}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4">
                    {selectedInterview && selectedInterview.id === interview.id ? (
                      <div className="border-t pt-4">
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="transcript">Transcript</TabsTrigger>
                            <TabsTrigger value="analysis">Analysis</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="overview" className="space-y-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium mb-1">Title</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedInterview.title}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm font-medium mb-1">Candidate</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedInterview.candidates ? (
                                    <>
                                      {selectedInterview.candidates.first_name} {selectedInterview.candidates.last_name}
                                      {selectedInterview.candidates.email && (
                                        <span className="block text-xs">{selectedInterview.candidates.email}</span>
                                      )}
                                    </>
                                  ) : (
                                    'No candidate assigned'
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm font-medium mb-1">Meeting Link</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedInterview.meeting_link || 'Not provided'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium mb-1">Bot ID</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {selectedInterview.recall_bot_id || 'Not assigned'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium mb-1">Status</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedInterview.interview_statuses?.display_name || 
                                   selectedInterview.status.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                                   selectedInterview.status.replace(/_/g, ' ').slice(1)}
                                </p>
                                {selectedInterview.interview_statuses?.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {selectedInterview.interview_statuses.description}
                                  </p>
                                )}
                              </div>

                              {interview.interview_scores && interview.interview_scores[0] && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Score</p>
                                  <div className="flex items-center gap-2">
                                    <BarChart className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {interview.interview_scores[0].overall_score}/4.0
                                    </span>
                                  </div>
                                </div>
                              )}

                              {(interview.transcript_count ?? 0) > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Transcript</p>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      {interview.transcript_count} transcript segments
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Mock data button for testing */}
                              {interview.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSimulateTranscript(interview.id)
                                  }}
                                >
                                  <Play className="h-3 w-3 mr-2" />
                                  Simulate Transcript
                                </Button>
                              )}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="transcript">
                            <InterviewTranscript 
                              interview={selectedInterview}
                              onAnalyze={() => {
                                loadInterviews()
                                loadInterviewDetails(selectedInterview.id)
                              }}
                            />
                          </TabsContent>
                          
                          <TabsContent value="analysis">
                            <InterviewAnalysis interview={selectedInterview} />
                          </TabsContent>
                        </Tabs>
                      </div>
                    ) : (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
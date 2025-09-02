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
  Trash2
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
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {interviews.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No interviews found</h3>
                <p className="text-muted-foreground">Create your first interview to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          interviews.map((interview) => (
            <Collapsible
              key={interview.id}
              open={expandedInterviewId === interview.id}
              onOpenChange={() => handleToggleExpanded(interview.id)}
            >
              <Card className="transition-all hover:shadow-md">
                <CardContent className="px-4 py-0">
                  <div className="flex items-center justify-between">
                    {/* Main Row Content (Always visible) */}
                    <div className="grid flex-1 items-center gap-4 pr-4 sm:grid-cols-10">
                      {/* Expand/Collapse Toggle */}
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="col-span-1 h-8 w-8 p-0"
                          aria-label={expandedInterviewId === interview.id ? "Collapse" : "Expand"}
                        >
                          {expandedInterviewId === interview.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      {/* Candidate Name & Interview Title */}
                      <div className="col-span-4 flex flex-col items-start">
                            <h3 className="text-base font-semibold leading-tight transition-colors">
                              {interview.candidates ? (
                                `${interview.candidates.first_name} ${interview.candidates.last_name}`
                              ) : (
                                'No candidate assigned'
                              )}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {interview.title || `Interview #${interviews.indexOf(interview) + 1}`}
                            </p>
                      </div>

                      {/* Interview Date & Time */}
                      <div className="col-span-3 text-xs text-muted-foreground">
                        Created on {new Date(interview.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, at{' '}
                        {new Date(interview.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
                      </div>

                      {/* Status Badge */}
                      <div className="col-span-2">
                        <InterviewStatusBadge 
                          status={getInterviewStatusBadgeStatus(interview.status)}
                          isStatic={true}
                          showIcon={false}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    {/* Action Menu (MoreHorizontal) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Actions for ${interview.title} - ${interview.candidates?.first_name} ${interview.candidates?.last_name}`}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem
                          onClick={() => handleDeleteInterview(interview.id)}
                          className="cursor-pointer text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          ))
        )}
      </div>
    </div>
  )
}
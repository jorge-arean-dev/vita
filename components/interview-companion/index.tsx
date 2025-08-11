"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Video, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Play,
  FileText,
  BarChart,
  RefreshCw
} from "lucide-react"
import { 
  getJobInterviews, 
  getInterviewDetails,
  simulateWebhookReceived 
} from "@/app/actions/interviews"
import { InterviewWithDetails } from "@/types/interview.types"
import CreateInterviewDialog from "./create-interview-dialog"
import InterviewTranscript from "./interview-transcript"
import InterviewAnalysis from "./interview-analysis"

interface InterviewCompanionProps {
  jobId: string
}

export default function InterviewCompanion({ jobId }: InterviewCompanionProps) {
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([])
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null)
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

  const getStatusBadge = (interview: InterviewWithDetails) => {
    const status = interview.status
    const displayName = interview.interview_statuses?.display_name || status
    
    const statusConfig = {
      created: { variant: "outline" as const, icon: Clock },
      in_progress: { variant: "default" as const, icon: Loader2 },
      ready_for_analysis: { variant: "secondary" as const, icon: AlertCircle },
      analyzing: { variant: "default" as const, icon: Loader2 },
      completed: { variant: "default" as const, icon: CheckCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.created
    const Icon = config.icon

    return (
      <Badge 
        variant={config.variant} 
        className="gap-1"
        title={interview.interview_statuses?.description || undefined}
      >
        <Icon className={`h-3 w-3 ${status === 'in_progress' || status === 'analyzing' ? 'animate-spin' : ''}`} />
        {displayName}
      </Badge>
    )
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Interview Companion
              </CardTitle>
              <CardDescription className="mt-2">
                Record and analyze Google Meet interviews with AI-powered insights
              </CardDescription>
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
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* No interviews state */}
      {interviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
            <p className="text-muted-foreground mb-4">
              Schedule your first interview to get started with AI-powered analysis
            </p>
            <CreateInterviewDialog 
              jobId={jobId} 
              onInterviewCreated={handleInterviewCreated}
              variant="default"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interview List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Interview Sessions</h3>
            {interviews.map((interview) => (
              <Card
                key={interview.id}
                className={`cursor-pointer transition-all ${
                  selectedInterview?.id === interview.id 
                    ? 'ring-2 ring-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => loadInterviewDetails(interview.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">
                        {interview.title || `Interview #${interviews.indexOf(interview) + 1}`}
                      </p>
                      {getStatusBadge(interview)}
                    </div>
                    
                    {interview.candidates && (
                      <p className="text-sm text-muted-foreground">
                        {interview.candidates.first_name} {interview.candidates.last_name}
                        {interview.candidates.email && (
                          <span className="text-xs"> ({interview.candidates.email})</span>
                        )}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {new Date(interview.created_at).toLocaleDateString()} at{' '}
                      {new Date(interview.created_at).toLocaleTimeString()}
                    </p>
                    
                    {interview.interview_scores && interview.interview_scores[0] && (
                      <div className="flex items-center gap-2">
                        <BarChart className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Score: {interview.interview_scores[0].overall_score}/4.0
                        </span>
                      </div>
                    )}

                    {(interview.transcript_count ?? 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {interview.transcript_count} transcript segments
                        </span>
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Interview Details */}
          <div className="lg:col-span-2">
            {selectedInterview ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedInterview.title || 'Interview Details'}</CardTitle>
                      <CardDescription>
                        {selectedInterview.candidates && (
                          <div>
                            {selectedInterview.candidates.first_name} {selectedInterview.candidates.last_name}
                            {selectedInterview.candidates.email && (
                              <span> • {selectedInterview.candidates.email}</span>
                            )}
                          </div>
                        )}
                        {new Date(selectedInterview.created_at).toLocaleDateString()} at{' '}
                        {new Date(selectedInterview.created_at).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(selectedInterview)}
                  </div>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select an interview to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
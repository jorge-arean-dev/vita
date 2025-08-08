"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Loader2, AlertCircle, BarChart } from "lucide-react"
import { InterviewWithDetails } from "@/types/interview.types"
import { analyzeInterview } from "@/app/actions/interviews"

interface InterviewTranscriptProps {
  interview: InterviewWithDetails
  onAnalyze: () => void
}

export default function InterviewTranscript({ interview, onAnalyze }: InterviewTranscriptProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const { toast } = useToast()

  const handleAnalyze = async () => {
    setAnalyzing(true)
    
    try {
      const formData = new FormData()
      formData.append("interviewId", interview.id)
      
      const result = await analyzeInterview(formData)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Interview analyzed successfully"
        })
        onAnalyze()
      }
    } catch (error) {
      console.error("Error analyzing interview:", error)
      toast({
        title: "Error",
        description: "Failed to analyze interview",
        variant: "destructive"
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Check if transcript exists
  const hasTranscript = interview.interview_transcripts && interview.interview_transcripts.length > 0

  if (!hasTranscript) {
    return (
      <div className="py-8 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">
          {interview.status === 'in_progress' 
            ? "Interview is in progress. Transcript will be available once the recording is complete."
            : "No transcript available yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Analysis button */}
      {interview.status === 'ready_for_analysis' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Transcript is ready for analysis</span>
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart className="h-4 w-4 mr-2" />
                  Analyze Now
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Transcript display */}
      <ScrollArea className="h-[500px] w-full rounded-md border p-4">
        <div className="space-y-4">
          {(interview.interview_transcripts || [])
            .sort((a, b) => (a.start_time || 0) - (b.start_time || 0))
            .map((segment, index) => (
              <div key={segment.id || index} className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTime(segment.start_time)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary mb-1">
                      {segment.speaker}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {segment.text}
                    </p>
                  </div>
                </div>
                {index < (interview.interview_transcripts || []).length - 1 && (
                  <hr className="border-border/50" />
                )}
              </div>
            ))}
        </div>
      </ScrollArea>

      {/* Transcript stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{(interview.interview_transcripts || []).length} segments</span>
        <span>•</span>
        <span>
          Duration: {formatTime(
            Math.max(...(interview.interview_transcripts || []).map(t => t.end_time || 0))
          )}
        </span>
      </div>
    </div>
  )
}
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

/**
 * Error boundary component for job pages.
 * 
 * This component catches JavaScript errors anywhere in the job editor
 * component tree and displays a fallback UI instead of crashing the app.
 * It provides users with helpful error information and recovery options.
 */

interface JobErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function JobError({ error, reset }: JobErrorProps) {
  useEffect(() => {
    // Log error details for debugging
    console.error("Job page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              We encountered an error while loading the job editor. 
              This might be a temporary issue.
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 p-3 bg-muted rounded-md text-left">
                <summary className="cursor-pointer font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={reset} 
              className="w-full"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/protected/jobs"}
              className="w-full"
              size="sm"
            >
              Back to Jobs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
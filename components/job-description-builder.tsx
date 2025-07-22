"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface JobData {
  id: string
  title: string
  companyId?: string
  companyName?: string
  initialNotes?: string
}

interface JobDescriptionBuilderProps {
  jobId: string
  jobData?: JobData | null
}

export default function JobDescriptionBuilder({ jobId, jobData }: JobDescriptionBuilderProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push(`/protected/jobs/${jobId}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          {/* Tool Header with responsive layout */}
          <div className="space-y-4">
            {/* Title and Back button - Option A layout */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Job Description Builder</h2>
              <Button variant="outline" size="sm" onClick={handleBack} className="gap-2 sm:mt-0">
                <ArrowLeft className="h-4 w-4" />
                Back to Tools
              </Button>
              </div>
              
              {/* Subtitle spans full width */}
              <p className="text-muted-foreground">Create polished job descriptions from rough notes or client calls with AI assistance to attract the right candidates.</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* TODO Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Coming Soon:</strong> This tool is currently under development. The Job Description Builder will only include the job description functionality (not attributes or requirements as those need further refinement).
              </AlertDescription>
            </Alert>

            {/* Placeholder Content */}
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold text-muted-foreground mb-2">
                Job Description Builder
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                This feature will help you generate professional job descriptions based on your initial notes and requirements. 
                It will be implemented in a future update.
              </p>
            </div>

            {/* TODO List */}
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              <h5 className="font-medium text-sm">Implementation TODO:</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Migrate job description generation from Define phase
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Exclude attributes and requirements (needs separate refinement)
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Create UI for job description input and AI generation
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Integrate with existing job description API endpoints
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Add save/edit functionality for generated descriptions
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
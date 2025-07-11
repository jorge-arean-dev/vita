"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit } from "lucide-react"
import CopyButton from "@/components/ui/copy-button"
import { TabPhaseComponentProps, RoleAnalysis, JobDescriptionOptions } from "@/types/job"
import { buildJobPhaseUrl, getPlaceholderContent } from "@/lib/helpers/job"
import { 
  DEFAULT_ROLE_ANALYSIS, 
  DEFAULT_JOB_DESCRIPTION_OPTIONS, 
  JOB_DESCRIPTION_OPTIONS 
} from "@/lib/constants/job"

/**
 * Define phase component for job creation and editing.
 * 
 * This phase handles the initial job definition workflow including:
 * - Basic job information (title, company, notes)
 * - AI-powered role analysis (attributes and requirements)
 * - Job description generation with customizable options
 * 
 * The component uses a tabbed interface to organize the different
 * aspects of job definition and integrates with AI services for
 * content generation.
 */

export default function DefinePhase({ jobId, jobData, currentTab, onDataChange }: TabPhaseComponentProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: jobData?.title || "",
    companyName: jobData?.companyName || "",
    initialNotes: jobData?.initialNotes || ""
  })

  const [roleAnalysis, setRoleAnalysis] = useState<RoleAnalysis>(DEFAULT_ROLE_ANALYSIS)

  const [jobDescriptionOptions, setJobDescriptionOptions] = useState<JobDescriptionOptions>(
    DEFAULT_JOB_DESCRIPTION_OPTIONS
  )

  const [jobDescription, setJobDescription] = useState("")

  const activeTab = currentTab || "initial-data"

  const handleTabChange = (value: string) => {
    router.push(buildJobPhaseUrl(jobId, "define", value))
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    onDataChange({ [field]: value })
  }

  const handleSaveInitialData = () => {
    console.log("Saving initial data:", formData)
    // TODO: Implement save logic
  }

  const handleGenerateRoleAnalysis = () => {
    // TODO: Implement API call to generate role analysis
    console.log("Generating role analysis from:", formData.initialNotes)
    
    // Placeholder data
    setRoleAnalysis({
      attributes: "Sample attributes based on the initial notes...",
      requirements: "Sample requirements based on the initial notes..."
    })
  }

  const handleGenerateJobDescription = () => {
    // TODO: Implement API call to generate job description
    console.log("Generating job description with options:", jobDescriptionOptions)
    
    // Placeholder data
    setJobDescription("Generated job description based on the selected options and role analysis...")
  }

  const handleCopySuccess = () => {
    console.log("Content copied to clipboard")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="initial-data">Initial Data</TabsTrigger>
          <TabsTrigger value="role-analysis">Role Analysis</TabsTrigger>
          <TabsTrigger value="job-description">Job Description</TabsTrigger>
        </TabsList>

        <TabsContent value="initial-data">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Initial Job Information</h3>
                <p className="text-sm text-muted-foreground">
                  Basic information about the job and company
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.companyName}
                  onChange={(e) => handleFormChange("companyName", e.target.value)}
                  placeholder="Company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  placeholder="Job title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Initial Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.initialNotes}
                  onChange={(e) => handleFormChange("initialNotes", e.target.value)}
                  placeholder="Enter client call notes, existing job description, or any initial information"
                  rows={6}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveInitialData}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-analysis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Role Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  AI-extracted attributes and requirements from your notes
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Attributes</Label>
                  <CopyButton 
                    text={roleAnalysis.attributes}
                    onCopy={handleCopySuccess}
                  />
                </div>
                <Textarea
                  value={roleAnalysis.attributes}
                  onChange={(e) => setRoleAnalysis(prev => ({ ...prev, attributes: e.target.value }))}
                  placeholder={getPlaceholderContent('role-attributes')}
                  rows={6}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Requirements</Label>
                  <CopyButton 
                    text={roleAnalysis.requirements}
                    onCopy={handleCopySuccess}
                  />
                </div>
                <Textarea
                  value={roleAnalysis.requirements}
                  onChange={(e) => setRoleAnalysis(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder={getPlaceholderContent('role-requirements')}
                  rows={6}
                />
              </div>

              <div className="flex justify-between">
                <Button onClick={handleGenerateRoleAnalysis}>Generate</Button>
                <Button>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="job-description">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Job Description</h3>
              <p className="text-sm text-muted-foreground">
                Generate a complete job description from your role analysis
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Pick job attributes to display</Label>
                <div className="space-y-3">
                  {JOB_DESCRIPTION_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={jobDescriptionOptions[option.id as keyof typeof jobDescriptionOptions]}
                        onCheckedChange={(checked) =>
                          setJobDescriptionOptions(prev => ({
                            ...prev,
                            [option.id]: checked as boolean
                          }))
                        }
                      />
                      <Label htmlFor={option.id}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Job Description</Label>
                  <CopyButton 
                    text={jobDescription}
                    onCopy={handleCopySuccess}
                  />
                </div>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={getPlaceholderContent('job-description')}
                  rows={12}
                />
              </div>

              <div className="flex justify-between">
                <Button onClick={handleGenerateJobDescription}>Generate</Button>
                <Button>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
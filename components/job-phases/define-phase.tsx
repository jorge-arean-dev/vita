"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
// import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Edit, Sparkles, Check, X, ChevronDown, Plus } from "lucide-react"
import CopyButton from "@/components/ui/copy-button"
import { TabPhaseComponentProps, RoleAnalysis } from "@/types/job"
import { buildJobPhaseUrl, getPlaceholderContent } from "@/lib/helpers/job"
import { 
  DEFAULT_ROLE_ANALYSIS
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
  const [mounted, setMounted] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    initialNotes: ""
  })

  const [roleAnalysis, setRoleAnalysis] = useState<RoleAnalysis>(DEFAULT_ROLE_ANALYSIS)

  // const [jobDescriptionOptions, setJobDescriptionOptions] = useState<JobDescriptionOptions>(
  //   DEFAULT_JOB_DESCRIPTION_OPTIONS
  // )

  const [jobDescription, setJobDescription] = useState("")
  
  // Edit mode and loading states for Role Analysis
  const [isEditMode, setIsEditMode] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Edit mode for Initial Data section
  const [isInitialDataEditMode, setIsInitialDataEditMode] = useState(false)
  
  // Companies data for dropdown
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([])
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false)
  const [companySearchValue, setCompanySearchValue] = useState("")
  
  // Store original form data for cancel functionality
  const [originalFormData, setOriginalFormData] = useState({
    title: "",
    companyName: "",
    initialNotes: ""
  })

  // Initialize form data after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    const initialData = {
      title: jobData?.title || "",
      companyName: jobData?.companyName || "",
      initialNotes: jobData?.initialNotes || ""
    }
    setFormData(initialData)
    setOriginalFormData(initialData)
  }, [jobData])

  // Fetch companies data (placeholder implementation)
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // TODO: Replace with actual API call to fetch companies
        // const response = await fetch('/api/companies')
        // const data = await response.json()
        
        // Placeholder data
        const mockCompanies = [
          { id: "1", name: "Microsoft" },
          { id: "2", name: "Google" },
          { id: "3", name: "Apple" },
          { id: "4", name: "Amazon" },
          { id: "5", name: "Meta" },
          { id: "6", name: "Netflix" },
          { id: "7", name: "Tesla" },
          { id: "8", name: "MediCare Innovations" }
        ]
        setCompanies(mockCompanies)
      } catch (error) {
        console.error("Error fetching companies:", error)
      }
    }
    
    if (mounted) {
      fetchCompanies()
    }
  }, [mounted])

  // Handle legacy routing - redirect job-description tab to role-analysis
  const activeTab = currentTab === "job-description" ? "role-analysis" : (currentTab || "initial-data")

  const handleTabChange = (value: string) => {
    router.push(buildJobPhaseUrl(jobId, "define", value))
  }

  // const handleFormChange = (field: string, value: string) => {
  //   setFormData(prev => ({ ...prev, [field]: value }))
  //   onDataChange({ [field]: value })
  // }

  // Initial Data section handlers
  const handleEditInitialData = () => {
    setOriginalFormData({ ...formData })
    setIsInitialDataEditMode(true)
  }

  const handleSaveInitialData = () => {
    // Check for overwrite confirmation for title and notes
    const titleChanged = formData.title !== originalFormData.title && originalFormData.title.trim() !== ""
    const notesChanged = formData.initialNotes !== originalFormData.initialNotes && originalFormData.initialNotes.trim() !== ""
    
    if (titleChanged || notesChanged) {
      const fields = []
      if (titleChanged) fields.push("Job Title")
      if (notesChanged) fields.push("Initial Notes")
      
      const confirmed = window.confirm(
        `This will overwrite your existing ${fields.join(" and ")}. Are you sure you want to continue?`
      )
      if (!confirmed) return
    }

    console.log("Saving initial data:", formData)
    // TODO: Implement save logic and update header
    onDataChange(formData)
    setIsInitialDataEditMode(false)
  }

  const handleCancelInitialData = () => {
    setFormData({ ...originalFormData })
    setIsInitialDataEditMode(false)
  }

  const handleCompanySelect = (companyName: string) => {
    if (companyName === "Create company") {
      // TODO: Handle company creation logic
      console.log("Create new company clicked")
      return
    }
    
    setFormData(prev => ({ ...prev, companyName }))
    setIsCompanyDropdownOpen(false)
    setCompanySearchValue("")
  }

  // Filter companies based on search input
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearchValue.toLowerCase())
  )

  // Show companies only if there's search input
  const shouldShowCompanies = companySearchValue.trim().length > 0

  // Check if any content exists that would be overwritten
  const hasExistingContent = () => {
    return roleAnalysis.attributes.trim() !== "" || 
           roleAnalysis.requirements.trim() !== "" || 
           jobDescription.trim() !== ""
  }

  const handleGenerate = async () => {
    // Check for existing content and show confirmation if needed
    if (hasExistingContent()) {
      const confirmed = window.confirm(
        "This will overwrite your existing content. Are you sure you want to continue?"
      )
      if (!confirmed) return
    }

    setIsGenerating(true)
    
    try {
      // TODO: Replace with actual API call
      console.log("Generating complete role analysis from:", formData.initialNotes)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Placeholder data - populate all three sections
      setRoleAnalysis({
        attributes: "Generated attributes based on the initial notes and job requirements...",
        requirements: "Generated requirements including technical skills, experience, and qualifications..."
      })
      setJobDescription("Generated comprehensive job description with responsibilities, requirements, and company information...")
      
    } catch (error) {
      console.error("Generation error:", error)
      // TODO: Show error toast/alert
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving role analysis data")
    setIsEditMode(false)
  }

  const handleCancel = () => {
    // TODO: Optionally revert changes if needed
    setIsEditMode(false)
  }

  const handleCopySuccess = () => {
    console.log("Content copied to clipboard")
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="initial-data">Initial Data</TabsTrigger>
          <TabsTrigger value="role-analysis">Role Analysis</TabsTrigger>
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
              <div className="flex items-center space-x-2">
                {!isInitialDataEditMode && (
                  <Button variant="outline" size="sm" onClick={handleEditInitialData}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isInitialDataEditMode && (
                  <>
                    <Button onClick={handleSaveInitialData} size="sm">
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancelInitialData}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                {isInitialDataEditMode ? (
                  <Popover open={isCompanyDropdownOpen} onOpenChange={setIsCompanyDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCompanyDropdownOpen}
                        className="w-full justify-between"
                      >
                        {formData.companyName || "Select company..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search companies..." 
                          value={companySearchValue}
                          onValueChange={setCompanySearchValue}
                          className="border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
                        />
                        <CommandList>
                          <CommandGroup>
                            {/* Show filtered companies if there's search input */}
                            {shouldShowCompanies && filteredCompanies.map((company) => (
                              <CommandItem
                                key={company.id}
                                value={company.name}
                                onSelect={() => handleCompanySelect(company.name)}
                              >
                                {company.name}
                              </CommandItem>
                            ))}
                            
                            {/* Show "No company found" if search input exists but no matches */}
                            {shouldShowCompanies && filteredCompanies.length === 0 && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No company found.
                              </div>
                            )}
                            
                            {/* Always show "Create company" */}
                            <CommandItem
                              value="Create company"
                              onSelect={() => handleCompanySelect("Create company")}
                              className={shouldShowCompanies && filteredCompanies.length > 0 ? "border-t mt-1 pt-2" : ""}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create company
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input
                    value={formData.companyName || "No company selected"}
                    readOnly
                    className="cursor-default"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Job title"
                  readOnly={!isInitialDataEditMode}
                  className={!isInitialDataEditMode ? "cursor-default" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Initial Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.initialNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, initialNotes: e.target.value }))}
                  placeholder="Enter client call notes, existing job description, or any initial information"
                  rows={6}
                  readOnly={!isInitialDataEditMode}
                  className={!isInitialDataEditMode ? "cursor-default" : ""}
                />
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
                  {isGenerating 
                    ? "Generating role analysis..." 
                    : "AI-extracted attributes, requirements, and job description"
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditMode && !isGenerating && (
                  <>
                    <Button onClick={handleGenerate} size="sm">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
                {isEditMode && (
                  <>
                    <Button onClick={handleSave} size="sm">
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
                {isGenerating && (
                  <Button disabled size="sm">
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Attributes Subsection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Attributes</Label>
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
                  readOnly={!isEditMode}
                  disabled={isGenerating}
                  className={!isEditMode ? "cursor-default" : ""}
                />
              </div>

              {/* Requirements Subsection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Requirements</Label>
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
                  readOnly={!isEditMode}
                  disabled={isGenerating}
                  className={!isEditMode ? "cursor-default" : ""}
                />
              </div>

              {/* Job Description Subsection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Job Description</Label>
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
                  readOnly={!isEditMode}
                  disabled={isGenerating}
                  className={!isEditMode ? "cursor-default" : ""}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Edit, Sparkles, Check, X, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import AttributesSection from "@/components/sample-job-attributes"
import RequirementsSection from "@/components/requirements-section"
import { updateJobBasicInfo, updateJobRoleAnalysis } from "@/app/actions/job-management"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface JobDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobData: {
    id: string
    title: string
    companyId?: string
    companyName?: string
    initialNotes?: string
    attributes?: AttributesData
    requirements?: Requirement[]
  }
}

interface Company {
  id: string
  name: string
  website: string
  industry: string
}

interface AttributesData {
  rate: {
    value: number | null
    freq: string
  }
  commitment: string
  duration: string
  location: {
    category: string
    regions: string[]
    countries: string[]
  }
}

interface Requirement {
  requirement: string
  type: string
  is_mandatory: boolean
  proficiency_level: "expert" | "advanced" | "beginner" | null
  weight: number
}

// Legacy Company interface for backward compatibility
interface Company {
  id: string
  name: string
  website: string
  industry: string
  culture: string
}

export default function JobDetailsDialog({ open, onOpenChange, jobData }: JobDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("initial-data")
  const { toast } = useToast()
  
  // Initial Data state
  const [isInitialDataEditMode, setIsInitialDataEditMode] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    initialNotes: ""
  })
  const [originalFormData, setOriginalFormData] = useState({
    title: "",
    companyName: "",
    initialNotes: ""
  })
  
  // Company dropdown state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [companySearch, setCompanySearch] = useState("")
  const [comboOpen, setComboOpen] = useState(false)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true)
  
  // New company form fields
  const [newCompanyName, setNewCompanyName] = useState("")
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("")
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("")
  
  // Role Analysis state
  const [isRoleAnalysisEditMode, setIsRoleAnalysisEditMode] = useState(false)
  const [attributesData, setAttributesData] = useState<AttributesData>({
    rate: { value: null, freq: "hourly" },
    commitment: "",
    duration: "",
    location: { category: "", regions: [], countries: [] }
  })
  const [requirementsData, setRequirementsData] = useState<Requirement[]>([])
  const [originalAttributesData, setOriginalAttributesData] = useState<AttributesData>({
    rate: { value: null, freq: "hourly" },
    commitment: "",
    duration: "",
    location: { category: "", regions: [], countries: [] }
  })
  const [originalRequirementsData, setOriginalRequirementsData] = useState<Requirement[]>([])
  
  // Loading states
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Track if there are unsaved changes
  const hasUnsavedChanges = isInitialDataEditMode || isRoleAnalysisEditMode

  // Function to fetch companies from database
  const fetchCompanies = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          website,
          culture,
          industries:industry_id (
            display_name
          )
        `)
        .order('name')
      
      if (error) {
        console.error('Error fetching companies:', error)
        return
      }
      
      // Transform database data to match legacy Company interface
      const transformedCompanies: Company[] = (data || []).map(company => ({
        id: company.id,
        name: company.name,
        website: company.website || '',
        industry: Array.isArray(company.industries) 
          ? company.industries[0]?.display_name || ''
          : (company.industries as { display_name?: string } | null)?.display_name || '',
        culture: company.culture || ''
      }))
      
      setCompanies(transformedCompanies)
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  // Fetch companies when component mounts
  useEffect(() => {
    fetchCompanies()
  }, [])

  // Initialize data from jobData prop
  useEffect(() => {
    if (jobData) {
      console.log("JobDetailsDialog received jobData:", jobData)
      
      const initialData = {
        title: jobData.title || "",
        companyName: jobData.companyName || "",
        initialNotes: jobData.initialNotes || ""
      }
      setFormData(initialData)
      setOriginalFormData(initialData)
      
      // Company will be set in separate useEffect when companies are loaded
      
      // Initialize attributes and requirements if available
      if (jobData.attributes) {
        console.log("Setting attributes data:", jobData.attributes)
        setAttributesData(jobData.attributes)
        setOriginalAttributesData(jobData.attributes)
      }
      if (jobData.requirements) {
        console.log("Setting requirements data:", jobData.requirements)
        setRequirementsData(jobData.requirements)
        setOriginalRequirementsData(jobData.requirements)
      }
    }
  }, [jobData])

  // Set selected company when companies are loaded
  useEffect(() => {
    if (companies.length > 0 && jobData?.companyName && !selectedCompany) {
      const company = companies.find(c => c.name === jobData.companyName)
      if (company) {
        setSelectedCompany(company)
      }
    }
  }, [companies, jobData?.companyName, selectedCompany])

  // Filter companies based on search
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  // Handle dialog close with unsaved changes check
  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Do you want to discard them?")
      if (!confirmed) return
      
      // Reset to original values
      handleCancelInitialData()
      handleCancelRoleAnalysis()
    }
    onOpenChange(newOpen)
  }

  // Handle tab change with unsaved changes check
  const handleTabChange = (value: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Do you want to discard them?")
      if (!confirmed) return
      
      // Reset to original values based on current tab
      if (activeTab === "initial-data") {
        handleCancelInitialData()
      } else {
        handleCancelRoleAnalysis()
      }
    }
    setActiveTab(value)
  }

  // Initial Data handlers
  const handleEditInitialData = () => {
    setOriginalFormData({ ...formData })
    setIsInitialDataEditMode(true)
  }

  const handleSaveInitialData = async () => {
    // Check for changes
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

    setIsSaving(true)
    try {
      const result = await updateJobBasicInfo(jobData.id, {
        title: formData.title,
        companyName: formData.companyName,
        initialNotes: formData.initialNotes
      })
      
      if (result.success) {
        setOriginalFormData({ ...formData })
        setIsInitialDataEditMode(false)
        toast({
          title: "Success",
          description: "Job information updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update job information",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving initial data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelInitialData = () => {
    setFormData({ ...originalFormData })
    setSelectedCompany(companies.find(c => c.name === originalFormData.companyName) || null)
    setIsInitialDataEditMode(false)
    setShowCompanyForm(false)
    setNewCompanyName("")
    setNewCompanyWebsite("")
    setNewCompanyIndustry("")
  }

  // Role Analysis handlers
  const handleEditRoleAnalysis = () => {
    setOriginalAttributesData({ ...attributesData })
    setOriginalRequirementsData([...requirementsData])
    setIsRoleAnalysisEditMode(true)
  }

  const handleSaveRoleAnalysis = async () => {
    const confirmed = window.confirm(
      "This will overwrite your existing role analysis data. Are you sure you want to continue?"
    )
    if (!confirmed) return

    setIsSaving(true)
    try {
      const result = await updateJobRoleAnalysis(jobData.id, {
        attributes: attributesData,
        requirements: requirementsData
      })
      
      if (result.success) {
        setOriginalAttributesData({ ...attributesData })
        setOriginalRequirementsData([...requirementsData])
        setIsRoleAnalysisEditMode(false)
        toast({
          title: "Success",
          description: "Role analysis updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update role analysis",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving role analysis:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelRoleAnalysis = () => {
    setAttributesData({ ...originalAttributesData })
    setRequirementsData([...originalRequirementsData])
    setIsRoleAnalysisEditMode(false)
  }

  const handleGenerate = async () => {
    // Check for existing content
    const hasExistingContent = requirementsData.length > 0 || 
      attributesData.commitment !== "" ||
      attributesData.duration !== "" ||
      attributesData.location.category !== ""
    
    if (hasExistingContent) {
      const confirmed = window.confirm(
        "This will overwrite your existing content. Are you sure you want to continue?"
      )
      if (!confirmed) return
    }

    setIsGenerating(true)
    
    try {
      const supabase = createClient()
      
      // Get the company details for the API call
      const company = companies.find(c => c.name === originalFormData.companyName)
      
      // Call the job-details-extractor API
      const requestBody = {
        content: originalFormData.initialNotes,
        company_name: originalFormData.companyName,
        industry: company?.industry || '',
        culture: company?.culture || ''
      }
      
      console.log("🚀 API Request Body:", requestBody)
      
      // Validate required fields
      if (!originalFormData.initialNotes?.trim()) {
        throw new Error("Initial notes are required but empty")
      }
      if (!originalFormData.companyName?.trim()) {
        throw new Error("Company name is required but empty")
      }
      
      const { data, error } = await supabase.functions.invoke('job-details-extractor', {
        body: requestBody
      })

      console.log("🔴 Raw API Response:", { data, error })
      
      if (error) {
        console.error("🚨 Full API Error Details:", error)
        
        // Try to extract the actual error response from the server
        if (error.context && error.context.status === 500) {
          try {
            const errorText = await error.context.text()
            console.error("🚨 Server Error Response Body:", errorText)
            
            // Parse error response for better user messaging
            try {
              const errorJson = JSON.parse(errorText)
              if (errorJson.details?.includes("429 Too Many Requests")) {
                throw new Error("AI service is temporarily busy due to high demand. Please wait a moment and try again.")
              }
              if (errorJson.details?.includes("OpenAI API error")) {
                throw new Error(`AI service error: ${errorJson.details}. Please try again in a few minutes.`)
              }
            } catch {
              // If we can't parse, fall back to generic message
            }
          } catch (textError) {
            console.error("🚨 Could not read error response body:", textError)
          }
        }
        
        throw new Error(error.message || "Failed to extract job details")
      }

      if (!data) {
        throw new Error("No data returned from API")
      }

      console.log("🔍 Full API Response:", JSON.stringify(data, null, 2))
      
      // Process the API response
      const processedAttributes = {
        rate: {
          value: data.attributes.rate?.value || null,
          freq: data.attributes.rate?.freq || "hourly"
        },
        commitment: data.attributes.commitment || "",
        duration: data.attributes.duration || "",
        location: data.attributes.location || { category: "", regions: [], countries: [] }
      }
      
      // Process requirements array (now flat structure from API)
      const processedRequirements = Array.isArray(data.requirements) ? data.requirements : []
      
      setAttributesData(processedAttributes)
      setRequirementsData(processedRequirements)
      
      // Auto-enter edit mode after generation
      setOriginalAttributesData(processedAttributes)
      setOriginalRequirementsData(processedRequirements)
      setIsRoleAnalysisEditMode(true)
      
    } catch (error) {
      console.error("Error generating content:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="initial-data">Initial Data</TabsTrigger>
            <TabsTrigger value="role-analysis">Role Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="initial-data" className="mt-6">
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
                      <Button 
                        onClick={handleSaveInitialData} 
                        size="sm"
                        disabled={isSaving}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelInitialData}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input
                    id="job-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    readOnly={!isInitialDataEditMode}
                    className={cn(!isInitialDataEditMode && "cursor-default")}
                  />
                </div>

                {/* Company Selection */}
                <div className="space-y-2">
                  <Label>Company</Label>
                  {isInitialDataEditMode && !showCompanyForm ? (
                    <Popover open={comboOpen} onOpenChange={setComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboOpen}
                          className="w-full justify-between"
                          disabled={isLoadingCompanies}
                        >
                          {isLoadingCompanies 
                            ? "Loading companies..." 
                            : selectedCompany?.name || "Select company..."
                          }
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search companies..."
                            value={companySearch}
                            onValueChange={setCompanySearch}
                          />
                          <CommandList>
                            {filteredCompanies.length === 0 && companySearch && (
                              <CommandEmpty>No company found</CommandEmpty>
                            )}
                            <CommandGroup>
                              <CommandItem onSelect={() => {
                                setShowCompanyForm(true)
                                setComboOpen(false)
                              }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create new company
                              </CommandItem>
                              {filteredCompanies.map((company) => (
                                <CommandItem
                                  key={company.id}
                                  onSelect={() => {
                                    setSelectedCompany(company)
                                    setFormData(prev => ({ ...prev, companyName: company.name }))
                                    setCompanySearch("")
                                    setComboOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCompany?.id === company.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <div className="font-medium">{company.name}</div>
                                    <div className="text-sm text-muted-foreground">{company.industry}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : isInitialDataEditMode && showCompanyForm ? (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50 transition-all duration-300 ease-in-out">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Create New Company</h4>
                        <Button variant="ghost" size="sm" onClick={() => setShowCompanyForm(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input
                            id="company-name"
                            placeholder="e.g., Acme Corporation"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="company-website">Website</Label>
                          <Input
                            id="company-website"
                            placeholder="e.g., acme.com"
                            value={newCompanyWebsite}
                            onChange={(e) => setNewCompanyWebsite(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="company-industry">Industry</Label>
                          <Input
                            id="company-industry"
                            placeholder="e.g., Technology"
                            value={newCompanyIndustry}
                            onChange={(e) => setNewCompanyIndustry(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            // TODO: In real app, this would be an API call to create company in Supabase
                            const newCompany: Company = {
                              id: `new-${Date.now()}`,
                              name: newCompanyName,
                              website: newCompanyWebsite,
                              industry: newCompanyIndustry,
                              culture: '', // TODO: Add culture field to new company form
                            }
                            
                            // Select the newly created company
                            setSelectedCompany(newCompany)
                            setFormData(prev => ({ ...prev, companyName: newCompany.name }))
                            
                            // Return to company selection view
                            setShowCompanyForm(false)
                            setNewCompanyName("")
                            setNewCompanyWebsite("")
                            setNewCompanyIndustry("")
                          }} 
                          disabled={!newCompanyName.trim() || !newCompanyWebsite.trim() || !newCompanyIndustry.trim()}
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setShowCompanyForm(false)
                            setNewCompanyName("")
                            setNewCompanyWebsite("")
                            setNewCompanyIndustry("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Input
                      value={formData.companyName}
                      readOnly
                      className="cursor-default"
                    />
                  )}
                </div>

                {/* Initial Notes */}
                <div className="space-y-2">
                  <Label htmlFor="initial-notes">Initial Notes</Label>
                  <Textarea
                    id="initial-notes"
                    value={formData.initialNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, initialNotes: e.target.value }))}
                    placeholder="Enter any known information about the job..."
                    rows={6}
                    readOnly={!isInitialDataEditMode}
                    className={cn(!isInitialDataEditMode && "cursor-default")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="role-analysis" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Role Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    {isGenerating 
                      ? "Generating role analysis..." 
                      : "AI-extracted attributes and requirements"
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!isRoleAnalysisEditMode && !isGenerating && (
                    <>
                      <Button onClick={handleGenerate} size="sm">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleEditRoleAnalysis}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  )}
                  {isRoleAnalysisEditMode && (
                    <>
                      <Button 
                        onClick={handleSaveRoleAnalysis} 
                        size="sm"
                        disabled={isSaving}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelRoleAnalysis}
                        disabled={isSaving}
                      >
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
                {/* Attributes Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Job Attributes</h3>
                  <AttributesSection
                    data={attributesData}
                    isEditMode={isRoleAnalysisEditMode}
                    onChange={setAttributesData}
                  />
                </div>
                
                {/* Requirements Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Job Requirements</h3>
                  <RequirementsSection
                    requirements={requirementsData}
                    isEditMode={isRoleAnalysisEditMode}
                    onChange={setRequirementsData}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
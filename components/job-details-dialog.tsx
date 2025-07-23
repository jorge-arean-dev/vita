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

// Mock companies data - TODO: Replace with real data from Supabase
const mockCompanies = [
  { id: "1", name: "TechCorp Inc.", website: "techcorp.com", industry: "Technology" },
  { id: "2", name: "StartupXYZ", website: "startupxyz.com", industry: "Software" },
  { id: "3", name: "Design Studio", website: "designstudio.com", industry: "Design" },
  { id: "4", name: "Analytics Pro", website: "analyticspro.com", industry: "Data Analytics" },
  { id: "5", name: "CloudTech Solutions", website: "cloudtech.com", industry: "Cloud Computing" },
]

export default function JobDetailsDialog({ open, onOpenChange, jobData }: JobDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("initial-data")
  
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
  const [companySearch, setCompanySearch] = useState("")
  const [comboOpen, setComboOpen] = useState(false)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  
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

  // Initialize data from jobData prop
  useEffect(() => {
    if (jobData) {
      const initialData = {
        title: jobData.title || "",
        companyName: jobData.companyName || "",
        initialNotes: jobData.initialNotes || ""
      }
      setFormData(initialData)
      setOriginalFormData(initialData)
      
      // Set company if available
      const company = mockCompanies.find(c => c.name === jobData.companyName)
      if (company) {
        setSelectedCompany(company)
      }
      
      // Initialize attributes and requirements if available
      if (jobData.attributes) {
        setAttributesData(jobData.attributes)
        setOriginalAttributesData(jobData.attributes)
      }
      if (jobData.requirements) {
        setRequirementsData(jobData.requirements)
        setOriginalRequirementsData(jobData.requirements)
      }
    }
  }, [jobData])

  // Filter companies based on search
  const filteredCompanies = mockCompanies.filter((company) =>
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
      // TODO: Implement actual save to database
      console.log("Saving initial data:", formData)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setOriginalFormData({ ...formData })
      setIsInitialDataEditMode(false)
    } catch (error) {
      console.error("Error saving initial data:", error)
      // TODO: Show error toast
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelInitialData = () => {
    setFormData({ ...originalFormData })
    setSelectedCompany(mockCompanies.find(c => c.name === originalFormData.companyName) || null)
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
      // TODO: Implement actual save to database
      console.log("Saving role analysis:", { attributes: attributesData, requirements: requirementsData })
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setOriginalAttributesData({ ...attributesData })
      setOriginalRequirementsData([...requirementsData])
      setIsRoleAnalysisEditMode(false)
    } catch (error) {
      console.error("Error saving role analysis:", error)
      // TODO: Show error toast
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
      // Simulate API call using database values (not form values)
      console.log("Generating from database values:", {
        title: originalFormData.title,
        companyName: originalFormData.companyName,
        initialNotes: originalFormData.initialNotes
      })
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock API response
      const mockResponse = {
        attributes: {
          rate: {
            value: 50,
            freq: "hourly"
          },
          commitment: "full_time",
          duration: "permanent",
          location: {
            category: "remote_region_specific",
            regions: ["south_america"],
            countries: []
          }
        },
        requirements: [
          {
            requirement: "React.js",
            type: "technical",
            is_mandatory: true,
            proficiency_level: "expert" as const,
            weight: 1
          },
          {
            requirement: "Node.js",
            type: "technical",
            is_mandatory: true,
            proficiency_level: "advanced" as const,
            weight: 0.75
          },
          {
            requirement: "PostgreSQL",
            type: "technical",
            is_mandatory: true,
            proficiency_level: "advanced" as const,
            weight: 0.75
          },
          {
            requirement: "TypeScript",
            type: "technical",
            is_mandatory: true,
            proficiency_level: "expert" as const,
            weight: 1
          },
          {
            requirement: "Communication",
            type: "soft_skill",
            is_mandatory: true,
            proficiency_level: null,
            weight: 0.75
          },
          {
            requirement: "Team collaboration",
            type: "soft_skill",
            is_mandatory: true,
            proficiency_level: null,
            weight: 0.75
          }
        ]
      }
      
      setAttributesData(mockResponse.attributes)
      setRequirementsData(mockResponse.requirements)
      
      // Auto-enter edit mode after generation
      setOriginalAttributesData({ ...attributesData })
      setOriginalRequirementsData([...requirementsData])
      setIsRoleAnalysisEditMode(true)
      
    } catch (error) {
      console.error("Generation error:", error)
      // TODO: Show error toast
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
                        >
                          {selectedCompany?.name || "Select company..."}
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
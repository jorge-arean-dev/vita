"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { createJob } from "@/app/actions/job-management"
import AttributesSection from "@/components/sample-job-attributes"
import RequirementsSection from "@/components/requirements-section"

// Mock companies data - TODO: Replace with real data from Supabase
const mockCompanies = [
  { id: "1", name: "TechCorp Inc.", website: "techcorp.com", industry: "Technology" },
  { id: "2", name: "StartupXYZ", website: "startupxyz.com", industry: "Software" },
  { id: "3", name: "Design Studio", website: "designstudio.com", industry: "Design" },
  { id: "4", name: "Analytics Pro", website: "analyticspro.com", industry: "Data Analytics" },
  { id: "5", name: "CloudTech Solutions", website: "cloudtech.com", industry: "Cloud Computing" },
]

interface CreateJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobCreated: (result: { success: boolean; jobId?: string; error?: string }) => void
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

interface ApiResponse {
  attributes: {
    title: string
    rate: {
      value: number
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
  requirements: Requirement[]
}

export default function CreateJobDialog({ open, onOpenChange, onJobCreated }: CreateJobDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [jobTitle, setJobTitle] = useState("")
  const [needHelpWithTitle, setNeedHelpWithTitle] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companySearch, setCompanySearch] = useState("")
  const [initialNotes, setInitialNotes] = useState("")
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isProcessingStep1, setIsProcessingStep1] = useState(false)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [attributesData, setAttributesData] = useState<AttributesData>({
    rate: { value: null, freq: "hourly" },
    commitment: "",
    duration: "",
    location: { category: "", regions: [], countries: [] }
  })
  const [requirementsData, setRequirementsData] = useState<Requirement[]>([])

  // New company form fields
  const [newCompanyName, setNewCompanyName] = useState("")
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("")
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("")

  // Filter companies based on search
  const filteredCompanies = mockCompanies.filter((company) =>
    company.name.toLowerCase().includes(companySearch.toLowerCase()),
  )

  const resetForm = () => {
    setStep(1)
    setJobTitle("")
    setNeedHelpWithTitle(false)
    setSelectedCompany(null)
    setCompanySearch("")
    setInitialNotes("")
    setShowCompanyForm(false)
    setNewCompanyName("")
    setNewCompanyWebsite("")
    setNewCompanyIndustry("")
    setIsProcessingStep1(false)
    setApiResponse(null)
    setAttributesData({
      rate: { value: null, freq: "hourly" },
      commitment: "",
      duration: "",
      location: { category: "", regions: [], countries: [] }
    })
    setRequirementsData([])
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (showCompanyForm) {
      setShowCompanyForm(false)
      setNewCompanyName("")
      setNewCompanyWebsite("")
      setNewCompanyIndustry("")
    } else {
      handleClose()
    }
  }

  const handleCreateNewCompany = () => {
    setShowCompanyForm(true)
    setComboOpen(false)
  }

  const handleSaveNewCompany = () => {
    // TODO: In real app, this would be an API call to create company in Supabase
    const newCompany: Company = {
      id: `new-${Date.now()}`,
      name: newCompanyName,
      website: newCompanyWebsite,
      industry: newCompanyIndustry,
    }

    // Select the newly created company
    setSelectedCompany(newCompany)
    setCompanySearch(newCompany.name)

    // Return to company selection view
    setShowCompanyForm(false)
    setNewCompanyName("")
    setNewCompanyWebsite("")
    setNewCompanyIndustry("")
  }

  const handleNext = async () => {
    if (step === 1) {
      setIsProcessingStep1(true)
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Mock API response based on the sample
        const mockResponse: ApiResponse = {
          attributes: {
            title: "Senior Full-Stack Developer",
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
              proficiency_level: "expert",
              weight: 1
            },
            {
              requirement: "Node.js",
              type: "technical",
              is_mandatory: true,
              proficiency_level: "advanced",
              weight: 0.75
            },
            {
              requirement: "PostgreSQL",
              type: "technical",
              is_mandatory: true,
              proficiency_level: "advanced",
              weight: 0.75
            },
            {
              requirement: "TypeScript",
              type: "technical",
              is_mandatory: true,
              proficiency_level: "expert",
              weight: 1
            },
            {
              requirement: "AWS",
              type: "technology_domain",
              is_mandatory: false,
              proficiency_level: "beginner",
              weight: 0.5
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
            },
            {
              requirement: "Full-stack development",
              type: "role",
              is_mandatory: true,
              proficiency_level: "expert",
              weight: 1
            },
            {
              requirement: "Cloud computing",
              type: "technology_domain",
              is_mandatory: false,
              proficiency_level: "beginner",
              weight: 0.5
            }
          ]
        }
        
        setApiResponse(mockResponse)
        setAttributesData({
          rate: {
            value: mockResponse.attributes.rate.value,
            freq: mockResponse.attributes.rate.freq
          },
          commitment: mockResponse.attributes.commitment,
          duration: mockResponse.attributes.duration,
          location: mockResponse.attributes.location
        })
        setRequirementsData(mockResponse.requirements)
        
        setStep(2)
      } catch (error) {
        console.error("Error processing step 1:", error)
        // TODO: Show error to user
      } finally {
        setIsProcessingStep1(false)
      }
    }
  }

  const handleHelpWithTitleChange = (checked: boolean) => {
    setNeedHelpWithTitle(checked)
    if (checked) {
      setJobTitle("")
    }
  }

  const handleCreateJob = async () => {
    setIsCreating(true)
    
    try {
      // Prepare data for job creation - combining step 1 and step 2 data
      const jobData = {
        // Step 1 data
        title: needHelpWithTitle ? apiResponse?.attributes.title || "Job Title TBD" : jobTitle,
        companyId: selectedCompany?.id || "",
        initialNotes: initialNotes,
        // Step 2 data
        attributes: attributesData,
        requirements: requirementsData,
        apiGeneratedTitle: apiResponse?.attributes.title
      }

      const result = await createJob(jobData)
      
      if (result.success) {
        handleClose()
        onJobCreated(result)
        // Navigate to new job detail page
        router.push(`/protected/jobs/${result.jobId}`)
      } else {
        console.error("Failed to create job:", result.error)
        // TODO: Show error to user
      }
    } catch (error) {
      console.error("Error creating job:", error)
      // TODO: Show error to user
    } finally {
      setIsCreating(false)
    }
  }

  // Updated validation: can proceed if either job title is filled OR help is requested
  const canProceedStep1 = (jobTitle.trim() || needHelpWithTitle) && selectedCompany && initialNotes.trim()
  const canSaveNewCompany = newCompanyName.trim() && newCompanyWebsite.trim() && newCompanyIndustry.trim()
  const canCreateJob = attributesData.commitment && attributesData.duration && attributesData.location.category

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleClose()
      } else {
        onOpenChange(newOpen)
      }
    }}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="mb-6">Create Job</DialogTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {step} of 2</span>
              <span>{step === 1 ? "Share what you know about the job" : "Review and refine job details"}</span>
            </div>
            <Progress value={step === 1 ? 50 : 100} className="h-2" />
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            {/* Job Title */}
            <div className="space-y-3">
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                placeholder="e.g., Senior Frontend Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={needHelpWithTitle}
                className={cn(needHelpWithTitle && "bg-muted text-muted-foreground")}
              />

              {/* Help checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="help-with-title"
                  checked={needHelpWithTitle}
                  onCheckedChange={handleHelpWithTitleChange}
                />
                <Label htmlFor="help-with-title" className="text-sm font-normal cursor-pointer text-muted-foreground">
                  I need help creating the job title
                </Label>
              </div>
            </div>

            {/* Company Selection */}
            <div className="space-y-2">
              <Label>Company</Label>

              {!showCompanyForm ? (
                <div className="transition-all duration-300 ease-in-out">
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboOpen}
                        className="w-full justify-between bg-transparent"
                      >
                        {selectedCompany ? selectedCompany.name : "Select or search company..."}
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
                            <CommandEmpty>Company not found</CommandEmpty>
                          )}

                          <CommandGroup>
                            <CommandItem onSelect={handleCreateNewCompany} className="cursor-pointer">
                              <Plus className="mr-2 h-4 w-4" />
                              Create new company
                            </CommandItem>

                            {filteredCompanies.map((company) => (
                              <CommandItem
                                key={company.id}
                                onSelect={() => {
                                  setSelectedCompany(company)
                                  setCompanySearch(company.name)
                                  setComboOpen(false)
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCompany?.id === company.id ? "opacity-100" : "opacity-0",
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
                </div>
              ) : (
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
                    <Button size="sm" onClick={handleSaveNewCompany} disabled={!canSaveNewCompany}>
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Initial Notes */}
            <div className="space-y-2">
              <Label htmlFor="initial-notes">Initial Notes</Label>
              <Textarea
                id="initial-notes"
                placeholder="Enter any known information about the job, client call notes, job description details, or general role requirements..."
                className="min-h-[120px] resize-none"
                value={initialNotes}
                onChange={(e) => setInitialNotes(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This information will help generate a comprehensive job description and requirements.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="info-indicator">
              <span>Here&apos;s a preview of the information we&apos;ve extracted from your notes. You can review and edit this information later.</span>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Job Attributes</h3>
                <div className="space-y-2 mb-4">
                  <Label htmlFor="generated-title" className="text-sm font-medium">Job Title</Label>
                  <Input
                    id="generated-title"
                    value={apiResponse?.attributes.title || ""}
                    readOnly
                    className="bg-muted cursor-default"
                  />
                  <p className="text-xs text-muted-foreground">Generated based on your input</p>
                </div>
                <AttributesSection
                  data={attributesData}
                  isEditMode={true}
                  onChange={setAttributesData}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Job Requirements</h3>
                <RequirementsSection
                  requirements={requirementsData}
                  isEditMode={true}
                  onChange={setRequirementsData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dialog Actions */}
        <div className="flex justify-between pt-4">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!canProceedStep1 || isProcessingStep1}>
                {isProcessingStep1 ? "Processing..." : "Next"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleCreateJob} disabled={isCreating || !canCreateJob}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
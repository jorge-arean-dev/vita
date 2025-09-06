"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Plus, X, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import AttributesSection from "@/components/sample-job-attributes"
import RequirementsSection from "@/components/requirements-section"
import { searchIndustries, getCountries, createCompany } from "@/app/actions/companies"


interface CreateJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobCreated: (result: { success: boolean; jobId?: string; error?: string }) => void
}

interface Company {
  id: string
  name: string
  website: string | null
  culture: string | null
  industry: string | null
}

interface SeniorityLevel {
  id: string
  name: string
  display_name: string
  description: string | null
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _ApiResponse {
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
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [jobTitle, setJobTitle] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companySearch, setCompanySearch] = useState("")
  const [initialNotes, setInitialNotes] = useState("")
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [attributesData, setAttributesData] = useState<AttributesData>({
    rate: { value: null, freq: "hourly" },
    commitment: "",
    duration: "",
    location: { category: "", regions: [], countries: [] }
  })
  const [requirementsData, setRequirementsData] = useState<Requirement[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  
  // Company data state
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)

  // New company form fields
  const [newCompanyName, setNewCompanyName] = useState("")
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("")
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("")
  const [newCompanyCountry, setNewCompanyCountry] = useState("")
  
  // Industry and country dropdown states for new company form
  const [industries, setIndustries] = useState<{ id: string; display_name: string }[]>([])
  const [countries, setCountries] = useState<{ iso_code: string; display_name: string }[]>([])
  const [isNewCompanyIndustryOpen, setIsNewCompanyIndustryOpen] = useState(false)
  const [isNewCompanyCountryOpen, setIsNewCompanyCountryOpen] = useState(false)
  const [industrySearchValue, setIndustrySearchValue] = useState("")
  const [countrySearchValue, setCountrySearchValue] = useState("")
  
  // Seniority levels state
  const [seniorityLevels, setSeniorityLevels] = useState<SeniorityLevel[]>([])
  const [selectedSeniorityLevel, setSelectedSeniorityLevel] = useState<string>("")

  // Fetch companies from database
  const fetchCompanies = useCallback(async () => {
    setIsLoadingCompanies(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          website,
          culture,
          industries (
            display_name
          )
        `)
        .order('name')

      if (error) {
        console.error('Error fetching companies:', error)
        return
      }

      const formattedCompanies: Company[] = data.map(company => ({
        id: company.id,
        name: company.name,
        website: company.website,
        culture: company.culture,
        industry: Array.isArray(company.industries) 
          ? company.industries[0]?.display_name || null
          : (company.industries as { display_name: string } | null)?.display_name || null
      }))

      setCompanies(formattedCompanies)
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setIsLoadingCompanies(false)
    }
  }, [])

  // Load industries for new company form
  const loadIndustries = useCallback(async () => {
    try {
      const result = await searchIndustries("")
      setIndustries(result)
    } catch (error) {
      console.error('Error loading industries:', error)
      toast({
        title: "Error",
        description: "Failed to load industries",
        variant: "destructive"
      })
    }
  }, [toast])

  // Load countries for new company form
  const loadCountries = useCallback(async () => {
    try {
      const result = await getCountries()
      setCountries(result)
    } catch (error) {
      console.error('Error loading countries:', error)
      toast({
        title: "Error", 
        description: "Failed to load countries",
        variant: "destructive"
      })
    }
  }, [toast])

  // Load seniority levels
  const loadSeniorityLevels = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('seniority_levels')
        .select('id, name, display_name, description')
        .eq('is_active', true)
        .order('name') // This will order: executive, junior, lead, mid, senior
      
      if (error) throw error
      
      // Reorder to ascending: Junior, Mid, Senior, Lead, Executive
      const orderedLevels = data?.sort((a, b) => {
        const order = ['junior', 'mid', 'senior', 'lead', 'executive']
        return order.indexOf(a.name) - order.indexOf(b.name)
      }) || []
      
      setSeniorityLevels(orderedLevels)
    } catch (error) {
      console.error('Error loading seniority levels:', error)
      toast({
        title: "Error",
        description: "Failed to load seniority levels",
        variant: "destructive"
      })
    }
  }, [toast])

  // Load companies, industries, countries, and seniority levels when dialog opens
  useEffect(() => {
    if (open) {
      fetchCompanies()
      loadIndustries()
      loadCountries()
      loadSeniorityLevels()
    }
  }, [open, fetchCompanies, loadIndustries, loadCountries, loadSeniorityLevels])

  // Filter companies based on search
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(companySearch.toLowerCase()),
  )

  const resetForm = () => {
    setStep(1)
    setJobTitle("")
    setSelectedCompany(null)
    setCompanySearch("")
    setInitialNotes("")
    setShowCompanyForm(false)
    setNewCompanyName("")
    setNewCompanyWebsite("")
    setNewCompanyIndustry("")
    setNewCompanyCountry("")
    setIndustrySearchValue("")
    setCountrySearchValue("")
    setSelectedSeniorityLevel("")
    setAttributesData({
      rate: { value: null, freq: "hourly" },
      commitment: "",
      duration: "",
      location: { category: "", regions: [], countries: [] }
    })
    setRequirementsData([])
    setCompanies([])
    setIsLoadingCompanies(false)
    setIsGenerating(false)
    setHasGenerated(false)
    setIsSavingCompany(false)
  }

  const handleClose = () => {
    if (isGenerating) {
      toast({
        title: "Processing in progress",
        description: "Please wait until the content generation is complete before closing.",
        variant: "default"
      })
      return
    }
    resetForm()
    onOpenChange(false)
  }

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && isGenerating) {
      toast({
        title: "Processing in progress",
        description: "Please wait until the content generation is complete before closing.",
        variant: "default"
      })
      return
    }
    if (!newOpen) {
      handleClose()
    } else {
      onOpenChange(newOpen)
    }
  }

  const handleCancel = () => {
    if (isGenerating) {
      toast({
        title: "Processing in progress",
        description: "Please wait until the content generation is complete before canceling.",
        variant: "default"
      })
      return
    }
    
    if (showCompanyForm) {
      setShowCompanyForm(false)
      setNewCompanyName("")
      setNewCompanyWebsite("")
      setNewCompanyIndustry("")
      setNewCompanyCountry("")
      setIndustrySearchValue("")
      setCountrySearchValue("")
    } else {
      handleClose()
    }
  }

  const handleCreateNewCompany = () => {
    setShowCompanyForm(true)
    setComboOpen(false)
    // Load data when company form is shown if not already loaded
    if (industries.length === 0) loadIndustries()
    if (countries.length === 0) loadCountries()
  }

  const handleSaveNewCompany = async () => {
    if (!newCompanyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive"
      })
      return
    }

    if (!newCompanyIndustry) {
      toast({
        title: "Validation Error", 
        description: "Industry is required",
        variant: "destructive"
      })
      return
    }

    setIsSavingCompany(true)
    try {
      // Create company in database
      const createdCompany = await createCompany({
        name: newCompanyName.trim(),
        industry_id: newCompanyIndustry,
        country: newCompanyCountry || null,
        website: newCompanyWebsite.trim() || null,
        linkedin: null,
        culture: null
      })

      // Convert to the Company interface format for the UI
      const newCompany: Company = {
        id: createdCompany.id,
        name: createdCompany.name,
        website: createdCompany.website,
        culture: createdCompany.culture,
        industry: industries.find(i => i.id === createdCompany.industry_id)?.display_name || null,
      }

      // Select the newly created company
      setSelectedCompany(newCompany)
      setCompanySearch(newCompany.name)

      // Show success toast
      toast({
        title: "Company Created",
        description: `${newCompany.name} has been successfully created.`,
        variant: "default"
      })

      // Return to company selection view and reset form
      setShowCompanyForm(false)
      setNewCompanyName("")
      setNewCompanyWebsite("")
      setNewCompanyIndustry("")
      setNewCompanyCountry("")
      setIndustrySearchValue("")
      setCountrySearchValue("")

      // Refresh the companies list to include the new company
      fetchCompanies()
    } catch (error) {
      console.error('Error creating company:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create company",
        variant: "destructive"
      })
    } finally {
      setIsSavingCompany(false)
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!selectedCompany) {
        console.error("No company selected")
        return
      }
      
      // Simply move to step 2 without API call
      setStep(2)
    }
  }

  const handleGenerate = async () => {
    if (!selectedCompany) {
      console.error("No company selected")
      return
    }

    setIsGenerating(true)
    
    try {
      const supabase = createClient()
      
      // Call the job-details-extractor API
      const requestBody = {
        content: initialNotes,
        company_name: selectedCompany.name,
        industry: selectedCompany.industry || '',
        culture: selectedCompany.culture || ''
      }
      
      console.log("🚀 API Request Body:", requestBody)
      
      // Validate required fields
      if (!initialNotes?.trim()) {
        throw new Error("Initial notes are required but empty")
      }
      if (!selectedCompany.name?.trim()) {
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
      
      // Set the job title from API response
      if (data.attributes.title) {
        setJobTitle(data.attributes.title)
      }
      
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
      setHasGenerated(true)
      
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

  const handleCreateJob = async () => {
    if (!selectedCompany) {
      console.error("No company selected")
      return
    }

    setIsCreating(true)
    
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("User not authenticated")
      }

      // Prepare job data with proper field mapping
      const jobInsertData = {
        user_id: user.id,
        company_id: selectedCompany.id,
        title: jobTitle,
        initial_notes: initialNotes,
        seniority_level: selectedSeniorityLevel,
        // Map API response to database fields
        rate: attributesData.rate.value,
        pay_freq: attributesData.rate.freq,
        commitment: attributesData.commitment || null,
        duration: attributesData.duration || null,
        location_reqs: attributesData.location.category || null,
        regions: attributesData.location.regions || [],
        countries: attributesData.location.countries || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create the job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert(jobInsertData)
        .select("id")
        .single()

      if (jobError) {
        console.error("Job creation error:", jobError)
        throw new Error("Failed to create job")
      }

      // Create requirements if any exist
      const safeRequirements = requirementsData || []
      if (safeRequirements.length > 0) {
        const requirementsInsertData = safeRequirements.map(req => ({
          job_id: jobData.id,
          requirement: req.requirement,
          type: req.type,
          is_mandatory: req.is_mandatory,
          proficiency_level: req.proficiency_level,
          weight: req.weight
        }))

        const { error: reqError } = await supabase
          .from("job_requirements")
          .insert(requirementsInsertData)

        if (reqError) {
          console.error("Requirements creation error:", reqError)
          // Don't fail the entire operation if requirements fail
          console.warn("Job created but requirements failed to save")
        }
      }

      handleClose()
      onJobCreated({ success: true, jobId: jobData.id })
      
      // Show success toast
      toast({
        title: "Job Created Successfully",
        description: "Your job has been created and is ready to use.",
        variant: "default"
      })
      
      // Navigate to new job detail page
      router.push(`/protected/jobs/${jobData.id}`)
      
    } catch (error) {
      console.error("Error creating job:", error)
      toast({
        title: "Failed to Create Job",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Updated validation: Step 1 only needs company and notes
  const canProceedStep1 = selectedCompany && initialNotes.trim()
  const canSaveNewCompany = newCompanyName.trim() && newCompanyIndustry
  
  // Step 2 validation: require title, seniority level, and at least 1 requirement
  const canCreateJob = jobTitle.trim() && selectedSeniorityLevel && (requirementsData || []).length > 0

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
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
                          {isLoadingCompanies ? (
                            <CommandEmpty>Loading companies...</CommandEmpty>
                          ) : filteredCompanies.length === 0 && companySearch ? (
                            <CommandEmpty>Company not found</CommandEmpty>
                          ) : null}

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
                                  <div className="text-sm text-muted-foreground">
                                    {company.industry || "No industry specified"}
                                  </div>
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
                      <Label htmlFor="company-name">Company Name <span className="text-destructive">*</span></Label>
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
                      <Label htmlFor="company-industry">Industry <span className="text-destructive">*</span></Label>
                      <Popover open={isNewCompanyIndustryOpen} onOpenChange={setIsNewCompanyIndustryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isNewCompanyIndustryOpen}
                            className="w-full justify-between"
                          >
                            {industries.find(i => i.id === newCompanyIndustry)?.display_name || "Select industry"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search industries..."
                              value={industrySearchValue}
                              onValueChange={setIndustrySearchValue}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {industries.length === 0 ? "Loading industries..." : "No industries found"}
                              </CommandEmpty>
                              <CommandGroup>
                                {industries
                                  .filter(industry =>
                                    industry.display_name.toLowerCase().includes(industrySearchValue.toLowerCase())
                                  )
                                  .map((industry) => (
                                    <CommandItem
                                      key={industry.id}
                                      value={industry.display_name}
                                      onSelect={() => {
                                        setNewCompanyIndustry(industry.id)
                                        setIsNewCompanyIndustryOpen(false)
                                        setIndustrySearchValue("")
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          newCompanyIndustry === industry.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {industry.display_name}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="company-country">Country</Label>
                      <Popover open={isNewCompanyCountryOpen} onOpenChange={setIsNewCompanyCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isNewCompanyCountryOpen}
                            className="w-full justify-between"
                          >
                            {countries.find(c => c.iso_code === newCompanyCountry)?.display_name || "Select country"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search countries..."
                              value={countrySearchValue}
                              onValueChange={setCountrySearchValue}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {countries.length === 0 ? "Loading countries..." : "No countries found"}
                              </CommandEmpty>
                              <CommandGroup>
                                {countries
                                  .filter(country =>
                                    country.display_name.toLowerCase().includes(countrySearchValue.toLowerCase())
                                  )
                                  .map((country) => (
                                    <CommandItem
                                      key={country.iso_code}
                                      value={country.display_name}
                                      onSelect={() => {
                                        setNewCompanyCountry(country.iso_code)
                                        setIsNewCompanyCountryOpen(false)
                                        setCountrySearchValue("")
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          newCompanyCountry === country.iso_code ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {country.display_name}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSaveNewCompany} disabled={!canSaveNewCompany || isSavingCompany}>
                      {isSavingCompany ? "Creating..." : "Save"}
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
            {/* Generate button section */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Use AI to auto-fill job details from your notes
              </p>
              {!isGenerating && (
                <Button onClick={handleGenerate} size="sm" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              )}
              {isGenerating && (
                <Button disabled size="sm" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </Button>
              )}
            </div>

            {hasGenerated && (
              <div className="info-indicator">
                <span>Here&apos;s a preview of the information we&apos;ve extracted from your notes. You can review and edit this information later.</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Job Attributes</h3>
                <div className="space-y-2 mb-4">
                  <Label htmlFor="job-title" className="text-sm font-medium">Job Title</Label>
                  <Input
                    id="job-title"
                    placeholder="e.g., Senior Frontend Developer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2 mb-4">
                  <Label htmlFor="seniority-level" className="text-sm font-medium">Seniority Level <span className="text-red-500">*</span></Label>
                  <Select value={selectedSeniorityLevel} onValueChange={setSelectedSeniorityLevel}>
                    <SelectTrigger id="seniority-level">
                      <SelectValue placeholder="Select required seniority level" />
                    </SelectTrigger>
                    <SelectContent>
                      {seniorityLevels.map((level) => (
                        <SelectItem key={level.id} value={level.name}>
                          <div className="flex flex-col">
                            <span>{level.display_name}</span>
                            {level.description && (
                              <span className="text-xs text-muted-foreground">{level.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  requirements={requirementsData || []}
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
              <Button onClick={handleNext} disabled={!canProceedStep1}>
                Next
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={isGenerating}>
                Back
              </Button>
              <Button onClick={handleCreateJob} disabled={isCreating || !canCreateJob || isGenerating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
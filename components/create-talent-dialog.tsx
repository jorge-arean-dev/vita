"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Upload, Link, ChevronDown, UserPlus, Info } from "lucide-react"
import ToggleSlider from "@/components/ui/toggle-slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { searchCountries, createCandidate, uploadTemporaryResume, moveTempResumeToCandidate, insertCandidateSkills, updateCandidateResumeUrl } from "@/app/actions/candidates"

interface Country {
  iso_code: string
  display_name: string
}

interface CandidateFormData {
  firstName: string
  lastName: string
  email: string
  country: string
  linkedin: string
  github: string
  yearsExperience: string
}

interface ParsedSkill {
  name: string
  type: string
  yoe?: number | null
  proficiency_level?: string | null
}

interface CreateTalentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCandidateCreated?: () => void
}

type InputMethod = "auto" | "manual"
type DataSource = "linkedin" | "pdf"
type Step = "data-source" | "review-form"

export default function CreateTalentDialog({ 
  open, 
  onOpenChange, 
  onCandidateCreated 
}: CreateTalentDialogProps) {
  // State management
  const [currentStep, setCurrentStep] = useState<Step>("data-source")
  const [inputMethod, setInputMethod] = useState<InputMethod>("auto")
  const [dataSource, setDataSource] = useState<DataSource>("linkedin")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileUploadError, setFileUploadError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [parsingProgress, setParsingProgress] = useState("")
  const [tempFilePath, setTempFilePath] = useState("")
  const [parsedSkills, setParsedSkills] = useState<ParsedSkill[]>([])
  const [isPending, startTransition] = useTransition()
  
  // Form data
  const [formData, setFormData] = useState<CandidateFormData>({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    linkedin: "",
    github: "",
    yearsExperience: ""
  })
  
  // Track if form has been modified
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)

  // Countries combobox state
  const [countries, setCountries] = useState<Country[]>([])
  const [isCountriesOpen, setIsCountriesOpen] = useState(false)
  const [countrySearchValue, setCountrySearchValue] = useState("")

  // Reset dialog state when closed
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Check if there are unsaved changes
      if (isDirty) {
        setShowUnsavedChangesDialog(true)
        return
      }
      resetForm()
    }
    onOpenChange(newOpen)
  }

  // Reset form to initial state
  const resetForm = () => {
    setCurrentStep("data-source")
    setInputMethod("auto")
    setDataSource("linkedin")
    setLinkedinUrl("")
    setUploadedFile(null)
    setFileUploadError("")
    setIsProcessing(false)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      country: "",
      linkedin: "",
      github: "",
      yearsExperience: ""
    })
    setCountries([])
    setCountrySearchValue("")
    setIsDirty(false)
  }

  // Confirm close with unsaved changes
  const handleConfirmClose = () => {
    setShowUnsavedChangesDialog(false)
    resetForm()
    onOpenChange(false)
  }

  // Handle method selection (auto vs manual)
  const handleMethodSelect = (method: InputMethod) => {
    setInputMethod(method)
    // Always stay on the current step, just change the content dynamically
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileUploadError("")
    
    if (!file) {
      setUploadedFile(null)
      return
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setFileUploadError("Please upload a PDF file only")
      setUploadedFile(null)
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setFileUploadError("File size must be less than 5MB")
      setUploadedFile(null)
      return
    }

    setUploadedFile(file)
  }

  // Process data source (API call)
  const handleProcessDataSource = async () => {
    if (dataSource === "linkedin" && !linkedinUrl.trim()) {
      toast.error("Please enter a LinkedIn URL")
      return
    }
    
    if (dataSource === "pdf" && !uploadedFile) {
      toast.error("Please upload a PDF file")
      return
    }

    setIsProcessing(true)
    
    try {
      if (dataSource === "pdf" && uploadedFile) {
        // Step 1: Upload file to temporary location
        console.log("Starting PDF upload...")
        setUploadProgress("Uploading your resume...")
        const uploadResult = await uploadTemporaryResume(uploadedFile)
        
        console.log("Upload result:", uploadResult)
        if (!uploadResult.success) {
          console.error("Upload failed:", uploadResult.error)
          toast.error(uploadResult.error || "Failed to upload file")
          return
        }
        
        setTempFilePath(uploadResult.tempPath!)
        setUploadProgress("Upload complete!")
        console.log("Upload complete, starting parsing...")
        
        // Step 2: Parse the resume
        setParsingProgress("Analyzing your resume with AI...")
        console.log("Making API call to parse resume with URL:", uploadResult.tempUrl)
        
        const parseResponse = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdf_url: uploadResult.tempUrl })
        })
        
        console.log("Parse response status:", parseResponse.status)
        const parseData = await parseResponse.json()
        console.log("Parse response data:", parseData)
        
        if (!parseResponse.ok) {
          console.error("Parse failed:", parseData.error)
          toast.error(parseData.error || "Failed to parse resume")
          return
        }
        
        setParsingProgress("Analysis complete!")
        console.log("Parsing complete, populating form...")
        
        // Step 3: Pre-fill form data
        setFormData({
          firstName: parseData.main?.first_name || "",
          lastName: parseData.main?.last_name || "",
          email: parseData.main?.email || "",
          country: parseData.main?.country || "",
          linkedin: parseData.main?.linkedin || "",
          github: parseData.main?.github || "",
          yearsExperience: parseData.years_of_experience ? parseData.years_of_experience.toString() : ""
        })
        
        // Store parsed skills for later use
        setParsedSkills(parseData.skills || [])
        setIsDirty(true)
        
        console.log("Moving to review form step...")
        setCurrentStep("review-form")
        toast.success("Resume data extracted successfully!")
      } else {
        // LinkedIn URL processing (existing mock behavior)
        console.log("Processing LinkedIn URL:", linkedinUrl)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        setFormData({
          firstName: "John",
          lastName: "Doe", 
          email: "john.doe@example.com",
          country: "US",
          linkedin: linkedinUrl,
          github: "",
          yearsExperience: "5"
        })
        setIsDirty(true)
        
        setCurrentStep("review-form")
        toast.success("LinkedIn data extracted successfully!")
      }
    } catch (error) {
      console.error("Error processing data source:", error)
      toast.error("Failed to process data source. Please try again.")
    } finally {
      setIsProcessing(false)
      setUploadProgress("")
      setParsingProgress("")
    }
  }

  // Search countries
  const handleSearchCountries = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCountries([])
      return
    }

    try {
      const results = await searchCountries(searchTerm)
      setCountries(results)
    } catch (error) {
      console.error("Error searching countries:", error)
      setCountries([])
    }
  }

  // Handle country selection
  const handleCountrySelect = (countryCode: string, countryName: string) => {
    setFormData(prev => ({ ...prev, country: countryCode }))
    setCountrySearchValue(countryName)
    setIsCountriesOpen(false)
    setIsDirty(true)
  }

  // Handle form submission
  const handleSubmit = () => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      toast.error("First name is required")
      return
    }
    
    if (!formData.lastName.trim()) {
      toast.error("Last name is required")
      return
    }
    
    if (!formData.email.trim()) {
      toast.error("Email is required")
      return
    }
    
    if (!formData.country) {
      toast.error("Country is required")
      return
    }

    startTransition(async () => {
      try {
        // Step 1: Create the candidate
        const result = await createCandidate({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          country: formData.country || undefined,
          linkedin: formData.linkedin || undefined,
          github: formData.github || undefined,
          yearsExperience: formData.yearsExperience ? parseFloat(formData.yearsExperience) : undefined
        })
        
        if (!result.success) {
          toast.error(result.error || "Failed to create candidate")
          return
        }

        // We need the candidate ID for the next steps
        // Since createCandidate doesn't return it, we'll need to modify it
        // For now, let's assume we get it from a modified response
        const candidateId = result.candidateId
        
        if (!candidateId) {
          toast.error("Failed to get candidate ID")
          return
        }

        // Step 2: Move temporary file to final location (if we have one)
        if (tempFilePath) {
          const moveResult = await moveTempResumeToCandidate(tempFilePath, candidateId)
          if (!moveResult.success) {
            console.error("Failed to move resume file:", moveResult.error)
            toast.error("Failed to move resume file, but candidate was created")
          } else if (moveResult.finalUrl) {
            // Step 2a: Update candidate with resume URL
            const updateResult = await updateCandidateResumeUrl(candidateId, moveResult.finalUrl)
            if (!updateResult.success) {
              console.error("Failed to update resume URL:", updateResult.error)
              toast.error("Resume uploaded but URL not saved to candidate")
            }
          }
        }

        // Step 3: Insert skills (if we have any)
        if (parsedSkills.length > 0) {
          const skillsResult = await insertCandidateSkills(candidateId, parsedSkills)
          if (!skillsResult.success) {
            console.error("Failed to insert skills:", skillsResult.error)
            // Don't fail the entire process, just log the error
          }
        }

        toast.success("Candidate created successfully!")
        resetForm() // Reset form and clear dirty state
        onOpenChange(false) // Bypass unsaved changes check
        onCandidateCreated?.()
      } catch (error) {
        console.error("Error creating candidate:", error)
        toast.error("Failed to create candidate")
      }
    })
  }

  // Go back to previous step
  const handleBack = () => {
    switch (currentStep) {
      case "review-form":
        setCurrentStep("data-source")
        break
      default:
        handleOpenChange(false)
    }
  }

  // Get dialog title based on current step
  const getDialogTitle = () => {
    switch (currentStep) {
      case "data-source":
        return "Create Candidate"
      case "review-form":
        return "Review Candidate Information"
      default:
        return "Create Candidate"
    }
  }

  // Check if we can proceed to next step
  const canProceed = () => {
    if (inputMethod === "auto" && currentStep === "data-source") {
      return dataSource === "linkedin" 
        ? linkedinUrl.trim() !== ""
        : uploadedFile !== null
    }
    
    // For manual input or review form
    return formData.firstName.trim() !== "" && 
           formData.lastName.trim() !== "" && 
           formData.email.trim() !== ""
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
           
          </DialogHeader>

        <div className="space-y-6">
          {/* Always show toggle - visible on all steps except review-form */}
          {currentStep !== "review-form" && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Choose how you&apos;d like to add this candidate
              </p>
              
              <div className="flex justify-center">
                <ToggleSlider
                  option1="Automatic Load"
                  option2="Manual Input"
                  icon1={<Upload className="h-4 w-4" />}
                  icon2={<UserPlus className="h-4 w-4" />}
                  defaultOption={inputMethod === "auto" ? 1 : 2}
                  onChange={(option) => handleMethodSelect(option === 1 ? "auto" : "manual")}
                />
              </div>
            </div>
          )}

          {/* Auto Load - Data Source Selection */}
          {inputMethod === "auto" && currentStep === "data-source" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Select Data Source</Label>
                <RadioGroup 
                  value={dataSource} 
                  onValueChange={(value) => setDataSource(value as DataSource)}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="linkedin" id="linkedin" />
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      LinkedIn Profile URL
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      PDF Resume Upload
                    </Label>
                  </div>
                </RadioGroup>
                
                {/* Input fields below radio buttons */}
                {dataSource === "linkedin" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="https://linkedin.com/in/candidate-name"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                  </div>
                )}
                
                {dataSource === "pdf" && (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer cursor-pointer"
                    />
                    {uploadedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {uploadedFile.name}
                      </p>
                    )}
                    {fileUploadError && (
                      <p className="text-sm text-destructive">
                        {fileUploadError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 5MB. PDF files only.
                    </p>
                    
                    {/* Progress indicators */}
                    {isProcessing && (uploadProgress || parsingProgress) && (
                      <div className="mt-3 space-y-2">
                        {uploadProgress && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>{uploadProgress}</span>
                          </div>
                        )}
                        {parsingProgress && (
                          <div className="flex items-center gap-2 text-sm text-purple-600">
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>{parsingProgress}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Form Step */}
          {currentStep === "review-form" && (
            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {dataSource === "pdf" && parsedSkills.length > 0
                    ? "Great! We've extracted information from your resume. Please review the details below and make any necessary adjustments before creating the candidate profile."
                    : "Please review the pre-filled information below. You can edit any field as needed. All changes can be updated later from the candidate profile."
                  }
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, firstName: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, lastName: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country <span className="text-red-500">*</span></Label>
                  <Popover open={isCountriesOpen} onOpenChange={setIsCountriesOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {countrySearchValue || "Select country..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search countries..." 
                          value={countrySearchValue}
                          onValueChange={(value) => {
                            setCountrySearchValue(value)
                            handleSearchCountries(value)
                          }}
                        />
                        <CommandList>
                          <CommandGroup>
                            {countries.map((country) => (
                              <CommandItem
                                key={country.iso_code}
                                value={country.display_name}
                                onSelect={() => handleCountrySelect(country.iso_code, country.display_name)}
                              >
                                {country.display_name}
                              </CommandItem>
                            ))}
                            {countrySearchValue.trim().length > 0 && countries.length === 0 && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No countries found
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, linkedin: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username"
                    value={formData.github}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, github: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    placeholder="e.g., 3.5"
                    value={formData.yearsExperience}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Manual Input Form */}
          {inputMethod === "manual" && currentStep === "data-source" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, firstName: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, lastName: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country <span className="text-red-500">*</span></Label>
                  <Popover open={isCountriesOpen} onOpenChange={setIsCountriesOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {countrySearchValue || "Select country..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search countries..." 
                          value={countrySearchValue}
                          onValueChange={(value) => {
                            setCountrySearchValue(value)
                            handleSearchCountries(value)
                          }}
                        />
                        <CommandList>
                          <CommandGroup>
                            {countries.map((country) => (
                              <CommandItem
                                key={country.iso_code}
                                value={country.display_name}
                                onSelect={() => handleCountrySelect(country.iso_code, country.display_name)}
                              >
                                {country.display_name}
                              </CommandItem>
                            ))}
                            {countrySearchValue.trim().length > 0 && countries.length === 0 && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No countries found
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, linkedin: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username"
                    value={formData.github}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, github: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    placeholder="e.g., 3.5"
                    value={formData.yearsExperience}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))
                      setIsDirty(true)
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {/* Auto Load Flow Buttons */}
          {inputMethod === "auto" && currentStep === "data-source" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleProcessDataSource}
                disabled={!canProceed() || isProcessing}
              >
                {isProcessing ? "Processing..." : "Next"}
              </Button>
            </>
          )}

          {/* Auto Load Review Step Buttons */}
          {inputMethod === "auto" && currentStep === "review-form" && (
            <>
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={isPending}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!canProceed() || isPending}
              >
                {isPending ? "Creating..." : "Create"}
              </Button>
            </>
          )}

          {/* Manual Input Flow Buttons */}
          {inputMethod === "manual" && currentStep === "data-source" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!canProceed() || isPending}
              >
                {isPending ? "Creating..." : "Create"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Unsaved Changes Confirmation Dialog */}
    <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            The data you are adding will be lost. Are you sure you want to close?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowUnsavedChangesDialog(false)}>
            Continue Editing
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmClose}>
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
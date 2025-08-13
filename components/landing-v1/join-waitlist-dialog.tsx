"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronsUpDown, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { submitWaitlistForm, type WaitlistFormData } from "@/app/actions/waitlist"
import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"

interface JoinWaitlistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerSource?: "join_waitlist" | "vita_core" | "vita_custom"
}

// Countries will be loaded from database

const roles = [
  "Talent Acquisition Specialist",
  "Technical Recruiter",
  "Non-Technical Recruiter",
  "Recruiting Coordinator",
  "Hiring Manager",
  "Head of Talent / VP People",
  "Founder / CEO",
  "People Operations",
  "HR Generalist",
  "Agency Recruiter",
  "Freelance Recruiter",
  "Other"
]

const industries = [
  "Technology / Software",
  "Financial Services / Fintech",
  "Healthcare / Biotech",
  "Manufacturing / Industrial",
  "Consulting / Services",
  "Retail / eCommerce",
  "Marketing / Advertising",
  "Education / EdTech",
  "Energy / Utilities",
  "Government / Public Sector",
  "Logistics / Supply Chain",
  "Media / Entertainment",
  "Other"
]

const hiringTools = [
  "LinkedIn Recruiter",
  "Greenhouse",
  "Lever",
  "Workable",
  "Airtable",
  "Google Sheets",
  "Notion",
  "Manatal",
  "JazzHR",
  "Recruitee",
  "Other",
  "I don't use any tools"
]

const aiTools = [
  "ChatGPT (OpenAI)",
  "Gemini (Google)",
  "Claude (Anthropic)",
  "Perplexity AI",
  "Other",
  "I don't use any AI tools"
]

export function JoinWaitlistDialog({ open, onOpenChange, triggerSource = "join_waitlist" }: JoinWaitlistDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    linkedin: "",
    role: "",
    roleOther: "",
    industry: "",
    industryOther: "",
    hiringTools: [] as string[],
    hiringToolsOther: "",
    aiTools: [] as string[],
    aiToolsOther: ""
  })

  const [countryOpen, setCountryOpen] = useState(false)
  const [mobileCountryOpen, setMobileCountryOpen] = useState(false)
  const [hiringToolsOpen, setHiringToolsOpen] = useState(false)
  const [aiToolsOpen, setAiToolsOpen] = useState(false)
  const [mobileHiringToolsOpen, setMobileHiringToolsOpen] = useState(false)
  const [mobileAiToolsOpen, setMobileAiToolsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countries, setCountries] = useState<string[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)
  const [countrySearch, setCountrySearch] = useState("")
  const [currentStep, setCurrentStep] = useState(1)

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
    }
  }, [open])

  // Load countries from database when dialog opens
  useEffect(() => {
    if (!open) return
    
    async function loadCountries() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('countries')
          .select('display_name')
          .eq('is_active', true)
          .order('display_name')
        
        if (error) {
          throw error
        }
        
        if (data && data.length > 0) {
          setCountries(data.map(country => country.display_name))
        } else {
          throw new Error('No countries in database')
        }
      } catch (error) {
        console.error('Failed to load countries from database, using fallback:', error)
        // Fallback to hardcoded list
        setCountries([
          "United States", "Canada", "United Kingdom", "Germany", "France", 
          "Spain", "Italy", "Netherlands", "Sweden", "Denmark", "Norway",
          "Australia", "New Zealand", "Japan", "Singapore", "India",
          "Brazil", "Mexico", "Argentina", "Chile", "Colombia"
        ])
      } finally {
        setIsLoadingCountries(false)
      }
    }
    
    if (countries.length === 0) {
      loadCountries()
    } else {
      setIsLoadingCountries(false)
    }
  }, [open, countries.length])

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.toLowerCase().startsWith(countrySearch.toLowerCase())
  )
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // On mobile, only validate if we're on step 2 (submission step)
    // On desktop, validate all fields as before
    const isDesktop = window.innerWidth >= 1024
    if (!isDesktop && currentStep !== 2) {
      return // Don't submit if not on final step on mobile
    }
    
    // Basic validation for all mandatory fields
    if (!formData.name || !formData.email || !formData.country || !formData.role || !formData.industry) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields (Name, Email, Country, Role, Industry)",
        variant: "destructive"
      })
      return
    }

    // Validate "Other" fields if selected
    if (formData.role === "Other" && !formData.roleOther) {
      toast({
        title: "Missing Information",
        description: "Please specify your role",
        variant: "destructive"
      })
      return
    }

    if (formData.industry === "Other" && !formData.industryOther) {
      toast({
        title: "Missing Information", 
        description: "Please specify your industry",
        variant: "destructive"
      })
      return
    }

    if (formData.hiringTools.includes("Other") && !formData.hiringToolsOther) {
      toast({
        title: "Missing Information",
        description: "Please specify the other hiring tools you use",
        variant: "destructive"
      })
      return
    }

    if (formData.aiTools.includes("Other") && !formData.aiToolsOther) {
      toast({
        title: "Missing Information",
        description: "Please specify the other AI tools you use",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare data for server action
      const submitData: WaitlistFormData = {
        name: formData.name,
        email: formData.email,
        country: formData.country,
        linkedin: formData.linkedin,
        role: formData.role,
        industry: formData.industry,
        tools: formData.hiringTools,
        aiTools: formData.aiTools,
        triggerSource: triggerSource,
        roleOther: formData.roleOther,
        industryOther: formData.industryOther,
        toolsOther: formData.hiringToolsOther,
        aiToolsOther: formData.aiToolsOther,
      }

      // Submit to server
      const result = await submitWaitlistForm(submitData)
      
      if (result.success) {
        // Success - close dialog with animation and show toast
        onOpenChange(false)
        
        // Reset form and steps
        setFormData({
          name: "",
          email: "",
          country: "",
          linkedin: "",
          role: "",
          roleOther: "",
          industry: "",
          industryOther: "",
          hiringTools: [],
          hiringToolsOther: "",
          aiTools: [],
          aiToolsOther: ""
        })
        resetSteps()

        // Show success toast after dialog starts closing
        setTimeout(() => {
          toast({
            title: "Welcome to the Waitlist!",
            description: result.message || "Thank you for your interest. We&apos;ll contact you when Vita is ready.",
          })
        }, 300)
      } else {
        // Show error toast
        toast({
          title: "Submission Failed",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent form submission
    // Validate Step 1 fields before proceeding
    if (!formData.name || !formData.email || !formData.country) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields (Name, Email, Country)",
        variant: "destructive"
      })
      return
    }
    setCurrentStep(2)
  }

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent form submission
    setCurrentStep(1)
  }

  const resetSteps = () => {
    setCurrentStep(1)
  }

  const toggleHiringTool = (tool: string) => {
    const noHiringToolsOption = "I don't use any tools"
    
    setFormData(prev => {
      if (tool === noHiringToolsOption) {
        // If selecting "I don't use any tools", clear all other selections
        return {
          ...prev,
          hiringTools: prev.hiringTools.includes(noHiringToolsOption) ? [] : [noHiringToolsOption]
        }
      } else {
        // If selecting any other tool, remove "I don't use any tools" if it's selected
        const filteredTools = prev.hiringTools.filter(t => t !== noHiringToolsOption)
        return {
          ...prev,
          hiringTools: filteredTools.includes(tool)
            ? filteredTools.filter(t => t !== tool)
            : [...filteredTools, tool]
        }
      }
    })
  }

  const toggleAITool = (tool: string) => {
    const noAiToolsOption = "I don't use any AI tools"
    
    setFormData(prev => {
      if (tool === noAiToolsOption) {
        // If selecting "I don't use any AI tools", clear all other selections
        return {
          ...prev,
          aiTools: prev.aiTools.includes(noAiToolsOption) ? [] : [noAiToolsOption]
        }
      } else {
        // If selecting any other tool, remove "I don't use any AI tools" if it's selected
        const filteredTools = prev.aiTools.filter(t => t !== noAiToolsOption)
        return {
          ...prev,
          aiTools: filteredTools.includes(tool)
            ? filteredTools.filter(t => t !== tool)
            : [...filteredTools, tool]
        }
      }
    })
  }

  const getSelectedToolsLabel = (tools: string[], type: 'hiring' | 'ai') => {
    if (tools.length === 0) {
      return type === 'hiring' ? "Select tools..." : "Select AI tools..."
    }
    if (tools.length === 1) {
      return tools[0]
    }
    return `${tools.length} selected`
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content 
          className="dialog-content-safe fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[calc(100vw-1rem)] sm:w-[95vw] max-w-7xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] bg-white/75 backdrop-blur-md border border-gray-200/30 rounded-lg shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-500 overflow-hidden"
        >
          <div className="h-full w-full flex flex-col min-h-0">
            {/* Header */}
            <div className="relative border-b border-gray-200/50 px-4 sm:px-8 py-4 sm:py-6 flex-shrink-0">
              <DialogPrimitive.Close className="absolute right-4 sm:right-6 top-4 sm:top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
              
              <DialogPrimitive.Title className="text-2xl sm:text-3xl md:text-4xl font-bold text-center pr-8">
                Join the Waitlist
              </DialogPrimitive.Title>
              
              {/* Desktop subtitle - visible on lg+ screens */}
              <p className="hidden lg:block text-center text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base pr-8">
                Be among the first to experience Vita&apos;s AI-powered recruiting toolkit
              </p>
              
              {/* Mobile step counter - visible on screens < lg */}
              <div className="lg:hidden text-center mt-2 pr-8">
                <span className="text-sm text-gray-500" aria-live="polite">
                  Step {currentStep} of 2
                </span>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 scrollbar-hide">
              <form onSubmit={handleSubmit} className="min-h-full flex flex-col">
                {/* Desktop Layout: 3 columns on lg+ screens */}
                <div className="hidden lg:grid flex-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 max-w-7xl mx-auto w-full pb-20 min-h-0">
                  
                  {/* Column 1 - Personal Information */}
                  <div className="space-y-4 sm:space-y-5">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-800 border-b border-gray-200 pb-2">Personal Information</h3>
                    
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        What&apos;s your name? <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Jane Doe"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="bg-white/50"
                      />
                      <p className="text-xs text-gray-500">So we know who to reach out to</p>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="bg-white/50"
                      />
                      <p className="text-xs text-gray-500">We&apos;ll use this to contact you when the platform is ready</p>
                    </div>

                    {/* Country Field */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={countryOpen}
                            className="w-full justify-between font-normal bg-white/50"
                            disabled={isLoadingCountries}
                          >
                            {isLoadingCountries 
                              ? "Loading countries..." 
                              : (formData.country || "Select country...")
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <div className="flex flex-col max-h-80">
                            {/* Search Input */}
                            <div className="flex items-center border-b px-3">
                              <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                autoFocus
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                            
                            {/* Countries List */}
                            <div className="overflow-y-auto">
                              {isLoadingCountries ? (
                                <div className="px-2 py-3 text-sm text-muted-foreground">
                                  Loading countries...
                                </div>
                              ) : filteredCountries.length === 0 ? (
                                <div className="px-2 py-3 text-sm text-muted-foreground">
                                  No country found.
                                </div>
                              ) : (
                                filteredCountries.map((country) => (
                                  <div
                                    key={country}
                                    className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, country }))
                                      setCountryOpen(false)
                                      setCountrySearch("")
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.country === country ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {country}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* LinkedIn Field */}
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-sm font-medium">
                        LinkedIn profile
                      </Label>
                      <Input
                        id="linkedin"
                        type="url"
                        placeholder="linkedin.com/in/yourname"
                        value={formData.linkedin}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                        className="bg-white/50"
                      />
                    </div>
                  </div>

                  {/* Column 2 - Professional Information */}
                  <div className="space-y-4 sm:space-y-5">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-800 border-b border-gray-200 pb-2">Professional Background</h3>
                    
                    {/* Current Role Field - Now Mandatory */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium">
                      What best describes your current role? <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger className="bg-white/50">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Select the title that most closely matches your current job</p>
                      {formData.role === "Other" && (
                        <Input
                          placeholder="Please specify your role"
                          value={formData.roleOther}
                          onChange={(e) => setFormData(prev => ({ ...prev, roleOther: e.target.value }))}
                          className="mt-2 bg-white/50"
                        />
                      )}
                    </div>

                    {/* Industry Field - Now Mandatory */}
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-sm font-medium">
                      What industry or sector do you work in? <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                        <SelectTrigger className="bg-white/50">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map(industry => (
                            <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Choose the primary industry you hire for</p>
                      {formData.industry === "Other" && (
                        <Input
                          placeholder="Please specify your industry"
                          value={formData.industryOther}
                          onChange={(e) => setFormData(prev => ({ ...prev, industryOther: e.target.value }))}
                          className="mt-2 bg-white/50"
                        />
                      )}
                    </div>
                  </div>

                  {/* Column 3 - Tools & Technology */}
                  <div className="space-y-4 sm:space-y-5">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-800 border-b border-gray-200 pb-2">Tools & Technology</h3>
                    
                    {/* Hiring Tools Dropdown */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                      Do you use any tools to help with hiring?
                      </Label>
                      <DropdownMenu open={hiringToolsOpen} onOpenChange={setHiringToolsOpen}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal bg-white/50"
                          >
                            <span className="truncate">
                              {getSelectedToolsLabel(formData.hiringTools, 'hiring')}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto bg-white/95 backdrop-blur-sm">
                          <div className="p-2 space-y-1">
                            {hiringTools.map(tool => {
                              const noHiringToolsSelected = formData.hiringTools.includes("I don't use any tools")
                              const isNoHiringToolsOption = tool === "I don't use any tools"
                              const isDisabled = noHiringToolsSelected && !isNoHiringToolsOption
                              
                              return (
                                <div 
                                  key={tool} 
                                  className={`flex items-center space-x-2 py-1.5 px-2 rounded ${
                                    isDisabled 
                                      ? "opacity-50 cursor-not-allowed" 
                                      : "hover:bg-gray-100/50"
                                  }`}
                                >
                                  <Checkbox
                                    id={`hiring-${tool}`}
                                    checked={formData.hiringTools.includes(tool)}
                                    disabled={isDisabled}
                                    onCheckedChange={() => !isDisabled && toggleHiringTool(tool)}
                                  />
                                  <Label
                                    htmlFor={`hiring-${tool}`}
                                    className={`text-sm font-normal flex-1 ${
                                      isDisabled 
                                        ? "cursor-not-allowed text-gray-400" 
                                        : "cursor-pointer"
                                    }`}
                                  >
                                    {tool}
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {formData.hiringTools.includes("Other") && (
                        <Input
                          placeholder="Specify other tools"
                          value={formData.hiringToolsOther}
                          onChange={(e) => setFormData(prev => ({ ...prev, hiringToolsOther: e.target.value }))}
                          className="mt-2 bg-white/50"
                        />
                      )}
                      <p className="text-xs text-gray-500">Select all that apply</p>
                    </div>

                    {/* AI Tools Dropdown */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                      If you use an AI tool, which one is your go-to?
                      </Label>
                      <DropdownMenu open={aiToolsOpen} onOpenChange={setAiToolsOpen}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal bg-white/50"
                          >
                            <span className="truncate">
                              {getSelectedToolsLabel(formData.aiTools, 'ai')}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 bg-white/95 backdrop-blur-sm">
                          <div className="p-2 space-y-1">
                            {aiTools.map(tool => {
                              const noAiToolsSelected = formData.aiTools.includes("I don't use any AI tools")
                              const isNoAiToolsOption = tool === "I don't use any AI tools"
                              const isDisabled = noAiToolsSelected && !isNoAiToolsOption
                              
                              return (
                                <div 
                                  key={tool} 
                                  className={`flex items-center space-x-2 py-1.5 px-2 rounded ${
                                    isDisabled 
                                      ? "opacity-50 cursor-not-allowed" 
                                      : "hover:bg-gray-100/50"
                                  }`}
                                >
                                  <Checkbox
                                    id={`ai-${tool}`}
                                    checked={formData.aiTools.includes(tool)}
                                    disabled={isDisabled}
                                    onCheckedChange={() => !isDisabled && toggleAITool(tool)}
                                  />
                                  <Label
                                    htmlFor={`ai-${tool}`}
                                    className={`text-sm font-normal flex-1 ${
                                      isDisabled 
                                        ? "cursor-not-allowed text-gray-400" 
                                        : "cursor-pointer"
                                    }`}
                                  >
                                    {tool}
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {formData.aiTools.includes("Other") && (
                        <Input
                          placeholder="Specify other AI tools"
                          value={formData.aiToolsOther}
                          onChange={(e) => setFormData(prev => ({ ...prev, aiToolsOther: e.target.value }))}
                          className="mt-2 bg-white/50"
                        />
                      )}
                      <p className="text-xs text-gray-500">Select all that apply</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout: 2-step wizard on screens < lg */}
                <div className="lg:hidden flex-1 flex flex-col min-h-0 relative z-0">
                  <div className="flex-1 pb-20 relative">
                    {currentStep === 1 && (
                      <div className="space-y-4 sm:space-y-5 max-w-md mx-auto">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-800 border-b border-gray-200 pb-2">Personal Background</h3>
                        
                        {/* Name Field */}
                        <div className="space-y-2">
                          <Label htmlFor="mobile-name" className="text-sm font-medium">
                            What&apos;s your name? <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="mobile-name"
                            placeholder="Jane Doe"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            className="bg-white/50"
                          />
                          <p className="text-xs text-gray-500">So we know who to reach out to</p>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                          <Label htmlFor="mobile-email" className="text-sm font-medium">
                            Email address <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="mobile-email"
                            type="email"
                            placeholder="jane@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            className="bg-white/50"
                          />
                          <p className="text-xs text-gray-500">We&apos;ll use this to contact you when the platform is ready</p>
                        </div>

                        {/* Country Field */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Country <span className="text-red-500">*</span>
                          </Label>
                          <Popover open={mobileCountryOpen} onOpenChange={setMobileCountryOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={mobileCountryOpen}
                                className="w-full justify-between font-normal bg-white/50"
                                disabled={isLoadingCountries}
                              >
                                {isLoadingCountries 
                                  ? "Loading countries..." 
                                  : (formData.country || "Select country...")
                                }
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 z-[60]" align="start">
                              <div className="flex flex-col max-h-80">
                                {/* Search Input */}
                                <div className="flex items-center border-b px-3">
                                  <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    autoFocus
                                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                </div>
                                
                                {/* Countries List */}
                                <div className="overflow-y-auto">
                                  {isLoadingCountries ? (
                                    <div className="px-2 py-3 text-sm text-muted-foreground">
                                      Loading countries...
                                    </div>
                                  ) : filteredCountries.length === 0 ? (
                                    <div className="px-2 py-3 text-sm text-muted-foreground">
                                      No country found.
                                    </div>
                                  ) : (
                                    filteredCountries.map((country) => (
                                      <div
                                        key={country}
                                        className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, country }))
                                          setMobileCountryOpen(false)
                                          setCountrySearch("")
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.country === country ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {country}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* LinkedIn Field */}
                        <div className="space-y-2">
                          <Label htmlFor="mobile-linkedin" className="text-sm font-medium">
                            LinkedIn profile
                          </Label>
                          <Input
                            id="mobile-linkedin"
                            type="url"
                            placeholder="linkedin.com/in/yourname"
                            value={formData.linkedin}
                            onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                            className="bg-white/50"
                          />
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-6 max-w-md mx-auto">
                        {/* Professional Background Section */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-800 border-b border-gray-200 pb-2">Professional Background</h3>
                          
                          {/* Current Role Field */}
                          <div className="space-y-2">
                            <Label htmlFor="mobile-role" className="text-sm font-medium">
                              What best describes your current role? <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                              <SelectTrigger className="bg-white/50">
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map(role => (
                                  <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Select the title that most closely matches your current job</p>
                            {formData.role === "Other" && (
                              <Input
                                placeholder="Please specify your role"
                                value={formData.roleOther}
                                onChange={(e) => setFormData(prev => ({ ...prev, roleOther: e.target.value }))}
                                className="mt-2 bg-white/50"
                              />
                            )}
                          </div>

                          {/* Industry Field */}
                          <div className="space-y-2">
                            <Label htmlFor="mobile-industry" className="text-sm font-medium">
                              What industry or sector do you work in? <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                              <SelectTrigger className="bg-white/50">
                                <SelectValue placeholder="Select your industry" />
                              </SelectTrigger>
                              <SelectContent>
                                {industries.map(industry => (
                                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Choose the primary industry you hire for</p>
                            {formData.industry === "Other" && (
                              <Input
                                placeholder="Please specify your industry"
                                value={formData.industryOther}
                                onChange={(e) => setFormData(prev => ({ ...prev, industryOther: e.target.value }))}
                                className="mt-2 bg-white/50"
                              />
                            )}
                          </div>
                        </div>

                        {/* Tools & Technology Section */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-800 border-b border-gray-200 pb-2">Tools & Technology</h3>
                          
                          {/* Hiring Tools Dropdown */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Do you use any tools to help with hiring?
                            </Label>
                            <DropdownMenu open={mobileHiringToolsOpen} onOpenChange={setMobileHiringToolsOpen}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between font-normal bg-white/50"
                                >
                                  <span className="truncate">
                                    {getSelectedToolsLabel(formData.hiringTools, 'hiring')}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto bg-white/95 backdrop-blur-sm z-[60]" side="bottom" align="start">
                                <div className="p-2 space-y-1">
                                  {hiringTools.map(tool => {
                                    const noHiringToolsSelected = formData.hiringTools.includes("I don't use any tools")
                                    const isNoHiringToolsOption = tool === "I don't use any tools"
                                    const isDisabled = noHiringToolsSelected && !isNoHiringToolsOption
                                    
                                    return (
                                      <div 
                                        key={tool} 
                                        className={`flex items-center space-x-2 py-1.5 px-2 rounded ${
                                          isDisabled 
                                            ? "opacity-50 cursor-not-allowed" 
                                            : "hover:bg-gray-100/50"
                                        }`}
                                      >
                                        <Checkbox
                                          id={`mobile-hiring-${tool}`}
                                          checked={formData.hiringTools.includes(tool)}
                                          disabled={isDisabled}
                                          onCheckedChange={() => !isDisabled && toggleHiringTool(tool)}
                                        />
                                        <Label
                                          htmlFor={`mobile-hiring-${tool}`}
                                          className={`text-sm font-normal flex-1 ${
                                            isDisabled 
                                              ? "cursor-not-allowed text-gray-400" 
                                              : "cursor-pointer"
                                          }`}
                                        >
                                          {tool}
                                        </Label>
                                      </div>
                                    )
                                  })}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {formData.hiringTools.includes("Other") && (
                              <Input
                                placeholder="Specify other tools"
                                value={formData.hiringToolsOther}
                                onChange={(e) => setFormData(prev => ({ ...prev, hiringToolsOther: e.target.value }))}
                                className="mt-2 bg-white/50"
                              />
                            )}
                            <p className="text-xs text-gray-500">Select all that apply</p>
                          </div>

                          {/* AI Tools Dropdown */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              If you use an AI tool, which one is your go-to?
                            </Label>
                            <DropdownMenu open={mobileAiToolsOpen} onOpenChange={setMobileAiToolsOpen}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between font-normal bg-white/50"
                                >
                                  <span className="truncate">
                                    {getSelectedToolsLabel(formData.aiTools, 'ai')}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-80 bg-white/95 backdrop-blur-sm z-[60]" side="bottom" align="start">
                                <div className="p-2 space-y-1">
                                  {aiTools.map(tool => {
                                    const noAiToolsSelected = formData.aiTools.includes("I don't use any AI tools")
                                    const isNoAiToolsOption = tool === "I don't use any AI tools"
                                    const isDisabled = noAiToolsSelected && !isNoAiToolsOption
                                    
                                    return (
                                      <div 
                                        key={tool} 
                                        className={`flex items-center space-x-2 py-1.5 px-2 rounded ${
                                          isDisabled 
                                            ? "opacity-50 cursor-not-allowed" 
                                            : "hover:bg-gray-100/50"
                                        }`}
                                      >
                                        <Checkbox
                                          id={`mobile-ai-${tool}`}
                                          checked={formData.aiTools.includes(tool)}
                                          disabled={isDisabled}
                                          onCheckedChange={() => !isDisabled && toggleAITool(tool)}
                                        />
                                        <Label
                                          htmlFor={`mobile-ai-${tool}`}
                                          className={`text-sm font-normal flex-1 ${
                                            isDisabled 
                                              ? "cursor-not-allowed text-gray-400" 
                                              : "cursor-pointer"
                                          }`}
                                        >
                                          {tool}
                                        </Label>
                                      </div>
                                    )
                                  })}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {formData.aiTools.includes("Other") && (
                              <Input
                                placeholder="Specify other AI tools"
                                value={formData.aiToolsOther}
                                onChange={(e) => setFormData(prev => ({ ...prev, aiToolsOther: e.target.value }))}
                                className="mt-2 bg-white/50"
                              />
                            )}
                            <p className="text-xs text-gray-500">Select all that apply</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Always visible at bottom */}
                <div className="flex-shrink-0 sticky bottom-0 px-3 py-3 sm:px-6 sm:py-6 mt-4 z-10">
                  {/* Desktop buttons - 3 column layout */}
                  <div className="hidden lg:flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4 max-w-md mx-auto w-full">
                    <Button
                      type="submit"
                      className="w-full xs:flex-1 bg-black hover:bg-gray-800 text-white py-2.5 text-sm sm:text-base min-w-0 shrink-0"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full xs:flex-1 py-2.5 text-sm sm:text-base min-w-0 shrink-0"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Mobile step navigation buttons */}
                  <div className="lg:hidden flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4 max-w-md mx-auto w-full">
                    {currentStep === 1 ? (
                      <>
                        <Button
                          type="button"
                          className="w-full xs:flex-1 bg-black hover:bg-gray-800 text-white py-2.5 text-sm sm:text-base min-w-0 shrink-0"
                          onClick={handleNext}
                          aria-describedby="step-help"
                        >
                          Next
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full xs:flex-1 py-2.5 text-sm sm:text-base min-w-0 shrink-0"
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                        <div id="step-help" className="sr-only">
                          Complete Step 1 to continue to professional background
                        </div>
                      </>
                    ) : (
                      <>
                        <Button
                          type="submit"
                          className="w-full xs:flex-1 bg-black hover:bg-gray-800 text-white py-2.5 text-sm sm:text-base min-w-0 shrink-0"
                          disabled={isSubmitting}
                          aria-describedby="submit-help"
                        >
                          {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full xs:flex-1 py-2.5 text-sm sm:text-base min-w-0 shrink-0"
                          onClick={handleBack}
                          aria-describedby="back-help"
                        >
                          Back
                        </Button>
                        <div id="submit-help" className="sr-only">
                          Submit your waitlist application
                        </div>
                        <div id="back-help" className="sr-only">
                          Return to Step 1 to edit personal information
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
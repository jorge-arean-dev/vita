"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, Building2 } from "lucide-react"
import { toast } from "sonner"
import { createCompany, getCompany, updateCompany } from "@/app/actions/companies"
import { Edit, X, Check } from "lucide-react"

type DialogMode = 'create' | 'view' | 'edit'

interface CompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: DialogMode
  companyId?: string
  onCompanyCreated?: () => void
  onCompanyUpdated?: () => void
}

interface Industry {
  id: string
  display_name: string
}

interface Country {
  iso_code: string
  display_name: string
}

export default function CompanyDialog({ 
  open, 
  onOpenChange,
  mode = 'create',
  companyId,
  onCompanyCreated,
  onCompanyUpdated
}: CompanyDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [currentMode, setCurrentMode] = useState<DialogMode>(mode)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    industry_id: "",
    country: "",
    website: "",
    linkedin: "",
    culture: ""
  })
  
  // Store original data for cancel functionality
  const [originalData, setOriginalData] = useState({
    name: "",
    industry_id: "",
    country: "",
    website: "",
    linkedin: "",
    culture: ""
  })

  // Dropdown states
  const [industries, setIndustries] = useState<Industry[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [isIndustryOpen, setIsIndustryOpen] = useState(false)
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [industrySearchValue, setIndustrySearchValue] = useState("")
  const [countrySearchValue, setCountrySearchValue] = useState("")

  // Load company data function with useCallback to prevent unnecessary re-renders
  const loadCompanyData = useCallback(async () => {
    if (!companyId) return
    
    setIsLoading(true)
    try {
      const company = await getCompany(companyId)
      if (company) {
        const data = {
          name: company.name,
          industry_id: company.industry_id || "",
          country: company.country || "",
          website: company.website || "",
          linkedin: company.linkedin || "",
          culture: company.culture || ""
        }
        setFormData(data)
        setOriginalData(data)
        
        // Set search values for dropdowns
        if (company.country_name) {
          setCountrySearchValue(company.country_name)
        }
        if (company.industry_name) {
          setIndustrySearchValue(company.industry_name)
        }
      }
    } catch (error) {
      console.error("Error loading company:", error)
      toast.error("Failed to load company details")
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  // Load company data when in view/edit mode
  useEffect(() => {
    if (open && companyId && mode !== 'create') {
      loadCompanyData()
    }
  }, [open, companyId, mode, loadCompanyData])

  // Reset state when mode changes
  useEffect(() => {
    setCurrentMode(mode)
  }, [mode])


  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to original mode when closing
      setCurrentMode(mode)
      
      // Only reset form data if in create mode
      if (mode === 'create') {
        setFormData({
          name: "",
          industry_id: "",
          country: "",
          website: "",
          linkedin: "",
          culture: ""
        })
        setIndustrySearchValue("")
        setCountrySearchValue("")
      }
    }
    onOpenChange(newOpen)
  }

  // Load industries and countries when dialog opens
  useEffect(() => {
    if (open) {
      loadIndustries()
      loadCountries()
    }
  }, [open])

  const loadIndustries = async () => {
    try {
      const { searchIndustries } = await import("@/app/actions/companies")
      const result = await searchIndustries("")
      setIndustries(result)
    } catch (error) {
      console.error("Error loading industries:", error)
      toast.error("Failed to load industries")
    }
  }

  const loadCountries = async () => {
    try {
      // Load countries directly from database since searchCountries requires a search term
      const { getCountries } = await import("@/app/actions/companies")
      const result = await getCountries()
      setCountries(result)
    } catch (error) {
      console.error("Error loading countries:", error)
      toast.error("Failed to load countries")
    }
  }

  const normalizeUrl = (url: string): string | null => {
    if (!url.trim()) return null
    
    let normalizedUrl = url.trim()
    
    // Add https:// if no protocol is specified
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`
    }
    
    try {
      // Validate the URL structure
      const urlObj = new URL(normalizedUrl)
      // Ensure it's http or https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null
      }
      return normalizedUrl
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Company name is required")
      return
    }

    // Validate and normalize URLs
    const normalizedWebsite = normalizeUrl(formData.website)
    if (formData.website && !normalizedWebsite) {
      toast.error("Please enter a valid website URL")
      return
    }

    const normalizedLinkedIn = normalizeUrl(formData.linkedin)
    if (formData.linkedin && !normalizedLinkedIn) {
      toast.error("Please enter a valid LinkedIn URL")
      return
    }

    startTransition(async () => {
      try {
        if (currentMode === 'create') {
          await createCompany({
            name: formData.name.trim(),
            industry_id: formData.industry_id || null,
            country: formData.country || null,
            website: normalizedWebsite,
            linkedin: normalizedLinkedIn,
            culture: formData.culture.trim() || null
          })

          toast.success("Company created successfully")
          handleOpenChange(false)
          onCompanyCreated?.()
        } else if (currentMode === 'edit' && companyId) {
          await updateCompany(companyId, {
            name: formData.name.trim(),
            industry_id: formData.industry_id || null,
            country: formData.country || null,
            website: normalizedWebsite,
            linkedin: normalizedLinkedIn,
            culture: formData.culture.trim() || null
          })

          toast.success("Company updated successfully")
          // Switch back to view mode
          setCurrentMode('view')
          setOriginalData(formData)
          onCompanyUpdated?.()
        }
      } catch (error) {
        console.error("Error saving company:", error)
        toast.error(currentMode === 'create' ? "Failed to create company" : "Failed to update company")
      }
    })
  }

  const handleEdit = () => {
    setCurrentMode('edit')
  }

  const handleCancel = () => {
    if (currentMode === 'edit') {
      // Revert to original data
      setFormData(originalData)
      setCurrentMode('view')
    } else {
      handleOpenChange(false)
    }
  }

  const selectedIndustry = industries.find(i => i.id === formData.industry_id)
  const selectedCountry = countries.find(c => c.iso_code === formData.country)

  const getDialogTitle = () => {
    if (currentMode === 'create') return 'Create Company'
    return formData.name || 'Company Details'
  }

  const isReadOnly = currentMode === 'view'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading company details...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Company Name {currentMode === 'create' && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isReadOnly ? "" : "Enter company name"}
                disabled={isPending}
                readOnly={isReadOnly}
                className={isReadOnly ? "cursor-default" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Popover open={!isReadOnly && isIndustryOpen} onOpenChange={setIsIndustryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isIndustryOpen}
                    className="w-full justify-between"
                    disabled={isPending || isReadOnly}
                  >
                    {selectedIndustry?.display_name || (isReadOnly ? "Not specified" : "Select industry")}
                    {!isReadOnly && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-[462px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search industries..."
                    value={industrySearchValue}
                    onValueChange={setIndustrySearchValue}
                  />
                  <CommandList>
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
                              setFormData({ ...formData, industry_id: industry.id })
                              setIsIndustryOpen(false)
                              setIndustrySearchValue("")
                            }}
                          >
                            {industry.display_name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Popover open={!isReadOnly && isCountryOpen} onOpenChange={setIsCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCountryOpen}
                    className="w-full justify-between"
                    disabled={isPending || isReadOnly}
                  >
                    {selectedCountry?.display_name || (isReadOnly ? "Not specified" : "Select country")}
                    {!isReadOnly && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-[462px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search countries..."
                    value={countrySearchValue}
                    onValueChange={setCountrySearchValue}
                  />
                  <CommandList>
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
                              setFormData({ ...formData, country: country.iso_code })
                              setIsCountryOpen(false)
                              setCountrySearchValue("")
                            }}
                          >
                            {country.display_name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder={isReadOnly ? "" : "example.com"}
                disabled={isPending}
                readOnly={isReadOnly}
                className={isReadOnly ? "cursor-default" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder={isReadOnly ? "" : "linkedin.com/company/example"}
                disabled={isPending}
                readOnly={isReadOnly}
                className={isReadOnly ? "cursor-default" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="culture">Company Culture</Label>
              <Textarea
                id="culture"
                value={formData.culture}
                onChange={(e) => setFormData({ ...formData, culture: e.target.value })}
                placeholder={isReadOnly ? "" : "What's it like to work there? Mention values, vibe, style, share what stands out"}
                rows={4}
                disabled={isPending}
                readOnly={isReadOnly}
                className={isReadOnly ? "cursor-default" : ""}
              />
            </div>

            <DialogFooter>
              {currentMode === 'create' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Company"}
                  </Button>
                </>
              )}
              
              {currentMode === 'view' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
              
              {currentMode === 'edit' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    <Check className="h-4 w-4 mr-2" />
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
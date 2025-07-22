"use client"

import { useState } from "react"
import { Check, ChevronDown, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Mock companies data
const mockCompanies = [
  { id: 1, name: "TechCorp Inc.", website: "techcorp.com", industry: "Technology" },
  { id: 2, name: "StartupXYZ", website: "startupxyz.com", industry: "Software" },
  { id: 3, name: "Design Studio", website: "designstudio.com", industry: "Design" },
  { id: 4, name: "Analytics Pro", website: "analyticspro.com", industry: "Data Analytics" },
  { id: 5, name: "CloudTech Solutions", website: "cloudtech.com", industry: "Cloud Computing" },
]

interface CreateJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobCreated: (job: any) => void
}

interface Company {
  id: number
  name: string
  website: string
  industry: string
}

export default function CreateJobDialog({ open, onOpenChange, onJobCreated }: CreateJobDialogProps) {
  const [step, setStep] = useState(1)
  const [jobTitle, setJobTitle] = useState("")
  const [needHelpWithTitle, setNeedHelpWithTitle] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companySearch, setCompanySearch] = useState("")
  const [initialNotes, setInitialNotes] = useState("")
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)

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
    // Simulate saving to database
    const newCompany: Company = {
      id: mockCompanies.length + 1,
      name: newCompanyName,
      website: newCompanyWebsite,
      industry: newCompanyIndustry,
    }

    // In real app, this would be an API call
    mockCompanies.push(newCompany)

    // Select the newly created company
    setSelectedCompany(newCompany)
    setCompanySearch(newCompany.name)

    // Return to company selection view
    setShowCompanyForm(false)
    setNewCompanyName("")
    setNewCompanyWebsite("")
    setNewCompanyIndustry("")
  }

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
    }
  }

  const handleHelpWithTitleChange = (checked: boolean) => {
    setNeedHelpWithTitle(checked)
    if (checked) {
      setJobTitle("")
    }
  }

  // Updated validation: can proceed if either job title is filled OR help is requested
  const canProceed = (jobTitle.trim() || needHelpWithTitle) && selectedCompany && initialNotes.trim()
  const canSaveNewCompany = newCompanyName.trim() && newCompanyWebsite.trim() && newCompanyIndustry.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
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
            <div className="text-center text-muted-foreground">Step 2 content will be implemented here</div>
          </div>
        )}

        {/* Dialog Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>

          {step === 1 && (
            <Button onClick={handleNext} disabled={!canProceed}>
              Next
            </Button>
          )}

          {step === 2 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => console.log("Create job")}>Create Job</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Edit, Check, X, ChevronDown, Download, Sparkles, Info, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { 
  CandidateDetailData, 
  CandidateSkill, 
  getCandidateSkills, 
  updateCandidatePersonalInfo,
  searchCountries 
} from "@/app/actions/candidates"

interface CandidateDetailsProps {
  candidate: CandidateDetailData
}

interface Country {
  iso_code: string
  display_name: string
}

interface PersonalInfoFormData {
  first_name: string
  last_name: string
  email: string
  country: string
  linkedin: string
  resume_file?: File | null
}

// Helper function to ensure string values
const ensureString = (value: string | null | undefined): string => {
  return value ?? ""
}

export default function CandidateDetails({ candidate }: CandidateDetailsProps) {
  const [activeTab, setActiveTab] = useState("personal-info")
  
  // Personal Information state
  const [isPersonalInfoEditMode, setIsPersonalInfoEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [personalInfoFormData, setPersonalInfoFormData] = useState<PersonalInfoFormData>({
    first_name: ensureString(candidate.first_name),
    last_name: ensureString(candidate.last_name),
    email: ensureString(candidate.email),
    country: ensureString(candidate.country),
    linkedin: ensureString(candidate.linkedin)
  })
  const [originalPersonalInfoData, setOriginalPersonalInfoData] = useState<PersonalInfoFormData>({
    first_name: ensureString(candidate.first_name),
    last_name: ensureString(candidate.last_name),
    email: ensureString(candidate.email),
    country: ensureString(candidate.country),
    linkedin: ensureString(candidate.linkedin)
  })

  // Countries combobox state
  const [countries, setCountries] = useState<Country[]>([])
  const [isCountriesOpen, setIsCountriesOpen] = useState(false)
  const [countrySearchValue, setCountrySearchValue] = useState(ensureString(candidate.country_name))

  // Resume upload state
  const [uploadedResumeFile, setUploadedResumeFile] = useState<File | null>(null)
  const [resumeUploadError, setResumeUploadError] = useState("")
  const [isResumeMarkedForDeletion, setIsResumeMarkedForDeletion] = useState(false)

  // Skills state
  const [skills, setSkills] = useState<CandidateSkill[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGeneratedBanner, setShowGeneratedBanner] = useState(false)

  // Track if personal info has unsaved changes
  const hasPersonalInfoChanges = () => {
    return JSON.stringify(personalInfoFormData) !== JSON.stringify(originalPersonalInfoData) || 
           uploadedResumeFile !== null || 
           isResumeMarkedForDeletion
  }

  const loadSkills = useCallback(async () => {
    setIsLoadingSkills(true)
    try {
      const candidateSkills = await getCandidateSkills(candidate.id)
      setSkills(candidateSkills)
    } catch (error) {
      console.error("Error loading skills:", error)
      toast.error("Failed to load candidate skills")
    } finally {
      setIsLoadingSkills(false)
    }
  }, [candidate.id])

  // Load skills when component mounts or after generation
  useEffect(() => {
    loadSkills()
  }, [candidate.id, loadSkills])

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
    setPersonalInfoFormData(prev => ({ ...prev, country: countryCode }))
    setCountrySearchValue(countryName)
    setIsCountriesOpen(false)
  }

  // Handle resume file upload
  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setResumeUploadError("")
    
    if (!file) {
      setUploadedResumeFile(null)
      return
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setResumeUploadError("Please upload a PDF file only")
      setUploadedResumeFile(null)
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setResumeUploadError("File size must be less than 5MB")
      setUploadedResumeFile(null)
      return
    }

    setUploadedResumeFile(file)
  }

  // Handle remove resume
  const handleRemoveResume = () => {
    setIsResumeMarkedForDeletion(true)
    setUploadedResumeFile(null)
    setResumeUploadError("")
  }

  // Handle undo remove resume
  const handleUndoRemoveResume = () => {
    setIsResumeMarkedForDeletion(false)
  }

  // Personal Information handlers
  const handleEditPersonalInfo = () => {
    setOriginalPersonalInfoData({ ...personalInfoFormData })
    setIsPersonalInfoEditMode(true)
  }

  const handleSavePersonalInfo = async () => {
    // Validate required fields
    if (!personalInfoFormData.first_name.trim()) {
      toast.error("First name is required")
      return
    }
    
    if (!personalInfoFormData.last_name.trim()) {
      toast.error("Last name is required")
      return
    }
    
    if (!personalInfoFormData.email.trim()) {
      toast.error("Email is required")
      return
    }

    setIsSaving(true)
    try {
      await updateCandidatePersonalInfo(candidate.id, personalInfoFormData)
      
      setOriginalPersonalInfoData({ ...personalInfoFormData })
      setIsPersonalInfoEditMode(false)
      toast.success("Personal information updated successfully")
    } catch (error) {
      console.error("Error saving personal info:", error)
      toast.error("Failed to update personal information")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelPersonalInfo = () => {
    setPersonalInfoFormData({ ...originalPersonalInfoData })
    setCountrySearchValue(ensureString(candidate.country_name))
    setUploadedResumeFile(null)
    setResumeUploadError("")
    setIsResumeMarkedForDeletion(false)
    setIsPersonalInfoEditMode(false)
  }

  // Skills generation handler
  const handleGenerateSkills = async () => {
    if (skills.length > 0) {
      const confirmed = window.confirm(
        "This will replace all existing skills with new generated skills. Are you sure you want to continue?"
      )
      if (!confirmed) return
    }

    setIsGenerating(true)
    setShowGeneratedBanner(false)
    
    try {
      // TODO: Implement actual API call to generate skills
      console.log("Generating skills from:", {
        linkedin: originalPersonalInfoData.linkedin,
        resume_url: candidate.resume_url
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock generated skills
      const mockSkills: CandidateSkill[] = [
        {
          id: "1",
          candidate_id: candidate.id,
          skill: "React",
          type: "technical",
          proficiency_level: "advanced",
          source: "linkedin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          skill_type_display_name: "Technical Skills"
        },
        {
          id: "2",
          candidate_id: candidate.id,
          skill: "TypeScript",
          type: "technical",
          proficiency_level: "advanced",
          source: "linkedin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          skill_type_display_name: "Technical Skills"
        },
        {
          id: "3",
          candidate_id: candidate.id,
          skill: "Team Leadership",
          type: "soft",
          proficiency_level: "expert",
          source: "linkedin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          skill_type_display_name: "Soft Skills"
        }
      ]
      
      setSkills(mockSkills)
      setShowGeneratedBanner(true)
      toast.success("Skills generated successfully!")
    } catch (error) {
      console.error("Error generating skills:", error)
      toast.error("Failed to generate skills")
    } finally {
      setIsGenerating(false)
    }
  }

  // Group skills by type
  const groupedSkills = skills.reduce((acc, skill) => {
    const type = skill.skill_type_display_name || skill.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(skill)
    return acc
  }, {} as Record<string, CandidateSkill[]>)

  // Get badge color based on proficiency level (same as job-details-dialog)
  const getBadgeClassName = (proficiencyLevel: string | null) => {
    switch (proficiencyLevel) {
      case "expert":
        return "bg-black text-white border-black hover:bg-gray-800"
      case "advanced":
        return "bg-gray-500 text-white border-gray-500 hover:bg-gray-600"
      case "beginner":
        return "bg-gray-300 text-gray-700 border-gray-300 hover:bg-gray-400"
      default:
        return "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {candidate.first_name} {candidate.last_name}
        </h1>
        <p className="text-muted-foreground">
          Candidate Details
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal-info">Personal Information</TabsTrigger>
          <TabsTrigger value="skills">Candidate Skills</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal-info">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <p className="text-sm text-muted-foreground">
                  Basic information about the candidate
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {!isPersonalInfoEditMode && (
                  <Button variant="outline" size="sm" onClick={handleEditPersonalInfo}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isPersonalInfoEditMode && (
                  <>
                    <Button 
                      onClick={handleSavePersonalInfo} 
                      size="sm"
                      disabled={isSaving}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelPersonalInfo}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={ensureString(personalInfoFormData.first_name)}
                    onChange={(e) => setPersonalInfoFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    readOnly={!isPersonalInfoEditMode}
                    className={cn(!isPersonalInfoEditMode && "cursor-default")}
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={ensureString(personalInfoFormData.last_name)}
                    onChange={(e) => setPersonalInfoFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    readOnly={!isPersonalInfoEditMode}
                    className={cn(!isPersonalInfoEditMode && "cursor-default")}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={ensureString(personalInfoFormData.email)}
                    onChange={(e) => setPersonalInfoFormData(prev => ({ ...prev, email: e.target.value }))}
                    readOnly={!isPersonalInfoEditMode}
                    className={cn(!isPersonalInfoEditMode && "cursor-default")}
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label>Country</Label>
                  {isPersonalInfoEditMode ? (
                    <Popover open={isCountriesOpen} onOpenChange={setIsCountriesOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {ensureString(countrySearchValue) || "Select country..."}
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
                  ) : (
                    <Input
                      value={ensureString(candidate.country_name) || "Not specified"}
                      readOnly
                      className="cursor-default"
                    />
                  )}
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={ensureString(personalInfoFormData.linkedin)}
                    onChange={(e) => setPersonalInfoFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                    readOnly={!isPersonalInfoEditMode}
                    className={cn(!isPersonalInfoEditMode && "cursor-default")}
                  />
                </div>

                {/* Resume */}
                <div className="space-y-2">
                  <Label>Resume</Label>
                  {isPersonalInfoEditMode ? (
                    <div className="space-y-2">
                      {/* Show removal confirmation or upload options */}
                      {isResumeMarkedForDeletion ? (
                        <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="text-sm text-destructive font-medium">
                                Resume will be removed
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleUndoRemoveResume}
                              className="text-primary hover:text-primary"
                            >
                              Undo
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            The current resume will be deleted when you save.
                          </p>
                        </div>
                      ) : (
                        <>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={handleResumeUpload}
                            className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer cursor-pointer"
                          />
                          {uploadedResumeFile && (
                            <p className="text-sm text-muted-foreground">
                              Selected: {uploadedResumeFile.name}
                            </p>
                          )}
                          {resumeUploadError && (
                            <p className="text-sm text-destructive">
                              {resumeUploadError}
                            </p>
                          )}
                          {!uploadedResumeFile && candidate.resume_url && (
                            <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                              <p className="text-sm text-muted-foreground">
                                Current: <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View existing resume</a>
                              </p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleRemoveResume}
                                className="text-destructive hover:text-destructive h-8 px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Maximum file size: 5MB. PDF files only.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {candidate.resume_url ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="flex-1 justify-start"
                        >
                          <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download Resume
                          </a>
                        </Button>
                      ) : (
                        <Input
                          value="No resume uploaded"
                          readOnly
                          className="cursor-default text-muted-foreground"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Candidate Skills</h3>
                <p className="text-sm text-muted-foreground">
                  Skills extracted from LinkedIn profile and resume
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {hasPersonalInfoChanges() && (
                  <Button 
                    onClick={handleGenerateSkills}
                    size="sm"
                    disabled={isGenerating}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showGeneratedBanner && (
                <div className="info-indicator">
                  <Info className="h-4 w-4" />
                  <span>
                    Skills have been automatically generated from the candidate&apos;s profile. 
                    Please review the generated skills for accuracy.
                  </span>
                </div>
              )}

              {isLoadingSkills ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">Loading skills...</div>
                  </div>
                </div>
              ) : skills.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">No skills found</div>
                    <div className="text-xs text-muted-foreground">
                      Update the candidate&apos;s LinkedIn or resume URL and click Generate to extract skills
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedSkills).map(([skillType, skillsInType]) => (
                    <div key={skillType} className="space-y-3">
                      <Label className="text-sm font-medium">{skillType}</Label>
                      <div className="flex flex-wrap gap-2">
                        {skillsInType.map((skill) => (
                          <Badge 
                            key={skill.id} 
                            className={cn(
                              "border",
                              getBadgeClassName(skill.proficiency_level)
                            )}
                          >
                            {skill.skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
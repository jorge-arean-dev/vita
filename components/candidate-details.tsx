"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SkillBadge } from "@/components/ui/skill-badge"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Edit, Check, X, ChevronDown, Download, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { CandidateBreadcrumb } from "@/components/candidate-breadcrumb"
import { 
  CandidateDetailData, 
  CandidateSkill, 
  getCandidateSkills, 
  updateCandidatePersonalInfo,
  searchCountries,
  addCandidateSkill,
  updateCandidateSkill,
  deleteCandidateSkill
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

// Skill picker interfaces and types
interface EditableSkill extends CandidateSkill {
  isNew?: boolean
  isEdited?: boolean
}

type SkillType = "technical_skill" | "soft_skill" | "role" | "certification" | "technology_domain" | "industry"

const SKILL_TYPES = [
  { name: "technical_skill", display_name: "Technical Skills" },
  { name: "soft_skill", display_name: "Soft Skills" },
  { name: "role", display_name: "Role" },
  { name: "certification", display_name: "Certification" },
  { name: "industry", display_name: "Industry" },
  { name: "technology_domain", display_name: "Technology Domain" }
] as const

// Helper function to check if skill type supports proficiency levels
const supportsProficiency = (type: string) => {
  return type !== "soft_skill" && type !== "certification"
}

// Helper function to ensure string values
const ensureString = (value: string | null | undefined): string => {
  return value ?? ""
}

export default function CandidateDetails({ candidate }: CandidateDetailsProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("personal-info")
  
  // Personal Information state
  const [isPersonalInfoEditMode, setIsPersonalInfoEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Initialize form data with guaranteed string values
  const initializeFormData = (candidateData: CandidateDetailData): PersonalInfoFormData => ({
    first_name: ensureString(candidateData.first_name),
    last_name: ensureString(candidateData.last_name),
    email: ensureString(candidateData.email),
    country: ensureString(candidateData.country),
    linkedin: ensureString(candidateData.linkedin)
  })
  
  const [personalInfoFormData, setPersonalInfoFormData] = useState<PersonalInfoFormData>(() => 
    initializeFormData(candidate)
  )
  const [originalPersonalInfoData, setOriginalPersonalInfoData] = useState<PersonalInfoFormData>(() => 
    initializeFormData(candidate)
  )

  // Countries combobox state
  const [countries, setCountries] = useState<Country[]>([])
  const [isCountriesOpen, setIsCountriesOpen] = useState(false)
  const [countrySearchValue, setCountrySearchValue] = useState(() => ensureString(candidate.country_name))

  // Resume upload state
  const [uploadedResumeFile, setUploadedResumeFile] = useState<File | null>(null)
  const [resumeUploadError, setResumeUploadError] = useState("")
  const [isResumeMarkedForDeletion, setIsResumeMarkedForDeletion] = useState(false)

  // Skills state
  const [skills, setSkills] = useState<CandidateSkill[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)

  // Skills edit mode state
  const [isSkillsEditMode, setIsSkillsEditMode] = useState(false)
  const [editableSkills, setEditableSkills] = useState<EditableSkill[]>([])
  const [originalSkills, setOriginalSkills] = useState<CandidateSkill[]>([])
  const [isSavingSkills, setIsSavingSkills] = useState(false)

  // Add new skill state
  const [newSkills, setNewSkills] = useState("")
  const [newSkillType, setNewSkillType] = useState("")
  const [newProficiencyLevel, setNewProficiencyLevel] = useState<string>("")
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)

  // Unsaved changes dialog state
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

  // Track if personal info has unsaved changes
  const hasPersonalInfoChanges = () => {
    return JSON.stringify(personalInfoFormData) !== JSON.stringify(originalPersonalInfoData) || 
           uploadedResumeFile !== null || 
           isResumeMarkedForDeletion
  }

  // Track if skills have unsaved changes
  const hasSkillsChanges = () => {
    if (!isSkillsEditMode) return false
    return JSON.stringify(editableSkills) !== JSON.stringify(originalSkills)
  }

  // Check if current section has unsaved changes
  const getCurrentSectionUnsavedChanges = () => {
    if (activeTab === "personal-info" && isPersonalInfoEditMode) {
      return hasPersonalInfoChanges()
    }
    if (activeTab === "skills" && isSkillsEditMode) {
      return hasSkillsChanges()
    }
    return false
  }

  // Handle tab switching with unsaved changes protection
  const handleTabChange = (newTab: string) => {
    if (getCurrentSectionUnsavedChanges()) {
      setPendingTabChange(newTab)
      setShowUnsavedChangesDialog(true)
      return
    }
    setActiveTab(newTab)
  }

  const loadSkills = useCallback(async () => {
    setIsLoadingSkills(true)
    try {
      const candidateSkills = await getCandidateSkills(candidate.id)
      setSkills(candidateSkills)
      setOriginalSkills(candidateSkills)
      setEditableSkills(candidateSkills.map(skill => ({ ...skill })))
    } catch (error) {
      console.error("Error loading skills:", error)
      toast({
        title: "Error",
        description: "Failed to load candidate skills",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSkills(false)
    }
  }, [candidate.id, toast])

  // Sync form data when candidate prop changes
  useEffect(() => {
    const newFormData = initializeFormData(candidate)
    setPersonalInfoFormData(newFormData)
    setOriginalPersonalInfoData(newFormData)
    setCountrySearchValue(ensureString(candidate.country_name))
  }, [candidate])
  
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
    setCountrySearchValue(candidate.country_name || "")
    setIsPersonalInfoEditMode(true)
  }

  const handleSavePersonalInfo = async () => {
    // Validate required fields
    if (!personalInfoFormData.first_name.trim()) {
      toast({
        title: "Validation Error",
        description: "First name is required",
        variant: "destructive"
      })
      return
    }
    
    if (!personalInfoFormData.last_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Last name is required",
        variant: "destructive"
      })
      return
    }
    
    if (!personalInfoFormData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      await updateCandidatePersonalInfo(candidate.id, personalInfoFormData)
      
      setOriginalPersonalInfoData({ ...personalInfoFormData })
      setIsPersonalInfoEditMode(false)
      toast({
        title: "Success",
        description: "Personal information updated successfully"
      })
    } catch (error) {
      console.error("Error saving personal info:", error)
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelPersonalInfo = () => {
    setPersonalInfoFormData({ ...originalPersonalInfoData })
    setCountrySearchValue(candidate.country_name || "")
    setUploadedResumeFile(null)
    setResumeUploadError("")
    setIsResumeMarkedForDeletion(false)
    setIsPersonalInfoEditMode(false)
  }

  // Skills edit mode handlers
  const handleEditSkills = () => {
    setOriginalSkills([...skills])
    setEditableSkills(skills.map(skill => ({ ...skill })))
    setIsSkillsEditMode(true)
  }

  const handleSaveSkills = async () => {
    setIsSavingSkills(true)
    try {
      // Process skills changes
      const skillsToAdd = editableSkills.filter(skill => skill.isNew)
      const skillsToUpdate = editableSkills.filter(skill => skill.isEdited && !skill.isNew)
      const skillsToDelete = originalSkills.filter(originalSkill => 
        !editableSkills.find(editableSkill => editableSkill.id === originalSkill.id)
      )

      let hasErrors = false

      // Add new skills
      for (const skill of skillsToAdd) {
        const result = await addCandidateSkill(candidate.id, {
          skill: skill.skill,
          type: skill.type,
          proficiency_level: skill.proficiency_level,
          source: "user_input"
        })
        if (!result.success) {
          console.error("Failed to add skill:", result.error)
          hasErrors = true
        }
      }

      // Update edited skills
      for (const skill of skillsToUpdate) {
        const result = await updateCandidateSkill(skill.id, {
          skill: skill.skill,
          proficiency_level: skill.proficiency_level
        })
        if (!result.success) {
          console.error("Failed to update skill:", result.error)
          hasErrors = true
        }
      }

      // Delete removed skills
      for (const skill of skillsToDelete) {
        const result = await deleteCandidateSkill(skill.id)
        if (!result.success) {
          console.error("Failed to delete skill:", result.error)
          hasErrors = true
        }
      }

      if (hasErrors) {
        toast({
          title: "Partial Success",
          description: "Some skills could not be updated. Please try again.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Skills updated successfully"
        })
      }

      // Reload skills to get the latest data
      await loadSkills()
      setIsSkillsEditMode(false)
      resetSkillsAddSection()
      
    } catch (error) {
      console.error("Error saving skills:", error)
      toast({
        title: "Error",
        description: "Failed to update skills",
        variant: "destructive"
      })
    } finally {
      setIsSavingSkills(false)
    }
  }

  const handleCancelSkills = () => {
    setEditableSkills(originalSkills.map(skill => ({ ...skill })))
    setIsSkillsEditMode(false)
    resetSkillsAddSection()
  }

  const resetSkillsAddSection = () => {
    setNewSkills("")
    setNewSkillType("")
    setNewProficiencyLevel("")
    setIsAddSectionOpen(false)
  }

  // Skills management handlers
  const handleDeleteSkill = (skillId: string) => {
    setEditableSkills(prev => prev.filter(skill => skill.id !== skillId))
  }

  const handleChangeProficiency = (skillId: string, newProficiency: string) => {
    setEditableSkills(prev => prev.map(skill => 
      skill.id === skillId 
        ? { ...skill, proficiency_level: newProficiency, isEdited: true }
        : skill
    ))
  }

  const handleAddSkills = () => {
    if (!newSkills.trim() || !newSkillType) return

    const skillsList = newSkills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)

    const newSkillsArray: EditableSkill[] = skillsList.map((skillName, index) => ({
      id: `new-${Date.now()}-${index}`,
      candidate_id: candidate.id,
      skill: skillName,
      type: newSkillType,
      proficiency_level: (newSkillType === "soft_skill" || newSkillType === "certification") 
        ? null 
        : (newProficiencyLevel || "beginner"),
      source: "user_input",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      skill_type_display_name: SKILL_TYPES.find(t => t.name === newSkillType)?.display_name || newSkillType,
      isNew: true
    }))

    setEditableSkills(prev => [...prev, ...newSkillsArray])
    resetSkillsAddSection()
  }

  // Unsaved changes dialog handlers
  const handleConfirmDiscardChanges = () => {
    if (pendingTabChange) {
      // Cancel current section edit mode
      if (activeTab === "personal-info" && isPersonalInfoEditMode) {
        handleCancelPersonalInfo()
      }
      if (activeTab === "skills" && isSkillsEditMode) {
        handleCancelSkills()
      }
      
      setActiveTab(pendingTabChange)
      setPendingTabChange(null)
    }
    
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
    
    setShowUnsavedChangesDialog(false)
  }

  const handleCancelDiscardChanges = () => {
    setPendingTabChange(null)
    setPendingNavigation(null)
    setShowUnsavedChangesDialog(false)
  }




  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <CandidateBreadcrumb 
        candidateName={`${candidate.first_name} ${candidate.last_name}`}
      />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {candidate.first_name} {candidate.last_name}
        </h1>
        <p className="text-muted-foreground">
          Candidate Details
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
                      disabled={isSaving || !hasPersonalInfoChanges()}
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
                    value={personalInfoFormData.first_name || ""}
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
                    value={personalInfoFormData.last_name || ""}
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
                    value={personalInfoFormData.email || ""}
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
                          {countrySearchValue || "Select country..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Search countries..." 
                            value={countrySearchValue || ""}
                            onValueChange={(value) => {
                              setCountrySearchValue(value || "")
                              handleSearchCountries(value || "")
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
                      value={candidate.country_name || "Not specified"}
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
                    value={personalInfoFormData.linkedin || ""}
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
                          defaultValue="No resume uploaded"
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
                {!isSkillsEditMode && (
                  <Button variant="outline" size="sm" onClick={handleEditSkills}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isSkillsEditMode && (
                  <>
                    <Button 
                      onClick={handleSaveSkills} 
                      size="sm"
                      disabled={isSavingSkills || !hasSkillsChanges()}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {isSavingSkills ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelSkills}
                      disabled={isSavingSkills}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              {isLoadingSkills ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">Loading skills...</div>
                  </div>
                </div>
              ) : (isSkillsEditMode ? editableSkills : skills).length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">No skills found</div>
                    <div className="text-xs text-muted-foreground">
                      {isSkillsEditMode ? "Add skills using the button below" : "Update the candidate's LinkedIn or resume URL and click Generate to extract skills"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Display existing skills */}
                  {(() => {
                    const skillsToDisplay = isSkillsEditMode ? editableSkills : skills
                    const groupedSkills = SKILL_TYPES.map(type => ({
                      ...type,
                      skills: skillsToDisplay.filter(skill => skill.type === type.name)
                    })).filter(group => group.skills.length > 0)

                    return groupedSkills.map((group) => (
                      <div key={group.name} className="space-y-3">
                        <Label className="text-sm font-medium">{group.display_name}</Label>
                        <div className="flex flex-wrap gap-2">
                          {group.skills.map((skill) => (
                            <div key={skill.id} className="flex items-center gap-1">
                              <SkillBadge 
                                skill={skill.skill}
                                level={skill.proficiency_level as "beginner" | "advanced" | "expert" | null}
                                type={skill.type as SkillType}
                              />
                              {isSkillsEditMode && (
                                <>
                                  {supportsProficiency(skill.type) && (
                                    <Select
                                      value={skill.proficiency_level || ""}
                                      onValueChange={(value) => handleChangeProficiency(skill.id, value)}
                                    >
                                      <SelectTrigger className="h-7 w-24 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleDeleteSkill(skill.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}

              {/* Add Skills Section (Edit Mode Only) */}
              {isSkillsEditMode && (
                <Collapsible open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skills
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="skill-type">Skill Type <span className="text-red-500">*</span></Label>
                        <Select value={newSkillType} onValueChange={setNewSkillType}>
                          <SelectTrigger id="skill-type">
                            <SelectValue placeholder="Select skill type" />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_TYPES.map((type) => (
                              <SelectItem key={type.name} value={type.name}>
                                {type.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {newSkillType && supportsProficiency(newSkillType) && (
                        <div className="space-y-2">
                          <Label htmlFor="proficiency">Proficiency Level <span className="text-red-500">*</span></Label>
                          <Select value={newProficiencyLevel} onValueChange={setNewProficiencyLevel}>
                            <SelectTrigger id="proficiency">
                              <SelectValue placeholder="Select proficiency level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="skills">Skills (comma-separated) <span className="text-red-500">*</span></Label>
                        <Input
                          id="skills"
                          placeholder="e.g., React, TypeScript, Node.js"
                          value={newSkills}
                          onChange={(e) => setNewSkills(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter multiple skills separated by commas
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={resetSkillsAddSection}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddSkills}
                          disabled={
                            !newSkills.trim() || 
                            !newSkillType || 
                            (supportsProficiency(newSkillType) && !newProficiencyLevel)
                          }
                        >
                          Add Skills
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDiscardChanges}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscardChanges}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
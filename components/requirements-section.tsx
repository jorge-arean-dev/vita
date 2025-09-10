"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SkillBadge } from "@/components/ui/skill-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Plus, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu"

interface Requirement {
  requirement: string
  type: string
  is_mandatory: boolean
  proficiency_level: "expert" | "advanced" | "beginner" | null
  weight: number
}

interface RequirementsSectionProps {
  requirements: Requirement[]
  isEditMode: boolean
  onChange: (requirements: Requirement[]) => void
}

// Requirement types mapping (simplified to 3 core types)
const REQUIREMENT_TYPES = [
  { name: "technical_skill", display_name: "Technical Skills" },
  { name: "soft_skill", display_name: "Soft Skills" },
  { name: "certification", display_name: "Certification" }
]


export default function RequirementsSection({ requirements, isEditMode, onChange }: RequirementsSectionProps) {
  const [newRequirements, setNewRequirements] = useState("")
  const [newRequirementType, setNewRequirementType] = useState("")
  const [newProficiencyLevel, setNewProficiencyLevel] = useState<string>("")
  const [newIsMandatory, setNewIsMandatory] = useState(true)
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)

  // Group requirements by type
  const groupedRequirements = REQUIREMENT_TYPES.map(type => ({
    ...type,
    requirements: requirements.filter(req => req.type === type.name)
  })).filter(group => group.requirements.length > 0)


  const handleDeleteRequirement = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index)
    onChange(newRequirements)
  }

  const handleChangeProficiency = (index: number, newProficiency: string | null) => {
    const updatedRequirements = requirements.map((req, i) => 
      i === index 
        ? { ...req, proficiency_level: newProficiency as "expert" | "advanced" | "beginner" | null }
        : req
    )
    onChange(updatedRequirements)
  }

  const handleChangeMandatory = (index: number, isMandatory: boolean) => {
    const updatedRequirements = requirements.map((req, i) => 
      i === index 
        ? { ...req, is_mandatory: isMandatory }
        : req
    )
    onChange(updatedRequirements)
  }

  const handleAddRequirements = () => {
    if (!newRequirements.trim() || !newRequirementType) return

    const requirementsList = newRequirements
      .split(',')
      .map(req => req.trim())
      .filter(req => req.length > 0)

    const newReqs: Requirement[] = requirementsList.map(req => ({
      requirement: req,
      type: newRequirementType,
      is_mandatory: newIsMandatory,
      // Soft skills and certifications always have null proficiency
      proficiency_level: (newRequirementType === "soft_skill" || newRequirementType === "certification") 
        ? null 
        : (newProficiencyLevel || "beginner") as "expert" | "advanced" | "beginner",
      weight: newProficiencyLevel === "expert" ? 1 : newProficiencyLevel === "advanced" ? 0.75 : 0.5
    }))

    onChange([...requirements, ...newReqs])
    setNewRequirements("")
    setNewRequirementType("")
    setNewProficiencyLevel("")
    setNewIsMandatory(true)
    setIsAddSectionOpen(false)
  }



  return (
    <div className="space-y-6">
      {/* Display grouped requirements */}
      {groupedRequirements.map((group) => (
        <div key={group.name} className="space-y-3">
          <Label className="text-sm font-medium">{group.display_name}</Label>
          <div className="flex flex-wrap gap-2">
            {group.requirements.map((req) => {
              const reqIndex = requirements.findIndex(r => r === req)
              return (
                <div key={reqIndex} className="relative group">
                  {isEditMode ? (
                    <div className="relative inline-flex">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="inline-block">
                            <SkillBadge
                              skill={req.requirement}
                              level={req.proficiency_level as "beginner" | "advanced" | "expert" | null}
                              type={req.type as "technical_skill" | "soft_skill" | "certification"}
                              isMandatory={req.is_mandatory}
                              isEditMode={false}  // Don't show the built-in X button
                              className="cursor-pointer pr-8"  // Add padding for external X button
                            />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="text-sm">
                        {/* Proficiency Level section - only show for applicable types */}
                        {req.type !== "soft_skill" && req.type !== "certification" && (
                          <>
                            <DropdownMenuLabel className="text-xs">Proficiency Level</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleChangeProficiency(reqIndex, "expert")}>
                              {req.proficiency_level === "expert" ? "✓ " : ""}Expert
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeProficiency(reqIndex, "advanced")}>
                              {req.proficiency_level === "advanced" ? "✓ " : ""}Advanced
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeProficiency(reqIndex, "beginner")}>
                              {req.proficiency_level === "beginner" ? "✓ " : ""}Beginner
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        
                        {/* Requirement Type section */}
                        <DropdownMenuLabel className="text-xs">Requirement Type</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleChangeMandatory(reqIndex, true)}>
                          {req.is_mandatory ? "✓ " : ""}Required
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeMandatory(reqIndex, false)}>
                          {!req.is_mandatory ? "✓ " : ""}Nice to have
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {/* External X button positioned over the badge */}
                    <button
                      onClick={() => handleDeleteRequirement(reqIndex)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[var(--skill-badge-remove-background-hover)] text-[var(--skill-badge-remove-icon)] hover:text-[var(--skill-badge-remove-icon-hover)] transition-colors z-10"
                      aria-label={`Remove ${req.requirement}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  ) : (
                    <SkillBadge
                      skill={req.requirement}
                      level={req.proficiency_level as "beginner" | "advanced" | "expert" | null}
                      type={req.type as "technical_skill" | "soft_skill" | "certification"}
                      isMandatory={req.is_mandatory}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Show message if no requirements */}
      {groupedRequirements.length === 0 && !isEditMode && (
        <div className="text-center py-8 text-muted-foreground">
          No requirements defined yet.
        </div>
      )}

      {/* Add new requirements (edit mode only) */}
      {isEditMode && (
        <Collapsible
          open={isAddSectionOpen}
          onOpenChange={setIsAddSectionOpen}
          className="w-full"
        >
          {!isAddSectionOpen && (
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Requirements
              </Button>
            </CollapsibleTrigger>
          )}
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Add New Requirements</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  {/* <Label htmlFor="new-requirements" className="text-xs text-muted-foreground">
                    Enter multiple requirements separated by commas
                  </Label> */}
                  <Input
                    id="new-requirements"
                    value={newRequirements}
                    onChange={(e) => setNewRequirements(e.target.value)}
                    placeholder="e.g. Python"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Add multiple requirements at once by separating them with commas (e.g. Python, AWS, Docker)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-type" className="text-xs text-muted-foreground">Type</Label>
                    <Select value={newRequirementType} onValueChange={setNewRequirementType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REQUIREMENT_TYPES.map((type) => (
                          <SelectItem key={type.name} value={type.name}>
                            {type.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-proficiency" className="text-xs text-muted-foreground">Proficiency Level</Label>
                    <Select 
                      value={newProficiencyLevel} 
                      onValueChange={setNewProficiencyLevel}
                      disabled={newRequirementType === "certification" || newRequirementType === "soft_skill"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expert">
                          <div className="flex flex-col">
                            <span>Expert</span>
                            <span className="text-xs text-muted-foreground">More than 5 years of experience</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="advanced">
                          <div className="flex flex-col">
                            <span>Advanced</span>
                            <span className="text-xs text-muted-foreground">More than 2 years and up to 5 years of experience</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="beginner">
                          <div className="flex flex-col">
                            <span>Beginner</span>
                            <span className="text-xs text-muted-foreground">Less than or equal to 2 years of experience</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new-mandatory"
                    checked={newIsMandatory}
                    onCheckedChange={(checked) => setNewIsMandatory(checked as boolean)}
                  />
                  <Label 
                    htmlFor="new-mandatory" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    This is a mandatory requirement
                  </Label>
                </div>

                <Button 
                  onClick={handleAddRequirements}
                  disabled={!newRequirements.trim() || !newRequirementType}
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirements
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
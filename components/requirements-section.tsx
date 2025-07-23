"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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

// Requirement types mapping
const REQUIREMENT_TYPES = [
  { name: "technical", display_name: "Technical" },
  { name: "soft_skill", display_name: "Soft skill" },
  { name: "role", display_name: "Role" },
  { name: "certification", display_name: "Certification" },
  { name: "industry", display_name: "Industry" },
  { name: "technology_domain", display_name: "Technology domain" }
]

const PROFICIENCY_LEVELS = [
  { name: "expert", display_name: "Expert" },
  { name: "advanced", display_name: "Advanced" },
  { name: "beginner", display_name: "Beginner" }
]

export default function RequirementsSection({ requirements, isEditMode, onChange }: RequirementsSectionProps) {
  const [newRequirements, setNewRequirements] = useState("")
  const [newRequirementType, setNewRequirementType] = useState("")
  const [newProficiencyLevel, setNewProficiencyLevel] = useState<string>("")
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)

  // Group requirements by type
  const groupedRequirements = REQUIREMENT_TYPES.map(type => ({
    ...type,
    requirements: requirements.filter(req => req.type === type.name)
  })).filter(group => group.requirements.length > 0)

  // Get badge color based on proficiency level
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

  const handleAddRequirements = () => {
    if (!newRequirements.trim() || !newRequirementType) return

    const requirementsList = newRequirements
      .split(',')
      .map(req => req.trim())
      .filter(req => req.length > 0)

    const newReqs: Requirement[] = requirementsList.map(req => ({
      requirement: req,
      type: newRequirementType,
      is_mandatory: true,
      proficiency_level: newProficiencyLevel === "null" ? null : newProficiencyLevel as "expert" | "advanced" | "beginner",
      weight: newProficiencyLevel === "expert" ? 1 : newProficiencyLevel === "advanced" ? 0.75 : 0.5
    }))

    onChange([...requirements, ...newReqs])
    setNewRequirements("")
    setNewRequirementType("")
    setNewProficiencyLevel("")
    setIsAddSectionOpen(false)
  }


  const getProficiencyDisplayName = (proficiency: string | null) => {
    if (!proficiency) return "No level"
    return PROFICIENCY_LEVELS.find(level => level.name === proficiency)?.display_name || proficiency
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
                    <div className="relative inline-block">
                      <Badge
                        className={cn(
                          "border cursor-pointer pr-8",
                          getBadgeClassName(req.proficiency_level)
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                        }}
                      >
                        {req.requirement}
                      </Badge>
                      <Select
                        value={req.proficiency_level || "null"}
                        onValueChange={(value) => handleChangeProficiency(reqIndex, value === "null" ? null : value)}
                      >
                        <SelectTrigger className="absolute inset-0 opacity-0 cursor-pointer">
                          <span></span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="null">No level</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRequirement(reqIndex)
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center text-xs z-10"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </div>
                  ) : (
                    <Badge
                      className={cn(
                        "border",
                        getBadgeClassName(req.proficiency_level)
                      )}
                      title={`${req.requirement} - ${getProficiencyDisplayName(req.proficiency_level)}`}
                    >
                      {req.requirement}
                    </Badge>
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
                        <SelectItem value="null">No level</SelectItem>
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
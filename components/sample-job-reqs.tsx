"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SkillBadge } from "@/components/ui/skill-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"

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


export default function RequirementsSection({ requirements, isEditMode, onChange }: RequirementsSectionProps) {
  const [newRequirements, setNewRequirements] = useState("")
  const [newRequirementType, setNewRequirementType] = useState("")
  const [newProficiencyLevel, setNewProficiencyLevel] = useState<string>("")

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
                      <SkillBadge
                        skill={req.requirement}
                        level={req.proficiency_level as "beginner" | "advanced" | "expert" | null}
                        type={req.type as "technical_skill" | "soft_skill" | "role" | "certification" | "technology_domain" | "industry"}
                        className="cursor-pointer pr-8"
                      />
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
                    <SkillBadge
                      skill={req.requirement}
                      level={req.proficiency_level as "beginner" | "advanced" | "expert" | null}
                      type={req.type as "technical_skill" | "soft_skill" | "role" | "certification" | "technology_domain" | "industry"}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Add new requirements (edit mode only) */}
      {isEditMode && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <Label className="text-sm font-medium">Add New Requirements</Label>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-requirements" className="text-xs text-muted-foreground">
                Requirements (comma-separated)
              </Label>
              <Input
                id="new-requirements"
                value={newRequirements}
                onChange={(e) => setNewRequirements(e.target.value)}
                placeholder="e.g. Python, Machine Learning, AWS"
              />
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
      )}

      {/* Show message if no requirements */}
      {groupedRequirements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No requirements defined yet.
        </div>
      )}
    </div>
  )
}
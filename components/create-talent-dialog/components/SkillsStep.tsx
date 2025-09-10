"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SkillBadge } from "@/components/ui/skill-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import { Info } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { ParsedSkill } from "../types"
import { SKILL_TYPES } from "../types"

type SkillType = "technical_skill" | "soft_skill" | "certification"
type ProficiencyLevel = "beginner" | "advanced" | "expert"

// Helper function to validate proficiency level
const isProficiencyLevel = (level: string | null | undefined): level is ProficiencyLevel | null => {
  return level === null || level === undefined || ["beginner", "advanced", "expert"].includes(level)
}

interface SkillsStepProps {
  skills: ParsedSkill[]
  onChange: (skills: ParsedSkill[]) => void
  showReviewBanner?: boolean
}

export function SkillsStep({ skills, onChange, showReviewBanner }: SkillsStepProps) {
  const [newSkills, setNewSkills] = useState("")
  const [newSkillType, setNewSkillType] = useState("")
  const [newProficiencyLevel, setNewProficiencyLevel] = useState<string>("")
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)

  // Group skills by type
  const groupedSkills = SKILL_TYPES.map(type => ({
    ...type,
    skills: skills.filter(skill => skill.type === type.name)
  })).filter(group => group.skills.length > 0)

  const handleDeleteSkill = (index: number) => {
    const newSkillsList = skills.filter((_, i) => i !== index)
    onChange(newSkillsList)
  }

  const handleChangeProficiency = (index: number, newProficiency: string) => {
    const updatedSkills = skills.map((skill, i) => 
      i === index 
        ? { ...skill, proficiency_level: newProficiency }
        : skill
    )
    onChange(updatedSkills)
  }

  const handleAddSkills = () => {
    if (!newSkills.trim() || !newSkillType) return

    const skillsList = newSkills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)

    const newSkillsArray: ParsedSkill[] = skillsList.map(skill => ({
      name: skill,
      type: newSkillType,
      // Soft skills and certifications always have null proficiency
      proficiency_level: (newSkillType === "soft_skill" || newSkillType === "certification") 
        ? null 
        : (newProficiencyLevel || "beginner"),
      source: 'user_input'
    }))

    onChange([...skills, ...newSkillsArray])
    setNewSkills("")
    setNewSkillType("")
    setNewProficiencyLevel("")
    setIsAddSectionOpen(false)
  }

  // Check if type supports proficiency levels
  const supportsProficiency = (type: string) => {
    return type !== "soft_skill" && type !== "certification"
  }

  return (
    <div className="space-y-6">
      {/* Review banner for automatic upload */}
      {showReviewBanner && (
        <div className="info-indicator">
          <Info className="h-4 w-4" />
          <span>Please review the extracted information below and make any necessary adjustments.</span>
        </div>
      )}
      
      {/* General info banner */}
      <div className="info-indicator">
        <Info className="h-4 w-4" />
        <span>This information can be updated after creation from the candidate profile.</span>
      </div>

      {/* Existing Skills */}
      {groupedSkills.length > 0 && (
        <div className="space-y-4">
          <Label>Current Skills</Label>
          {groupedSkills.map((group) => (
            <div key={group.name} className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {group.display_name}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => {
                  const globalIndex = skills.findIndex(s => s === skill)
                  return (
                    <div key={globalIndex} className="flex items-center gap-1">
                      <SkillBadge
                        skill={skill.name}
                        level={isProficiencyLevel(skill.proficiency_level) ? (skill.proficiency_level || null) : null}
                        type={skill.type as SkillType}
                      />
                      {supportsProficiency(skill.type) && (
                        <Select
                          value={skill.proficiency_level || ""}
                          onValueChange={(value) => handleChangeProficiency(globalIndex, value)}
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
                        onClick={() => handleDeleteSkill(globalIndex)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Skills Section */}
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
                onClick={() => {
                  setNewSkills("")
                  setNewSkillType("")
                  setNewProficiencyLevel("")
                  setIsAddSectionOpen(false)
                }}
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

      {skills.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No skills added yet. Click &quot;Add Skills&quot; to get started.</p>
        </div>
      )}
    </div>
  )
}
"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Star, X } from "lucide-react"

type ProficiencyLevel = "beginner" | "advanced" | "expert"

interface StarBadgeProps {
  skill: string
  level: ProficiencyLevel
  isMandatory: boolean
  className?: string
  showPercentage?: boolean
  isEditMode?: boolean
  onRemove?: () => void
}

export function StarBadge({
  skill,
  level,
  isMandatory,
  className,
  showPercentage = false,
  isEditMode = false,
  onRemove,
}: StarBadgeProps) {
  const getFillPercentage = () => {
    switch (level) {
      case "beginner":
        return 33
      case "advanced":
        return 66
      case "expert":
        return 100
      default:
        return 0
    }
  }

  const getTextColor = () => {
    switch (level) {
      case "beginner":
        return "text-primary"
      case "advanced":
        return "text-primary"
      case "expert":
        return "text-primary-foreground"
      default:
        return "text-primary"
    }
  }

  const getBorderColor = () => {
    switch (level) {
      case "beginner":
        return "border-primary/30"
      case "advanced":
        return "border-primary/50"
      case "expert":
        return "border-primary"
      default:
        return "border-primary/30"
    }
  }

  const fillPercentage = getFillPercentage()

  return (
    <Badge
      className={cn(
        "relative overflow-hidden bg-transparent border transition-all duration-300 hover:scale-105",
        getTextColor(),
        getBorderColor(),
        className,
      )}
    >
      {/* Progress Fill Background */}
      <div
        className="absolute inset-0 bg-primary/40 transition-all duration-500 ease-out"
        style={{ width: `${fillPercentage}%` }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center">
        {/* Star icon positioned to the left (only for mandatory skills) */}
        {isMandatory && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-2" />}

        {/* Skill name */}
        {skill}

        {/* Optional percentage display */}
        {showPercentage && <span className="text-xs opacity-75 ml-1">({fillPercentage}%)</span>}

        {/* Remove button (only in edit mode) */}
        {isEditMode && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-2 p-0.5 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
            aria-label={`Remove ${skill}`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    </Badge>
  )
}

// Demo component to showcase the StarBadge
export function StarBadgeDemo() {
  const sampleSkills = [
    { skill: "JavaScript", level: "expert" as const, isMandatory: true },
    { skill: "React", level: "advanced" as const, isMandatory: true },
    { skill: "TypeScript", level: "advanced" as const, isMandatory: false },
    { skill: "Node.js", level: "beginner" as const, isMandatory: true },
    { skill: "Python", level: "expert" as const, isMandatory: false },
    { skill: "AWS", level: "beginner" as const, isMandatory: true },
    { skill: "Docker", level: "advanced" as const, isMandatory: false },
    { skill: "GraphQL", level: "beginner" as const, isMandatory: false },
  ]

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Star Badge Component</h1>
        <p className="text-muted-foreground mb-6">
          Skill badges with left-positioned star icons for mandatory skills and edit mode functionality
        </p>
      </div>

      {/* View Mode */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">View Mode</h2>
        <p className="text-sm text-muted-foreground">Standard display with star icons for mandatory skills</p>
        <div className="flex flex-wrap gap-2">
          {sampleSkills.map((item, index) => (
            <StarBadge
              key={index}
              skill={item.skill}
              level={item.level}
              isMandatory={item.isMandatory}
              isEditMode={false}
            />
          ))}
        </div>
      </div>

      {/* Edit Mode */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Edit Mode</h2>
        <p className="text-sm text-muted-foreground">Includes remove functionality with X icons (click to test)</p>
        <div className="flex flex-wrap gap-2">
          {sampleSkills.map((item, index) => (
            <StarBadge
              key={index}
              skill={item.skill}
              level={item.level}
              isMandatory={item.isMandatory}
              isEditMode={true}
              onRemove={() => alert(`Remove ${item.skill}?`)}
            />
          ))}
        </div>
      </div>

      {/* With Percentage */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">With Percentage Display</h2>
        <p className="text-sm text-muted-foreground">Shows proficiency percentages alongside skill names</p>
        <div className="flex flex-wrap gap-2">
          {sampleSkills.map((item, index) => (
            <StarBadge
              key={index}
              skill={item.skill}
              level={item.level}
              isMandatory={item.isMandatory}
              showPercentage={true}
            />
          ))}
        </div>
      </div>

      {/* Grouped by Mandatory Status */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Grouped by Mandatory Status</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-green-600">Mandatory Skills (with stars)</h3>
          <div className="flex flex-wrap gap-2">
            {sampleSkills
              .filter((item) => item.isMandatory)
              .map((item, index) => (
                <StarBadge key={index} skill={item.skill} level={item.level} isMandatory={item.isMandatory} />
              ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-blue-600">Optional Skills (no stars)</h3>
          <div className="flex flex-wrap gap-2">
            {sampleSkills
              .filter((item) => !item.isMandatory)
              .map((item, index) => (
                <StarBadge key={index} skill={item.skill} level={item.level} isMandatory={item.isMandatory} />
              ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-3">StarBadge Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">Progress Fill Levels:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 border border-primary/30 relative overflow-hidden rounded-sm">
                  <div className="absolute inset-0 bg-primary/40" style={{ width: "33%" }} />
                </div>
                <span>Beginner (33%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 border border-primary/50 relative overflow-hidden rounded-sm">
                  <div className="absolute inset-0 bg-primary/40" style={{ width: "66%" }} />
                </div>
                <span>Advanced (66%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 border border-primary relative overflow-hidden rounded-sm">
                  <div className="absolute inset-0 bg-primary/40" style={{ width: "100%" }} />
                </div>
                <span>Expert (100%)</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Features:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>Left-positioned star for mandatory skills</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span>Remove button in edit mode</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-muted px-1 rounded">(66%)</span>
                <span>Optional percentage display</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-primary/40 rounded-sm"></div>
                <span>Progress fill based on proficiency</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

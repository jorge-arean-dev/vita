"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ProficiencyLevel = "beginner" | "advanced" | "expert"

interface ProgressSkillBadgeProps {
  skill: string
  level: ProficiencyLevel
  className?: string
  showPercentage?: boolean
}

export function ProgressSkillBadge({ skill, level, className, showPercentage = false }: ProgressSkillBadgeProps) {
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
    // Use darker text for better contrast when badge is more filled
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
      <span className="relative z-10 flex items-center gap-1">
        {skill}
        {showPercentage && <span className="text-xs opacity-75">({fillPercentage}%)</span>}
      </span>
    </Badge>
  )
}

// Demo component to showcase the progress skill badges
export function ProgressSkillBadgeDemo() {
  const sampleSkills = [
    { skill: "JavaScript", level: "expert" as const },
    { skill: "React", level: "advanced" as const },
    { skill: "TypeScript", level: "advanced" as const },
    { skill: "Node.js", level: "beginner" as const },
    { skill: "Python", level: "expert" as const },
    { skill: "AWS", level: "beginner" as const },
    { skill: "Docker", level: "advanced" as const },
    { skill: "GraphQL", level: "beginner" as const },
    { skill: "MongoDB", level: "advanced" as const },
    { skill: "Vue.js", level: "beginner" as const },
  ]

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Progress Skill Badges</h1>
        <p className="text-muted-foreground mb-6">Skill badges with progress fill indicating proficiency levels</p>
      </div>

      {/* Standard Progress Badges */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Standard Progress Badges</h2>
        <p className="text-sm text-muted-foreground">
          Beginner: 33% filled • Advanced: 66% filled • Expert: 100% filled
        </p>
        <div className="flex flex-wrap gap-2">
          {sampleSkills.map((item, index) => (
            <ProgressSkillBadge key={index} skill={item.skill} level={item.level} />
          ))}
        </div>
      </div>

      {/* Progress Badges with Percentage */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">With Percentage Display</h2>
        <p className="text-sm text-muted-foreground">Same as above but with percentage indicators</p>
        <div className="flex flex-wrap gap-2">
          {sampleSkills.map((item, index) => (
            <ProgressSkillBadge key={index} skill={item.skill} level={item.level} showPercentage />
          ))}
        </div>
      </div>

      {/* Grouped by Proficiency Level */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Grouped by Proficiency Level</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-primary/70">Expert Level (100%)</h3>
          <div className="flex flex-wrap gap-2">
            {sampleSkills
              .filter((item) => item.level === "expert")
              .map((item, index) => (
                <ProgressSkillBadge key={index} skill={item.skill} level={item.level} />
              ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-primary/70">Advanced Level (66%)</h3>
          <div className="flex flex-wrap gap-2">
            {sampleSkills
              .filter((item) => item.level === "advanced")
              .map((item, index) => (
                <ProgressSkillBadge key={index} skill={item.skill} level={item.level} />
              ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-primary/70">Beginner Level (33%)</h3>
          <div className="flex flex-wrap gap-2">
            {sampleSkills
              .filter((item) => item.level === "beginner")
              .map((item, index) => (
                <ProgressSkillBadge key={index} skill={item.skill} level={item.level} />
              ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-3">Progress Fill Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 border border-primary/30 relative overflow-hidden rounded-sm">
              <div className="absolute inset-0 bg-primary/40" style={{ width: "33%" }} />
            </div>
            <span>
              <strong>Beginner:</strong> 33% filled
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 border border-primary/50 relative overflow-hidden rounded-sm">
              <div className="absolute inset-0 bg-primary/40" style={{ width: "66%" }} />
            </div>
            <span>
              <strong>Advanced:</strong> 66% filled
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 border border-primary relative overflow-hidden rounded-sm">
              <div className="absolute inset-0 bg-primary/40" style={{ width: "100%" }} />
            </div>
            <span>
              <strong>Expert:</strong> 100% filled
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

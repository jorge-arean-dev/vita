"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Star, X } from "lucide-react"

type ProficiencyLevel = "beginner" | "advanced" | "expert"
type SkillType = "technical_skill" | "soft_skill" | "role" | "certification" | "technology_domain" | "industry"

interface SkillBadgeProps {
  skill: string
  level?: ProficiencyLevel | null
  type?: SkillType | null
  className?: string
  showPercentage?: boolean
  isMandatory?: boolean
  isEditMode?: boolean
  onRemove?: () => void
}

export function SkillBadge({ 
  skill, 
  level, 
  type, 
  className, 
  showPercentage = false,
  isMandatory = false,
  isEditMode = false,
  onRemove
}: SkillBadgeProps) {
  // Determine if this skill type should show progress fill
  const showProgressFill = type && ["technical_skill", "role", "technology_domain", "industry"].includes(type)
  
  // If no progress fill needed, return a simple badge
  if (!showProgressFill || !level) {
    return (
      <Badge
        className={cn(
          "transition-all duration-300 relative",
          getBadgeClassName(level),
          className
        )}
      >
        <span className="flex items-center">
          {/* Star icon for mandatory requirements */}
          {isMandatory && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-2" />}
          
          {/* Skill name */}
          {skill}
          
          {/* Optional percentage display */}
          {showPercentage && <span className="text-xs opacity-75 ml-1">(N/A)</span>}
          
          {/* Remove button (only in edit mode) */}
          {isEditMode && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="ml-2 p-0.5 rounded-full hover:bg-[var(--skill-badge-remove-background-hover)] text-[var(--skill-badge-remove-icon)] hover:text-[var(--skill-badge-remove-icon-hover)] transition-colors"
              aria-label={`Remove ${skill}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      </Badge>
    )
  }

  // Progress fill logic
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
      case "expert":
        return "[color:var(--skill-badge-text-filled)]"
      default:
        return "[color:var(--skill-badge-text)]"
    }
  }

  const getBorderStyles = () => {
    switch (level) {
      case "beginner":
        return "border-[color:var(--skill-badge-border)] hover:border-[color:var(--skill-badge-border-hover)]"
      case "advanced":
        return "border-[color:var(--skill-badge-border-hover)] hover:border-[color:var(--skill-badge-border-hover)]"
      case "expert":
        return "border-primary hover:border-primary"
      default:
        return "border-[color:var(--skill-badge-border)]"
    }
  }

  const fillPercentage = getFillPercentage()

  return (
    <Badge
      className={cn(
        "relative overflow-hidden bg-[var(--skill-badge-background)] border transition-all duration-300 hover:scale-105",
        getTextColor(),
        getBorderStyles(),
        className,
      )}
    >
      {/* Progress Fill Background */}
      <div
        className="absolute inset-0 bg-[var(--skill-badge-fill)] transition-all duration-500 ease-out"
        style={{ width: `${fillPercentage}%` }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center">
        {/* Star icon for mandatory requirements */}
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
            className="ml-2 p-0.5 rounded-full hover:bg-[var(--skill-badge-remove-background-hover)] text-[var(--skill-badge-remove-icon)] hover:text-[var(--skill-badge-remove-icon-hover)] transition-colors"
            aria-label={`Remove ${skill}`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    </Badge>
  )
}

// Fallback function for badges without progress fill
function getBadgeClassName(level?: ProficiencyLevel | null) {
  switch (level) {
    case "expert":
      return "bg-black text-white border-black hover:bg-gray-800 dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200"
    case "advanced":
      return "bg-gray-500 text-white border-gray-500 hover:bg-gray-600 dark:bg-gray-400 dark:text-black dark:border-gray-400 dark:hover:bg-gray-300"
    case "beginner":
      return "bg-gray-300 text-gray-700 border-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-500"
    default:
      return "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
  }
}
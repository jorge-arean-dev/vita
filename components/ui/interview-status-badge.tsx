"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, FileText, Play, Search, Circle } from "lucide-react"

interface InterviewStatusBadgeProps {
  status: "analyzing" | "completed" | "created" | "in_progress" | "ready_for_analysis"
  className?: string
  showIcon?: boolean
  isStatic?: boolean
}

interface StatusConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  className: string
  iconClassName: string
  ariaLabel: string
  hasFlashingDot?: boolean
  hasRecordingIcon?: boolean
}

export function InterviewStatusBadge({ status, className, showIcon = true, isStatic = false }: InterviewStatusBadgeProps) {
  const getStatusConfig = (): StatusConfig => {
    switch (status) {
      case "analyzing":
        return {
          label: "Analyzing",
          icon: Search,
          className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
          iconClassName: "text-blue-600",
          ariaLabel: "Interview status: Currently analyzing interview data",
        }
      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle2,
          className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
          iconClassName: "text-green-600",
          ariaLabel: "Interview status: Interview completed successfully",
        }
      case "created":
        return {
          label: "Created",
          icon: FileText,
          className: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
          iconClassName: "text-gray-600",
          ariaLabel: "Interview status: Interview has been created and scheduled",
        }
      case "in_progress":
        return {
          label: "In Progress",
          icon: Play,
          className: isStatic
            ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
            : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 animate-pulse",
          iconClassName: "text-orange-600",
          ariaLabel: "Interview status: Interview currently in progress",
          hasFlashingDot: !isStatic,
          hasRecordingIcon: true,
        }
      case "ready_for_analysis":
        return {
          label: "Ready to Analyze",
          icon: Clock,
          className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
          iconClassName: "text-purple-600",
          ariaLabel: "Interview status: Ready for analysis",
        }
      default:
        return {
          label: "Unknown",
          icon: FileText,
          className: "bg-gray-50 text-gray-700 border-gray-200",
          iconClassName: "text-gray-600",
          ariaLabel: "Interview status: Unknown status",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border transition-colors duration-200",
        config.className,
        className,
      )}
      aria-label={config.ariaLabel}
      role="status"
    >
      <span className="relative flex items-center gap-2">
        {config.hasRecordingIcon && (
          <Circle className="h-2 w-2 fill-red-500 text-red-500 recording-blink" aria-hidden="true" />
        )}
        {showIcon && (
          <span className="relative">
            <Icon className={cn("h-4 w-4", config.iconClassName)} aria-hidden="true" />
            {config.hasFlashingDot && (
              <span
                className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full animate-ping"
                aria-hidden="true"
              />
            )}
          </span>
        )}
        <span>{config.label}</span>
      </span>
    </Badge>
  )
}
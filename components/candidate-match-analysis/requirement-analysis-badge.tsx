import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Custom circular progress component based on the working CircularProgress but without text
function BadgeCircularProgress({ value, size = 18, strokeWidth = 2, status }: {
  value: number
  size?: number
  strokeWidth?: number
  status: "strong" | "adequate" | "weak" | "missing"
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (status: string) => {
    if (status === "strong") return "stroke-[hsl(var(--match-strong))]"
    if (status === "adequate") return "stroke-[hsl(var(--match-adequate))]"
    if (status === "weak") return "stroke-[hsl(var(--match-weak))]"
    if (status === "missing") return "stroke-[hsl(var(--match-missing))]"
    return "stroke-gray-500"
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getColor(status)}`}
        />
      </svg>
    </div>
  )
}

interface RequirementAnalysisBadgeProps {
  name: string
  score: number
  status: "strong" | "adequate" | "weak" | "missing"
  onClick: () => void
}

export function RequirementAnalysisBadge({ name, score, status, onClick }: RequirementAnalysisBadgeProps) {
  const getBadgeColorClass = (status: string) => {
    if (status === "strong") return "bg-[hsl(var(--match-strong-bg))] text-[hsl(var(--match-strong-text))] border-[hsl(var(--match-strong-border))]"
    if (status === "adequate") return "bg-[hsl(var(--match-adequate-bg))] text-[hsl(var(--match-adequate-text))] border-[hsl(var(--match-adequate-border))]"
    if (status === "weak") return "bg-[hsl(var(--match-weak-bg))] text-[hsl(var(--match-weak-text))] border-[hsl(var(--match-weak-border))]"
    if (status === "missing") return "bg-[hsl(var(--match-missing-bg))] text-[hsl(var(--match-missing-text))] border-[hsl(var(--match-missing-border))]"
    return "bg-gray-50 text-gray-800 border-gray-200"
  }

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:opacity-90",
        getBadgeColorClass(status),
      )}
      onClick={onClick}
    >
      <span>{name}</span>
      <BadgeCircularProgress 
        value={score} 
        status={status}
        size={18} 
        strokeWidth={2}
      />
    </Badge>
  )
}
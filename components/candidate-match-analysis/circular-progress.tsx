import { CircularProgressProps } from "./types"

export function CircularProgress({ value, size = 120, strokeWidth = 8, className = "", status }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (status: string) => {
    if (status === "fit") return "stroke-[hsl(var(--match-fit))]"
    if (status === "strong") return "stroke-[hsl(var(--match-strong))]" // Legacy support
    if (status === "developing") return "stroke-[hsl(var(--match-developing))]"
    if (status === "adequate") return "stroke-[hsl(var(--match-adequate))]" // Legacy support
    if (status === "weak") return "stroke-[hsl(var(--match-weak))]"
    if (status === "missing") return "stroke-[hsl(var(--match-missing))]"
    return "stroke-gray-500"
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{value}%</span>
      </div>
    </div>
  )
}
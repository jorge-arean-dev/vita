"use client"

import { Info, CheckCircle2, TrendingUp, AlertTriangle, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ScoreSystemGuideDialogProps {
  children: React.ReactNode
}

interface ScoreTier {
  id: string
  label: string
  range: string
  description: string
  detailedDescription: string
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  bgColorClass: string
  borderColorClass: string
}

// Reorder to show natural progression: Missing → Weak → Developing → Fit
const scoreTiers: ScoreTier[] = [
  {
    id: "missing",
    label: "Missing",
    range: "0-29%", 
    description: "Critical missing",
    detailedDescription: "No clear evidence of this skill found. This represents a critical gap that would require extensive training or may indicate the role is not a good fit.",
    icon: XCircle,
    colorClass: "text-[hsl(var(--match-missing))]",
    bgColorClass: "bg-[hsl(var(--match-missing))]/10",
    borderColorClass: "border-[hsl(var(--match-missing))]/20"
  },
  {
    id: "weak",
    label: "Weak",
    range: "30-59%",
    description: "Significant gaps",
    detailedDescription: "Limited proficiency detected. Substantial skill development and training investment would be required to meet role requirements.",
    icon: AlertTriangle,
    colorClass: "text-[hsl(var(--match-weak))]",
    bgColorClass: "bg-[hsl(var(--match-weak))]/10",
    borderColorClass: "border-[hsl(var(--match-weak))]/20" 
  },
  {
    id: "developing",
    label: "Developing", 
    range: "60-79%",
    description: "Needs development",
    detailedDescription: "Candidate has the skill but is below the required level. With proper training and mentoring, they could grow into the role.",
    icon: TrendingUp,
    colorClass: "text-[hsl(var(--match-developing))]",
    bgColorClass: "bg-[hsl(var(--match-developing))]/10", 
    borderColorClass: "border-[hsl(var(--match-developing))]/20"
  },
  {
    id: "fit",
    label: "Fit",
    range: "80-100%",
    description: "Ready for role",
    detailedDescription: "Candidate meets or exceeds the required proficiency level. They demonstrate the necessary expertise and are interview-ready for this position.",
    icon: CheckCircle2,
    colorClass: "text-[hsl(var(--match-fit))]",
    bgColorClass: "bg-[hsl(var(--match-fit))]/10",
    borderColorClass: "border-[hsl(var(--match-fit))]/20"
  }
]

export function ScoreSystemGuideDialog({ children }: ScoreSystemGuideDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="max-h-[90vh] overflow-y-auto w-auto"
        style={{ 
          maxWidth: '90vw'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Info className="w-5 h-5 text-blue-600" />
            Match Score Guide
          </DialogTitle>
          <DialogDescription className="text-base">
            Understanding the scoring system for overall match and individual requirement analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Score Categories */}
          <div>
            <h3 className="font-semibold text-xl text-center mb-8">Score Categories</h3>
          </div>

          {/* Detailed Tier Explanations */}
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {scoreTiers.map((tier) => {
              const Icon = tier.icon
              return (
                <div
                  key={tier.id}
                  className={`${tier.bgColorClass} ${tier.borderColorClass} border rounded-lg p-4 
                             transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}
                >
                  <div className="flex flex-col space-y-3">
                    {/* Container 1: Row with Icon + Title + Score Range grouped on left */}
                    <div className="flex items-center gap-2">
                      <div className={`${tier.colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className={`font-semibold ${tier.colorClass}`}>
                        {tier.label}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {tier.range}
                      </Badge>
                    </div>
                    
                    {/* Container 2: Row with Subtitle */}
                    <div>
                      <p className="text-sm text-gray-700 font-medium">
                        {tier.description}
                      </p>
                    </div>
                    
                    {/* Container 3: Row with Detailed Text */}
                    <div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {tier.detailedDescription}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Key Insights */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Key Insights</h3>
            <div className="space-y-3 text-base text-gray-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Only <strong>Fit</strong> scores (80%+) count as meeting mandatory requirements</span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Optional requirements can only <strong>boost</strong> scores - they never penalize candidates</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
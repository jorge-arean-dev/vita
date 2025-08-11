"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepProgressProps {
  currentStep: 1 | 2
  steps: Array<{
    number: number
    title: string
  }>
}

export function StepProgress({ currentStep, steps }: StepProgressProps) {
  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step.number < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.number === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.number < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                step.number
              )}
            </div>
            <span className={cn(
              "text-xs mt-1",
              step.number <= currentStep
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            )}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-16 h-[2px] mx-2 mb-5 transition-colors",
                step.number < currentStep
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
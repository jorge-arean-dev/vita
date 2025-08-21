"use client"

import { Badge } from "@/components/ui/badge"
import { Sparkles, FileText, Database, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AnalysisStrategyBadgeProps {
  strategy?: string
  reason?: string
  rawDataSources?: {
    hasLinkedIn: boolean
    hasResume: boolean
  }
}

export function AnalysisStrategyBadge({ strategy, reason, rawDataSources }: AnalysisStrategyBadgeProps) {
  if (!strategy) return null

  const getBadgeConfig = (strategy: string) => {
    switch (strategy) {
      case 'enhanced-linkedin':
        return {
          icon: <Sparkles className="h-3 w-3" />,
          label: 'Enhanced LinkedIn',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }
      case 'enhanced-pdf':
        return {
          icon: <FileText className="h-3 w-3" />,
          label: 'Enhanced PDF',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }
      case 'deprecated-fallback':
        return {
          icon: <Database className="h-3 w-3" />,
          label: 'Structured Data',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        }
      default:
        return {
          icon: <Info className="h-3 w-3" />,
          label: 'Analysis',
          variant: 'outline' as const,
          className: ''
        }
    }
  }

  const config = getBadgeConfig(strategy)

  const tooltipContent = (
    <div className="space-y-2 max-w-sm">
      <div className="font-medium">Analysis Method</div>
      <div className="text-sm">{reason}</div>
      {rawDataSources && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          <div>Data Sources Available:</div>
          <div>• LinkedIn: {rawDataSources.hasLinkedIn ? '✓' : '✗'}</div>
          <div>• Resume: {rawDataSources.hasResume ? '✓' : '✗'}</div>
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
            {config.icon}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
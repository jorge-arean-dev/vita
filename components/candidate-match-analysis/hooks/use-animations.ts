import { useState } from "react"

export function useAnimations() {
  const [visibleSections, setVisibleSections] = useState<{ [key: string]: string[] }>({})

  // Trigger animations for analysis results
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const triggerAnimationsForAnalysis = (analysisId: string, _requirementCount: number) => {
    // Reset animation states for this analysis
    setVisibleSections(prev => ({ ...prev, [analysisId]: [] }))

    // Sequential section reveal
    const timeline = [
      { section: "combined-card", delay: 0 },
      { section: "summary", delay: 800 },
      { section: "requirements-header", delay: 1600 },
      { section: "recommendations", delay: 2400 },
    ]

    timeline.forEach(({ section, delay }) => {
      setTimeout(() => {
        setVisibleSections((prev) => ({
          ...prev,
          [analysisId]: [...(prev[analysisId] || []), section]
        }))
      }, delay)
    })

    // Show all requirement cards immediately when requirements section appears
    // Note: Currently not animating individual requirement cards
  }

  // Clean up animation states for a specific analysis
  const cleanupAnimationState = (analysisId: string) => {
    setVisibleSections(prev => {
      const newState = { ...prev }
      delete newState[analysisId]
      return newState
    })
  }

  return {
    visibleSections,
    setVisibleSections,
    triggerAnimationsForAnalysis,
    cleanupAnimationState
  }
}
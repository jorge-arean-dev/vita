"use client"

import { useState } from "react"

interface ToggleSliderProps {
  option1: string
  option2: string
  icon1?: React.ReactNode
  icon2?: React.ReactNode
  defaultOption?: 1 | 2
  onChange?: (option: 1 | 2) => void
  className?: string
}

export default function ToggleSlider({
  option1,
  option2,
  icon1,
  icon2,
  defaultOption = 1,
  onChange,
  className = "",
}: ToggleSliderProps) {
  const [activeOption, setActiveOption] = useState<1 | 2>(defaultOption)

  const handleToggle = (option: 1 | 2) => {
    setActiveOption(option)
    onChange?.(option)
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="relative bg-muted rounded-full p-1 flex">
        {/* Sliding background indicator */}
        <div
          className="absolute top-1 bottom-1 bg-background rounded-full shadow-sm transition-transform duration-200 ease-out"
          style={{ 
            width: "calc(50% - 4px)",
            transform: activeOption === 1 ? 'translateX(0)' : 'translateX(calc(100% + 4px))'
          }}
        />

        {/* Option 1 */}
        <button
          onClick={() => handleToggle(1)}
          className={`relative z-10 flex-1 h-9 px-6 text-sm font-medium rounded-full transition-colors duration-200 flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeOption === 1 ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={activeOption === 1}
        >
          {icon1 && <span className="w-4 h-4">{icon1}</span>}
          <span>{option1}</span>
        </button>

        {/* Option 2 */}
        <button
          onClick={() => handleToggle(2)}
          className={`relative z-10 flex-1 h-9 px-6 text-sm font-medium rounded-full transition-colors duration-200 flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeOption === 2 ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={activeOption === 2}
        >
          {icon2 && <span className="w-4 h-4">{icon2}</span>}
          <span>{option2}</span>
        </button>
      </div>
    </div>
  )
}
"use client"

import { createContext, useContext, useState, useEffect } from "react"

interface FontOptions {
  name: string
  cssClass: string
  description: string
}

export const titleFontOptions: FontOptions[] = [
  { name: "Inter", cssClass: "font-inter", description: "Modern sans-serif" },
  { name: "Poppins", cssClass: "font-poppins", description: "Rounded & friendly" },
  { name: "Playfair Display", cssClass: "font-playfair", description: "Elegant serif" },
  { name: "Montserrat", cssClass: "font-montserrat", description: "Geometric sans" },
  { name: "Lora", cssClass: "font-lora", description: "Contemporary serif" },
  { name: "Roboto", cssClass: "font-roboto", description: "Clean & readable" },
  { name: "Source Sans 3", cssClass: "font-source-sans", description: "Professional" },
  { name: "Oswald", cssClass: "font-oswald", description: "Bold condensed" },
  { name: "Raleway", cssClass: "font-raleway", description: "Elegant thin" },
  { name: "DM Sans", cssClass: "font-dm-sans", description: "Modern geometric" },
  { name: "Work Sans", cssClass: "font-work-sans", description: "Early grotesque" },
  { name: "Space Grotesk", cssClass: "font-space-grotesk", description: "Modern grotesk" },
  { name: "Manrope", cssClass: "font-manrope", description: "Open & friendly" },
  { name: "Lexend", cssClass: "font-lexend", description: "Reading proficiency" },
  { name: "Plus Jakarta Sans", cssClass: "font-plus-jakarta", description: "Versatile sans" },
  { name: "IBM Plex Sans", cssClass: "font-ibm-plex", description: "Corporate modern" },
  { name: "Outfit", cssClass: "font-outfit", description: "Variable sans" },
  { name: "Archivo", cssClass: "font-archivo", description: "Grotesque family" },
  { name: "Public Sans", cssClass: "font-public-sans", description: "Neutral sans" },
  { name: "Crimson Text", cssClass: "font-crimson-text", description: "Old-style serif" }
]

export const textFontOptions: FontOptions[] = [
  { name: "Inter", cssClass: "font-inter", description: "Modern sans-serif" },
  { name: "Open Sans", cssClass: "font-open-sans", description: "Friendly & readable" },
  { name: "Lato", cssClass: "font-lato", description: "Humanist sans" },
  { name: "Source Sans 3", cssClass: "font-source-sans", description: "Professional" },
  { name: "Nunito", cssClass: "font-nunito", description: "Rounded sans" },
  { name: "Merriweather", cssClass: "font-merriweather", description: "Readable serif" },
  { name: "PT Sans", cssClass: "font-pt-sans", description: "Versatile sans" },
  { name: "Roboto", cssClass: "font-roboto", description: "Clean & readable" },
  { name: "Poppins", cssClass: "font-poppins", description: "Rounded & friendly" },
  { name: "Montserrat", cssClass: "font-montserrat", description: "Geometric sans" },
  { name: "DM Sans", cssClass: "font-dm-sans", description: "Modern geometric" },
  { name: "Work Sans", cssClass: "font-work-sans", description: "Early grotesque" },
  { name: "Manrope", cssClass: "font-manrope", description: "Open & friendly" },
  { name: "Lexend", cssClass: "font-lexend", description: "Reading proficiency" },
  { name: "Plus Jakarta Sans", cssClass: "font-plus-jakarta", description: "Versatile sans" },
  { name: "IBM Plex Sans", cssClass: "font-ibm-plex", description: "Corporate modern" },
  { name: "Public Sans", cssClass: "font-public-sans", description: "Neutral sans" },
  { name: "Source Serif 4", cssClass: "font-source-serif", description: "Modern serif" },
  { name: "Crimson Text", cssClass: "font-crimson-text", description: "Old-style serif" },
  { name: "PT Serif", cssClass: "font-pt-serif", description: "Traditional serif" },
  { name: "Libre Baskerville", cssClass: "font-libre-baskerville", description: "Web serif" },
  { name: "Bitter", cssClass: "font-bitter", description: "Contemporary slab" },
  { name: "Spectral", cssClass: "font-spectral", description: "Screen-optimized serif" }
]

interface TypographyContextType {
  titleFont: FontOptions
  textFont: FontOptions
  appliedTitleFont: FontOptions
  appliedTextFont: FontOptions
  setTitleFont: (font: FontOptions) => void
  setTextFont: (font: FontOptions) => void
  applyFonts: () => void
  resetFonts: () => void
}

const TypographyContext = createContext<TypographyContextType | undefined>(undefined)

export function TypographyProvider({ children }: { children: React.ReactNode }) {
  const [titleFont, setTitleFont] = useState(titleFontOptions[0])
  const [textFont, setTextFont] = useState(textFontOptions[0])
  const [appliedTitleFont, setAppliedTitleFont] = useState(titleFontOptions[0])
  const [appliedTextFont, setAppliedTextFont] = useState(textFontOptions[0])

  // Apply font changes to CSS variables only when fonts are applied
  useEffect(() => {
    const root = document.documentElement
    
    // Map CSS classes to actual font families
    const getFontFamily = (cssClass: string) => {
      switch (cssClass) {
        case "font-inter": return "Inter, system-ui, sans-serif"
        case "font-poppins": return "Poppins, system-ui, sans-serif"
        case "font-playfair": return "'Playfair Display', serif"
        case "font-montserrat": return "Montserrat, system-ui, sans-serif"
        case "font-lora": return "Lora, serif"
        case "font-roboto": return "Roboto, system-ui, sans-serif"
        case "font-source-sans": return "'Source Sans 3', system-ui, sans-serif"
        case "font-open-sans": return "'Open Sans', system-ui, sans-serif"
        case "font-lato": return "Lato, system-ui, sans-serif"
        case "font-nunito": return "Nunito, system-ui, sans-serif"
        case "font-merriweather": return "Merriweather, serif"
        case "font-pt-sans": return "'PT Sans', system-ui, sans-serif"
        case "font-oswald": return "Oswald, system-ui, sans-serif"
        case "font-raleway": return "Raleway, system-ui, sans-serif"
        case "font-dm-sans": return "'DM Sans', system-ui, sans-serif"
        case "font-work-sans": return "'Work Sans', system-ui, sans-serif"
        case "font-space-grotesk": return "'Space Grotesk', system-ui, sans-serif"
        case "font-manrope": return "Manrope, system-ui, sans-serif"
        case "font-lexend": return "Lexend, system-ui, sans-serif"
        case "font-plus-jakarta": return "'Plus Jakarta Sans', system-ui, sans-serif"
        case "font-ibm-plex": return "'IBM Plex Sans', system-ui, sans-serif"
        case "font-outfit": return "Outfit, system-ui, sans-serif"
        case "font-archivo": return "Archivo, system-ui, sans-serif"
        case "font-public-sans": return "'Public Sans', system-ui, sans-serif"
        case "font-crimson-text": return "'Crimson Text', serif"
        case "font-source-serif": return "'Source Serif 4', serif"
        case "font-pt-serif": return "'PT Serif', serif"
        case "font-libre-baskerville": return "'Libre Baskerville', serif"
        case "font-bitter": return "Bitter, serif"
        case "font-spectral": return "Spectral, serif"
        default: return "Inter, system-ui, sans-serif"
      }
    }

    root.style.setProperty('--font-titles', getFontFamily(appliedTitleFont.cssClass))
    root.style.setProperty('--font-text', getFontFamily(appliedTextFont.cssClass))
  }, [appliedTitleFont, appliedTextFont])

  const applyFonts = () => {
    setAppliedTitleFont(titleFont)
    setAppliedTextFont(textFont)
  }

  const resetFonts = () => {
    setTitleFont(titleFontOptions[0])
    setTextFont(textFontOptions[0])
    setAppliedTitleFont(titleFontOptions[0])
    setAppliedTextFont(textFontOptions[0])
  }

  return (
    <TypographyContext.Provider value={{
      titleFont,
      textFont,
      appliedTitleFont,
      appliedTextFont,
      setTitleFont,
      setTextFont,
      applyFonts,
      resetFonts
    }}>
      {children}
    </TypographyContext.Provider>
  )
}

export function useTypography() {
  const context = useContext(TypographyContext)
  if (context === undefined) {
    throw new Error('useTypography must be used within a TypographyProvider')
  }
  return context
}
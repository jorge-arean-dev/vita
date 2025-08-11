"use client"

import { useState } from "react"

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      
      return true
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const result = document.execCommand("copy")
        textArea.remove()
        
        if (result) {
          setIsCopied(true)
          setTimeout(() => {
            setIsCopied(false)
          }, 2000)
          return true
        }
      } catch (fallbackError) {
        console.error("Fallback copy method also failed:", fallbackError)
      }
      
      return false
    }
  }

  return { copyToClipboard, isCopied }
}
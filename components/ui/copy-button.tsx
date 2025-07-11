"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "ghost" | "outline" | "default"
  disabled?: boolean
  onCopy?: () => void
}

export default function CopyButton({ 
  text, 
  className, 
  size = "sm", 
  variant = "ghost", 
  disabled = false,
  onCopy 
}: CopyButtonProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard()

  const handleCopy = async () => {
    if (disabled || !text) return
    
    const success = await copyToClipboard(text)
    if (success && onCopy) {
      onCopy()
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={disabled || !text}
      className={cn("h-8 w-8 p-0", className)}
      title={isCopied ? "Copied!" : "Copy to clipboard"}
    >
      {isCopied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}
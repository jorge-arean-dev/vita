"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface StableAvatarProps {
  src?: string | null
  alt?: string
  fallback: React.ReactNode
  className?: string
  imageClassName?: string
  fallbackClassName?: string
}

export function StableAvatar({
  src,
  alt = "Avatar",
  fallback,
  className,
  imageClassName,
  fallbackClassName
}: StableAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [lastValidSrc, setLastValidSrc] = useState<string | null>(null)

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
    if (src) {
      setLastValidSrc(src)
    }
  }, [src])

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageLoaded(false)
    setImageError(true)
  }, [])

  // Reset states when src changes
  React.useEffect(() => {
    if (src !== lastValidSrc) {
      setImageLoaded(false)
      setImageError(false)
    }
  }, [src, lastValidSrc])

  // Determine which source to use
  const displaySrc = src || (imageError ? null : lastValidSrc)

  return (
    <Avatar className={className}>
      {displaySrc && (
        <AvatarImage
          src={displaySrc}
          alt={alt}
          className={cn(imageClassName)}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      <AvatarFallback 
        className={cn(
          // Only show fallback when image is not loaded or has error
          !displaySrc || imageError ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
          fallbackClassName
        )}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}
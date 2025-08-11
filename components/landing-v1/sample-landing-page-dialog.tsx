"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { ReactNode } from "react"

interface SampleLandingPageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  className?: string
}

export function SampleLandingPageDialog({
  open,
  onOpenChange,
  title,
  children,
  className = "",
}: SampleLandingPageDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content 
          className={`fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] max-w-[calc(100vw-4rem)] w-full max-h-[calc(100vh-10rem)] h-auto overflow-y-auto sm:max-w-[calc(100vw-6rem)] md:max-w-[calc(100vw-8rem)] bg-white/65 backdrop-blur-lg border border-gray-300/30 rounded-lg shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-500 ${className}`}
        >
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          
          <DialogPrimitive.Title className="text-3xl font-bold text-center mb-6">
            {title}
          </DialogPrimitive.Title>
          
          <div className="space-y-6">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// Example usage:
/*
<SampleLandingPageDialog 
  open={isOpen} 
  onOpenChange={setIsOpen}
  title="About Vita"
>
  <div className="text-center max-w-4xl mx-auto">
    <p className="text-2xl text-gray-700 leading-relaxed font-medium">
      Your co-pilot for recruiting
    </p>
    <p className="mt-4 text-lg text-gray-600">
      Built for independent recruiters, boutique agencies, and niche hiring teams,
      Vita brings together the essential tools you need to run a smarter,
      faster hiring process — all in one place.
    </p>
  </div>
</SampleLandingPageDialog>
*/

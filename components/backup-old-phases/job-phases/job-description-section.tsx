"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import CopyButton from "@/components/ui/copy-button"

interface JobDescriptionSectionProps {
  jobDescription: string
  isEditMode: boolean
  onChange: (description: string) => void
  onCopy?: () => void
}

export default function JobDescriptionSection({ 
  jobDescription, 
  isEditMode, 
  onChange, 
  onCopy 
}: JobDescriptionSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Job Description</Label>
        <CopyButton 
          text={jobDescription}
          onCopy={onCopy}
        />
      </div>
      <Textarea
        value={jobDescription}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Job description will be generated here..."
        rows={12}
        readOnly={!isEditMode}
        className={!isEditMode ? "cursor-default" : ""}
      />
    </div>
  )
}
"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, Info } from "lucide-react"
import type { CandidateFormData, Country } from "../types"

interface PersonalInfoStepProps {
  formData: CandidateFormData
  onChange: (data: Partial<CandidateFormData>) => void
  countries: Country[]
  countrySearchValue: string
  onCountrySearchChange: (value: string) => void
  onCountrySearch: (searchTerm: string) => void
  onCountrySelect: (countryCode: string, countryName: string) => void
  isComboOpen: boolean
  setIsComboOpen: (open: boolean) => void
  showReviewBanner?: boolean
}

export function PersonalInfoStep({
  formData,
  onChange,
  countries,
  countrySearchValue,
  onCountrySearchChange,
  onCountrySearch,
  onCountrySelect,
  isComboOpen,
  setIsComboOpen,
  showReviewBanner
}: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Review banner for automatic upload */}
      {showReviewBanner && (
        <div className="info-indicator">
          <Info className="h-4 w-4" />
          <span>Please review the extracted information below and make any necessary adjustments.</span>
        </div>
      )}
      
      {/* General info banner */}
      <div className="info-indicator">
        <Info className="h-4 w-4" />
        <span>This information can be updated after creation from the candidate profile.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Country <span className="text-red-500">*</span></Label>
          <Popover open={isComboOpen} onOpenChange={setIsComboOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {countrySearchValue || "Select country..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search countries..." 
                  value={countrySearchValue}
                  onValueChange={(value) => {
                    onCountrySearchChange(value)
                    onCountrySearch(value)
                  }}
                />
                <CommandList>
                  <CommandGroup>
                    {countries.map((country) => (
                      <CommandItem
                        key={country.iso_code}
                        value={country.display_name}
                        onSelect={() => {
                          onCountrySelect(country.iso_code, country.display_name)
                          setIsComboOpen(false)
                        }}
                      >
                        {country.display_name}
                      </CommandItem>
                    ))}
                    {countrySearchValue.trim().length > 0 && countries.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No countries found
                      </div>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            placeholder="https://linkedin.com/in/username"
            value={formData.linkedin}
            onChange={(e) => onChange({ linkedin: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            placeholder="https://github.com/username"
            value={formData.github}
            onChange={(e) => onChange({ github: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearsExperience">Years of Experience</Label>
          <Input
            id="yearsExperience"
            type="number"
            step="0.5"
            min="0"
            max="50"
            placeholder="e.g., 3.5"
            value={formData.yearsExperience}
            onChange={(e) => onChange({ yearsExperience: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
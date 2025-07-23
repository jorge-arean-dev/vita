"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface AttributesData {
  rate: {
    value: number | null
    freq: string
  }
  commitment: string
  duration: string
  location: {
    category: string
    regions: string[]
    countries: string[]
  }
}

interface AttributesSectionProps {
  data: AttributesData
  isEditMode: boolean
  onChange: (data: AttributesData) => void
}

// Seed data
const COMMITMENTS = [
  { name: "full_time", display_name: "Full-time" },
  { name: "part_time", display_name: "Part-time" },
  { name: "hourly", display_name: "Hourly" }
]

const DURATIONS = [
  { name: "2_4_weeks", display_name: "2-4 weeks" },
  { name: "4_8_weeks", display_name: "4-8 weeks" },
  { name: "3_6_months", display_name: "3-6 months" },
  { name: "6_12_months", display_name: "6-12 months" },
  { name: "12_plus_months", display_name: "12+ months" },
  { name: "permanent", display_name: "Permanent" }
]

const LOCATION_CATEGORIES = [
  { name: "remote_global", display_name: "Remote (global)" },
  { name: "remote_region_specific", display_name: "Remote (region specific)" },
  { name: "remote_country_specific", display_name: "Remote (country specific)" },
  { name: "hybrid", display_name: "Hybrid" },
  { name: "on_site", display_name: "On-site" }
]

interface Region {
  id: string
  name: string
  display_name: string
}

interface Country {
  id: string
  iso_code: string
  display_name: string
}

export default function AttributesSection({ data, isEditMode, onChange }: AttributesSectionProps) {
  const [regions, setRegions] = useState<Region[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [regionsOpen, setRegionsOpen] = useState(false)
  const [countriesOpen, setCountriesOpen] = useState(false)

  // Fetch regions and countries from database
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      try {
        // Fetch regions
        const { data: regionsData, error: regionsError } = await supabase
          .from('regions')
          .select('id, name, display_name')
          .eq('is_active', true)
          .order('display_name')

        if (regionsError) throw regionsError
        setRegions(regionsData || [])

        // Fetch countries
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('id, iso_code, display_name')
          .eq('is_active', true)
          .order('display_name')

        if (countriesError) throw countriesError
        setCountries(countriesData || [])
      } catch (error) {
        console.error('Error fetching regions/countries:', error)
      }
    }

    fetchData()
  }, [])

  const handleRateChange = (field: 'value' | 'freq', value: string | number) => {
    onChange({
      ...data,
      rate: {
        ...data.rate,
        [field]: field === 'value' ? (value === '' ? null : Number(value)) : value
      }
    })
  }

  const handleLocationCategoryChange = (category: string) => {
    onChange({
      ...data,
      location: {
        ...data.location,
        category,
        // Reset regions/countries when category changes
        regions: [],
        countries: []
      }
    })
  }

  const handleRegionToggle = (regionName: string) => {
    const newRegions = data.location.regions.includes(regionName)
      ? data.location.regions.filter(r => r !== regionName)
      : [...data.location.regions, regionName]
    
    onChange({
      ...data,
      location: {
        ...data.location,
        regions: newRegions
      }
    })
  }

  const handleCountryToggle = (countryCode: string, isMultiple: boolean) => {
    let newCountries: string[]
    
    if (isMultiple) {
      newCountries = data.location.countries.includes(countryCode)
        ? data.location.countries.filter(c => c !== countryCode)
        : [...data.location.countries, countryCode]
    } else {
      // Single selection for hybrid/on-site
      newCountries = data.location.countries.includes(countryCode) ? [] : [countryCode]
    }
    
    onChange({
      ...data,
      location: {
        ...data.location,
        countries: newCountries
      }
    })
  }

  const removeRegion = (regionName: string) => {
    onChange({
      ...data,
      location: {
        ...data.location,
        regions: data.location.regions.filter(r => r !== regionName)
      }
    })
  }

  const removeCountry = (countryCode: string) => {
    onChange({
      ...data,
      location: {
        ...data.location,
        countries: data.location.countries.filter(c => c !== countryCode)
      }
    })
  }

  // Determine if regions/countries should be shown
  const showRegions = data.location.category === "remote_region_specific"
  const showCountries = ["remote_country_specific", "hybrid", "on_site"].includes(data.location.category)
  const isMultipleSelection = data.location.category === "remote_country_specific"

  // Get display names for selected items
  const getRegionDisplayName = (name: string) => regions.find(r => r.name === name)?.display_name || name
  const getCountryDisplayName = (code: string) => countries.find(c => c.iso_code === code)?.display_name || code

  return (
    <div className="space-y-6">
      {/* Rate, Commitment, and Duration in a row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Rate Section - Takes up 4 columns */}
        <div className="md:col-span-4 space-y-2">
          <Label className="text-sm font-medium">Rate</Label>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">$</span>
            <Input
              id="rate-value"
              type="number"
              step="0.1"
              max="999.9"
              value={data.rate.value || ""}
              onChange={(e) => handleRateChange('value', e.target.value)}
              placeholder="80.5"
              readOnly={!isEditMode}
              className={cn("w-20 text-center px-3", !isEditMode ? "cursor-default" : "")}
            />
            <span className="text-sm font-medium">/</span>
            <Select
              value={data.rate.freq}
              onValueChange={(value) => handleRateChange('freq', value)}
              disabled={!isEditMode}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="hour" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">hour</SelectItem>
                <SelectItem value="monthly">month</SelectItem>
                <SelectItem value="yearly">year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Commitment - Takes up 4 columns */}
        <div className="md:col-span-4 space-y-2">
          <Label htmlFor="commitment" className="text-sm font-medium">Commitment</Label>
          <Select
            value={data.commitment}
            onValueChange={(value) => onChange({ ...data, commitment: value })}
            disabled={!isEditMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select commitment" />
            </SelectTrigger>
            <SelectContent>
              {COMMITMENTS.map((commitment) => (
                <SelectItem key={commitment.name} value={commitment.name}>
                  {commitment.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration - Takes up 4 columns */}
        <div className="md:col-span-4 space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium">Duration</Label>
          <Select
            value={data.duration}
            onValueChange={(value) => onChange({ ...data, duration: value })}
            disabled={!isEditMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((duration) => (
                <SelectItem key={duration.name} value={duration.name}>
                  {duration.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Location</Label>
        
        {/* Location Category */}
        <div className="space-y-2">
          <Label htmlFor="location-category" className="text-xs text-muted-foreground">Category</Label>
          <Select
            value={data.location.category}
            onValueChange={handleLocationCategoryChange}
            disabled={!isEditMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location category" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_CATEGORIES.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Regions (shown for remote_region_specific) */}
        {showRegions && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Regions</Label>
            {isEditMode ? (
              <div className="space-y-2">
                <Popover open={regionsOpen} onOpenChange={setRegionsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={regionsOpen}
                      className="w-full justify-between"
                    >
                      {data.location.regions.length > 0
                        ? `${data.location.regions.length} region(s) selected`
                        : "Select regions..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search regions..." />
                      <CommandEmpty>No region found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {regions.map((region) => (
                            <CommandItem
                              key={region.id}
                              value={region.display_name}
                              onSelect={() => handleRegionToggle(region.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.location.regions.includes(region.name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {region.display_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {data.location.regions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.location.regions.map((regionName) => (
                      <Badge
                        key={regionName}
                        variant="outline"
                        className="bg-white border-gray-300"
                      >
                        {getRegionDisplayName(regionName)}
                        <button
                          onClick={() => removeRegion(regionName)}
                          className="ml-1 hover:bg-gray-100 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.location.regions.map((regionName) => (
                  <Badge
                    key={regionName}
                    variant="outline"
                    className="bg-white border-gray-300"
                  >
                    {getRegionDisplayName(regionName)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Countries (shown for remote_country_specific, hybrid, on_site) */}
        {showCountries && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Countries</Label>
            {isEditMode ? (
              <div className="space-y-2">
                <Popover open={countriesOpen} onOpenChange={setCountriesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countriesOpen}
                      className="w-full justify-between"
                    >
                      {data.location.countries.length > 0
                        ? isMultipleSelection 
                          ? `${data.location.countries.length} countr${data.location.countries.length === 1 ? 'y' : 'ies'} selected`
                          : getCountryDisplayName(data.location.countries[0])
                        : "Select countries..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search countries..." />
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {countries.map((country) => (
                            <CommandItem
                              key={country.id}
                              value={country.display_name}
                              onSelect={() => handleCountryToggle(country.iso_code, isMultipleSelection)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.location.countries.includes(country.iso_code) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {country.display_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {data.location.countries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.location.countries.map((countryCode) => (
                      <Badge
                        key={countryCode}
                        variant="outline"
                        className="bg-white border-gray-300"
                      >
                        {getCountryDisplayName(countryCode)}
                        <button
                          onClick={() => removeCountry(countryCode)}
                          className="ml-1 hover:bg-gray-100 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.location.countries.map((countryCode) => (
                  <Badge
                    key={countryCode}
                    variant="outline"
                    className="bg-white border-gray-300"
                  >
                    {getCountryDisplayName(countryCode)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
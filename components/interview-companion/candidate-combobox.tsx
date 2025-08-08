"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { searchCandidates } from "@/app/actions/interviews"

interface Candidate {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface CandidateComboboxProps {
  jobId: string
  value: string
  onValueChange: (value: string) => void
  onCandidateSelect?: (candidate: Candidate) => void
}

export function CandidateCombobox({ 
  jobId, 
  value, 
  onValueChange,
  onCandidateSelect 
}: CandidateComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [candidates, setCandidates] = React.useState<Candidate[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null)

  // Search candidates when search term changes
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const { data, error } = await searchCandidates(jobId, searchTerm)
        if (data) {
          setCandidates(data)
        }
      } catch (error) {
        console.error("Error searching candidates:", error)
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, jobId])

  // Load initial candidates
  React.useEffect(() => {
    const loadCandidates = async () => {
      setLoading(true)
      try {
        const { data, error } = await searchCandidates(jobId, "")
        if (data) {
          setCandidates(data)
        }
      } catch (error) {
        console.error("Error loading candidates:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCandidates()
  }, [jobId])

  const getCandidateName = (candidate: Candidate) => {
    const name = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
    return name || candidate.email || 'Unknown'
  }

  const getCandidateDisplay = (candidate: Candidate) => {
    const name = getCandidateName(candidate)
    return candidate.email && name !== candidate.email 
      ? `${name} (${candidate.email})`
      : name
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCandidate ? (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {getCandidateDisplay(selectedCandidate)}
            </span>
          ) : (
            <span className="text-muted-foreground">Select a candidate...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search candidates..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Searching..." : "No candidates found."}
            </CommandEmpty>
            <CommandGroup>
              {candidates.map((candidate) => (
                <CommandItem
                  key={candidate.id}
                  value={candidate.id}
                  onSelect={(currentValue) => {
                    const selected = candidates.find(c => c.id === currentValue)
                    if (selected) {
                      setSelectedCandidate(selected)
                      onValueChange(currentValue)
                      onCandidateSelect?.(selected)
                      setOpen(false)
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === candidate.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{getCandidateName(candidate)}</span>
                    {candidate.email && (
                      <span className="text-xs text-muted-foreground">{candidate.email}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
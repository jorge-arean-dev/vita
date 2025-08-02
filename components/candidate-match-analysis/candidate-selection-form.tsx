import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, User, UserPlus, Sparkles } from "lucide-react"
import ToggleSlider from "@/components/ui/toggle-slider"
import { Candidate } from "./types"

interface CandidateSelectionFormProps {
  candidateType: "existing" | "new"
  setCandidateType: (type: "existing" | "new") => void
  selectedExistingCandidate: string
  setSelectedExistingCandidate: (id: string) => void
  isCandidateDropdownOpen: boolean
  setIsCandidateDropdownOpen: (open: boolean) => void
  candidateSearchValue: string
  setCandidateSearchValue: (value: string) => void
  newCandidateMethod: "linkedin" | "pdf"
  setNewCandidateMethod: (method: "linkedin" | "pdf") => void
  linkedinUrl: string
  setLinkedinUrl: (url: string) => void
  uploadedFile: File | null
  candidates: Candidate[]
  onCandidateSelect: (candidateId: string) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRunAnalysis: () => void
  canRunAnalysis: boolean
  isRunningAnalysis: boolean
  progressMessage?: string
}

export function CandidateSelectionForm({
  candidateType,
  setCandidateType,
  selectedExistingCandidate,
  setSelectedExistingCandidate,
  isCandidateDropdownOpen,
  setIsCandidateDropdownOpen,
  candidateSearchValue,
  setCandidateSearchValue,
  newCandidateMethod,
  setNewCandidateMethod,
  linkedinUrl,
  setLinkedinUrl,
  uploadedFile,
  candidates,
  onCandidateSelect,
  onFileUpload,
  onRunAnalysis,
  canRunAnalysis,
  isRunningAnalysis,
  progressMessage
}: CandidateSelectionFormProps) {
  
  // Filter candidates based on search input
  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(candidateSearchValue.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Candidate Type Selection */}
      <div className="flex justify-center">
        <ToggleSlider
          option1="New Candidate"
          option2="Existing Candidate"
          icon1={<UserPlus className="h-4 w-4" />}
          icon2={<User className="h-4 w-4" />}
          defaultOption={candidateType === "new" ? 1 : 2}
          onChange={(option) => setCandidateType(option === 1 ? "new" : "existing")}
        />
      </div>

      {/* Existing Candidate Section */}
      {candidateType === "existing" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Candidate</Label>
            <Popover open={isCandidateDropdownOpen} onOpenChange={setIsCandidateDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isCandidateDropdownOpen}
                  className="w-full justify-between"
                >
                  {selectedExistingCandidate 
                    ? candidates.find(c => c.id === selectedExistingCandidate)?.name
                    : "Select candidate..."
                  }
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search candidates..." 
                    value={candidateSearchValue}
                    onValueChange={setCandidateSearchValue}
                    className="border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
                  />
                  <CommandList>
                    <CommandGroup>
                      {candidateSearchValue.trim().length > 0 && filteredCandidates.map((candidate) => (
                        <CommandItem
                          key={candidate.id}
                          value={candidate.name}
                          onSelect={() => onCandidateSelect(candidate.id)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          {candidate.name}
                          {candidate.email && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({candidate.email})
                            </span>
                          )}
                        </CommandItem>
                      ))}
                      {candidateSearchValue.trim().length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Start typing to search candidates...
                        </div>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* New Candidate Section */}
      {candidateType === "new" && (
        <div className="space-y-4">
          <div className="space-y-4">
            <Label>Input Method</Label>
            <RadioGroup 
              value={newCandidateMethod} 
              onValueChange={(value) => setNewCandidateMethod(value as "linkedin" | "pdf")}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="linkedin" id="linkedin" />
                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF Resume Upload</Label>
              </div>
            </RadioGroup>
            
            {/* Input fields below radio buttons */}
            {newCandidateMethod === "linkedin" && (
              <Input
                placeholder="https://linkedin.com/in/candidate-name"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            )}
            
            {newCandidateMethod === "pdf" && (
              <div>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={onFileUpload}
                  className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer cursor-pointer"
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Run Analysis Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={onRunAnalysis}
          disabled={!canRunAnalysis || isRunningAnalysis}
          className="w-full"
        >
          <Sparkles className={`mr-2 h-4 w-4 ${isRunningAnalysis ? "animate-spin" : ""}`} />
          {isRunningAnalysis ? "Analyzing candidate..." : "Run Analysis"}
        </Button>
        {/* Progress Message */}
        {progressMessage && (
          <p className="text-sm text-muted-foreground text-center mt-2 animate-pulse">
            {progressMessage}
          </p>
        )}
      </div>
    </div>
  )
}